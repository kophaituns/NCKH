#!/usr/bin/env python3
"""
RAG Form Generation Server
Architecture: ChromaDB (Retrieve) + Gemini (Generate)

Flow:
  1. User sends keyword
  2. ChromaDB finds top-K semantically similar questions (local, offline)
  3. Retrieved questions become context for Gemini
  4. Gemini formats context into a complete form JSON
  5. Return structured form to Frontend

Run:
  .venv/Scripts/python.exe rag_server.py
  Docs: http://localhost:8000/docs
"""

import os
import sys
import json
import logging
import re
import uuid
import trafilatura
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from validation_agent import ValidationAgent
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from chroma_ingestor import ingest_data

# Windows DLL fix for torch / sentence-transformers
if os.name == 'nt':
    for p in [
        os.path.join(sys.prefix, 'Lib', 'site-packages', 'torch', 'lib'),
        r"D:\NCKH\form-agent-AI-project\.venv\Lib\site-packages\torch\lib"
    ]:
        if os.path.exists(p):
            try:
                os.add_dll_directory(p)
            except Exception:
                pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
import uvicorn

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Suppress noisy library logs
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)
logging.getLogger("transformers").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL     = "gemini-flash-latest"
CHROMA_PATH      = Path("chroma_db")
COLLECTION_GLOBAL  = "question_bank"
COLLECTION_REFINED = "human_refined"
LOG_DIR          = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
RETRIEVE_K       = 15
DEFAULT_NUM_Q    = 7

# ---------------------------------------------------------------------------
# GEMINI INIT
# ---------------------------------------------------------------------------
gemini_ready = False
gemini_model = None

if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    try:
        gemini_model = genai.Client(api_key=GEMINI_API_KEY)
        gemini_ready = True
        logger.info("Gemini ready: %s", GEMINI_MODEL)
    except Exception as exc:
        logger.warning("Gemini init failed: %s", exc)
else:
    logger.warning("GEMINI_API_KEY not set — running in ChromaDB-only fallback mode.")

# ---------------------------------------------------------------------------
# CHROMADB INIT
# ---------------------------------------------------------------------------
chroma_ai = None

try:
    from chroma_question_ai import ChromaQuestionAI
    chroma_ai = ChromaQuestionAI(persistence_path=CHROMA_PATH)
    count = chroma_ai.collection.count() if chroma_ai.collection else 0
    logger.info("ChromaDB ready: %d vectors", count)
except Exception as exc:
    logger.error("ChromaDB init failed: %s", exc)

# ---------------------------------------------------------------------------
# FASTAPI
# ---------------------------------------------------------------------------
app = FastAPI(
    title="RAG Form Generator API",
    description="ChromaDB Semantic Retrieval + Gemini Generation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateFormRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000, description="Natural language prompt, e.g. 'Tạo form đăng kí marathon'")
    language: Optional[str] = Field("vi", description="vi or en")
    num_questions: Optional[int] = Field(DEFAULT_NUM_Q, ge=3, le=20)
    workspace_id: Optional[str] = Field(None, description="Identify the isolated context for RAG")
    visibility_scope: Optional[str] = Field("all", description="all | private | global")


# ---------------------------------------------------------------------------
# RAG PIPELINE
# ---------------------------------------------------------------------------
@retry(
    wait=wait_exponential(multiplier=0.5, min=1, max=10),
    stop=stop_after_attempt(2),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
def _gemini_call_wrapper(prompt: str, mime_type: str = "application/json"):
    """Internal wrapper with retry logic for Gemini."""
    if not gemini_ready: return None
    response = gemini_model.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
            response_mime_type=mime_type,
        ),
    )
    return response.text.strip()

def analyze_intent(user_prompt: str) -> dict:
    """Stage 1: Use Gemini to understand what the user REALLY wants."""
    if not gemini_ready or not gemini_model:
        return {"intent": "survey", "keywords": user_prompt, "category": "it"}
    
    analysis_prompt = f"""Analyze this user prompt for a form generation task: "{user_prompt}"
    
    SPECIAL TASK: If the user explicitly mentions specific counts for question types (e.g. "3 multiple choice, 2 open ended"), extract them into the 'distribution' object. 
    Notes: 'quant' = single/multiple choice/likert; 'mixed' = rating; 'qual' = open-ended/text.
    
    Return a STRICT JSON object:
    {{
      "intent": "survey | registration | feedback | quiz | contact",
      "keywords": "3-5 optimized search terms separated by commas",
      "category": "it | economics | marketing | general",
      "language": "vi | en",
      "tone": "professional | casual | academic",
      "distribution": {{ "quant": int, "mixed": int, "qual": int }},
      "extra_fields": ["standard fields needed, e.g. Full Name"]
    }}
    If no explicit counts are mentioned, set 'distribution' to null."""
    
    try:
        raw_response = _gemini_call_wrapper(analysis_prompt)
        result = json.loads(raw_response)
        logger.info("Audit: Intent Analysis [In: %s] [Out: %s]", user_prompt, result)
        return result
    except Exception as exc:
        logger.error("Intent analysis failed: %s", exc)
        return {"intent": "survey", "keywords": user_prompt, "category": "it"}


def normalize_scores(items: list) -> list:
    """Apply Min-Max scaling to similarity scores within a set of results."""
    if not items: return []
    scores = [item.get("similarity_score", 0) for item in items]
    min_s = min(scores)
    max_s = max(scores)
    
    if max_s == min_s:
        for item in items: item["normalized_score"] = 1.0 if max_s > 0 else 0.0
    else:
        for item in items:
            item["normalized_score"] = (item["similarity_score"] - min_s) / (max_s - min_s)
    return items

def retrieve_questions(keyword: str, k: int = RETRIEVE_K) -> list:
    if not chroma_ai:
        return []
    
    try:
        # Dual-Stream Retrieval
        all_candidate_pools = []
        
        # 1. Search Human Refined (Priority Memory)
        try:
            refined = chroma_ai.query_questions(keyword, num_results=k, collection_name=COLLECTION_REFINED)
            if refined:
                for r in refined:
                    r["source"] = "human_refined"
                    # Apply Min-Max score & Human Boost
                    base_score = r["normalized_score"] * 1.5 
                    
                    # Apply Frequency Boost (Selection Bias)
                    # Formula: 1.0 + log2(count + 1) * 0.2
                    import math
                    l_count = r.get("launch_count", 0)
                    freq_boost = 1.0 + (math.log2(l_count + 1) * 0.2)
                    
                    r["final_score"] = base_score * freq_boost
                all_candidate_pools.extend(refined)
        except Exception:
            pass
            
        # 2. Search Global Bank
        global_res = chroma_ai.query_questions(keyword, num_results=k, collection_name=COLLECTION_GLOBAL)
        if global_res:
            global_res = normalize_scores(global_res)
            for r in global_res:
                r["source"] = "global_bank"
                r["final_score"] = r["normalized_score"] # Baseline 1.0 multiplier
            all_candidate_pools.extend(global_res)
        
        # Sort by boosted normalized score
        results = sorted(all_candidate_pools, key=lambda x: x.get("final_score", 0), reverse=True)
        
        # Diversity Filter (Content-based re-check to ensure no duplicates after merge)
        seen_questions = set()
        unique_results = []
        for r in results:
            q_norm = r["question"].strip().lower()
            if q_norm not in seen_questions:
                unique_results.append(r)
                seen_questions.add(q_norm)
        
        return unique_results[:k]
    except Exception as exc:
        logger.error("ChromaDB query error: %s", exc)
        return []

def retrieve_questions_with_filter(keyword: str, k: int = RETRIEVE_K, workspace_id: str = None, scope: str = "all") -> list:
    """Enhanced retrieval with metadata filtering for Isolated Workspaces."""
    if not chroma_ai: return []
    
    # Construct Chroma 'where' filter
    where_filter = {}
    if scope == "global":
        where_filter = {"visibility": "global"}
    elif scope == "private" and workspace_id:
        where_filter = {"workspace_id": workspace_id}
    elif scope == "all" and workspace_id:
        # User's WS + Global
        where_filter = {"$or": [{"visibility": "global"}, {"workspace_id": workspace_id}]}
    
    try:
        # For simplicity, we search global collection only for now, 
        # but apply the metadata filter which handles the visibility logic.
        results = chroma_ai.query_questions(keyword, num_results=k, where_filter=where_filter if where_filter else None)
        return results
    except Exception as exc:
        logger.error(f"Filtered retrieval failed: {exc}")
        return []

def log_grounding_data(keywords: str, retrieved: list):
    """Debug utility to show what we are sending for grounding."""
    print("\n" + "="*80)
    print(f"DEBUG: GROUNDING DATA FOR KEYWORDS: [{keywords}]")
    print(f"SOURCE: ChromaDB Memory")
    print("-" * 80)
    if not retrieved:
        print("!!! NO DATA FOUND IN CHROMADB — AI WILL OPERATE IN ZERO-SHOT MODE !!!")
    else:
        for i, r in enumerate(retrieved):
            print(f"[{i+1}] (Dist: {r.get('similarity_score', 'N/A')}) {r['question']}")
    print("="*80)

def build_prompt(user_input: str, intent_info: dict, retrieved: list, num_q: int, form_type: str = "survey", fine_tune: str = "", language: str = "vi") -> str:
    """Stage 3: Build the final grounded prompt with Structured Knowledge Context."""
    
    # 0. Intent-to-Architecture Sync (Reasoning-Execution Bridge)
    # Map intent names to internal architecture instruction sets
    intent_to_arch = {
        "registration": "registration",
        "quiz": "assessment",
        "feedback": "survey",
        "survey": "survey",
        "contact": "application"
    }
    active_arch = intent_to_arch.get(intent_info.get("intent", "").lower(), form_type)
    
    # 1. Calculate Question Distribution
    def get_distribution(n, f_type, explicit_dist=None):
        # PRIORITY 1: Explicit user-requested counts
        if explicit_dist and any(v > 0 for v in explicit_dist.values()):
            q_quant = explicit_dist.get("quant", 0)
            q_mixed = explicit_dist.get("mixed", 0)
            q_qual = explicit_dist.get("qual", 0)
            
            # Normalize to match requested n if total does not match perfectly
            total_req = q_quant + q_mixed + q_qual
            if total_req > 0 and total_req != n:
                q_quant = round(q_quant * n / total_req)
                q_mixed = round(q_mixed * n / total_req)
                q_qual = max(0, n - q_quant - q_mixed)
            return q_quant, q_mixed, q_qual

        # PRIORITY 2: Architectural defaults
        if f_type == "survey":
            quant = max(1, round(n * 0.6))
            mixed = max(1, round(n * 0.2))
            qual = max(1, n - quant - mixed)
            return quant, mixed, qual
        elif f_type == "assessment":
            quant = max(1, round(n * 0.8))
            return quant, 0, n - quant
        elif f_type in ("registration", "application"):
            quant = max(1, round(n * 0.3))
            return quant, 0, n - quant
        return n, 0, 0

    x_quant, y_mixed, z_qual = get_distribution(num_q, active_arch, intent_info.get("distribution"))
    
    # 2. Structured JSON Context Building
    grounding_context = []
    for r in retrieved:
        grounding_context.append({
            "text": r["question"],
            "suggested_type": r.get("question_type", "text"),
            "category": r.get("category", "general"),
            "source": r.get("source", "Memory Bank"),
            "fidelity_score": r.get("final_score", 0)
        })
    context_json = json.dumps(grounding_context, indent=2)

    # 3. Architecture Instructions
    ui_mapping = {
        "survey": "stepper_scroll",
        "assessment": "single_question_step",
        "registration": "classic_form",
        "application": "section_based"
    }
    target_ui = ui_mapping.get(active_arch, "stepper_scroll")

    architecture_instructions = {
        "survey": f"OBJECTIVE MEASUREMENT. UI Mode: {target_ui}. Target: {x_quant} quant, {y_mixed} mixed, {z_qual} qual.",
        "assessment": f"COMPETENCY TESTING. UI Mode: {target_ui}. Target: {x_quant} MCQ and {z_qual} reasoning items.",
        "registration": f"DATA INTAKE. UI Mode: {target_ui}. Focus: Profile fields + {x_quant} preference checks.",
        "application": f"SCREENING. UI Mode: {target_ui}. Structured: {x_quant} criteria check, {z_qual} narrative items."
    }

    prompt = f"""You are SIR-AG v2.1 "Research Executive" AI.
Response Language Rules: If language is 'vi', return Vietnamese. Otherwise, return English.
Current Target Language: {language.upper()}

[1] RESEARCH CONTEXT:
- PRIMARY GOAL: "{user_input}"
- ARCHITECTURE: {active_arch.upper()}
- UI BEHAVIOR: {target_ui}
- TONE: {intent_info.get('tone', 'professional')}

[2] STRUCTURED KNOWLEDGE LIBRARY (GROUNDING SOURCE):
{context_json if grounding_context else 'NO RELEVANT DATA FOUND. GO ZERO-SHOT.'}

[3] ARCHITECTURAL REQUIREMENTS:
{architecture_instructions.get(active_arch, architecture_instructions["survey"])}

[4] MANDATORY EXECUTION RULES:
1. FIDELITY: 100% Grounded logic.
2. UI ALIGNMENT: Ensure questions and options match the {target_ui} flow.
3. OUTPUT QUANTITY: strictly return {num_q} questions.
4. SCHEMA CONSISTENCY: strictly follow the JSON SCHEMA below.

[5] JSON OUTPUT SCHEMA:
{{
  "form_id": "{uuid.uuid4().hex[:8]}",
  "title": "Scientific Title",
  "description": "Executive summary",
  "questions": [
    {{
      "id": "q1",
      "question": "Question content",
      "type": "single_choice | multiple_choice | likert_scale | rating | text",
      "required": true,
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    }}
  ],
  "metadata": {{
    "expected_insights": "Detailed analysis",
    "grounding_fidelity": 0.0 to 1.0,
    "ui_hint": "{target_ui}",
    "ratio_applied": "{x_quant}-{y_mixed}-{z_qual}"
  }}
}}"""
    return prompt

def validate_response(data: Any, requested_n: int) -> bool:
    """Rigid validation of the AI output structure."""
    if not isinstance(data, dict): return False
    if "questions" not in data or not isinstance(data["questions"], list): return False
    
    # Check question count (allow small tolerance if semantic grouping happened, but ideally exact)
    # Actually, let's allow +/- 1 for flexibility, but strictly check field names
    for q in data["questions"]:
        if not all(k in q for k in ("question", "type", "id")): return False
        if q["type"] in ("single_choice", "multiple_choice", "likert_scale") and not q.get("options"):
            return False
    return True

def call_gemini(prompt: str, requested_n: int) -> dict | None:
    if not gemini_ready or not gemini_model:
        return None
    try:
        raw = _gemini_call_wrapper(prompt)
        if not raw: return None
        
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        result = json.loads(raw)
        
        # Validation Layer
        if not validate_response(result, requested_n):
            logger.warning("Gemini output failed validation. Activating Fallback.")
            return None
            
        # Traffic Capture (Audit Log)
        log_file = LOG_DIR / f"rag_traffic_{datetime.now().strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "timestamp": datetime.now().isoformat(),
                "type": "generation",
                "prompt_sample": prompt[:200] + "...",
                "response": result
            }, ensure_ascii=False) + "\n")
            
        return result
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return None


def build_fallback_form(keyword: str, retrieved: list, num_q: int, language: str) -> dict:
    """Direct ChromaDB result with standardized schema."""
    questions = []
    for i, r in enumerate(retrieved[:num_q]):
        q_type = r.get("question_type", "text")
        entry = {
            "id": f"q{i+1}",
            "question": r["question"],
            "type": q_type,
            "required": True,
            "options": r.get("options", [])
        }
        
        # Heuristic for missing options in fallback
        if not entry["options"] and q_type in ("single_choice", "multiple_choice", "likert_scale", "rating"):
            if q_type == "rating":
                entry["options"] = ["1", "2", "3", "4", "5"]
            elif q_type == "likert_scale":
                entry["options"] = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
            else:
                entry["options"] = ["Option A", "Option B", "Option C", "Option D"]
                
        questions.append(entry)

    return {
        "form_id": uuid.uuid4().hex[:8],
        "title": f"{keyword.title()} Research Blueprint",
        "description": f"Automated grounded projection for: {keyword}",
        "questions": questions,
        "metadata": {
            "expected_insights": "Direct knowledge highlights from the library (Grounded Fallback).",
            "grounding_fidelity": retrieved[0].get("similarity_score", 0) if retrieved else 0.0,
            "generation_method": "fallback_chromadb"
        },
    }


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "name": "RAG Form Generator",
        "version": "2.0.0",
        "mode": "RAG (ChromaDB + Gemini)" if gemini_ready else "Fallback (ChromaDB only)",
        "gemini_ready": gemini_ready,
        "chromadb_ready": chroma_ai is not None and chroma_ai.collection is not None,
        "endpoints": {
            "generate_form": "POST /api/generate-form",
            "health":        "GET  /health",
            "docs":          "GET  /docs",
        },
    }


@app.get("/health")
async def health():
    chroma_count = 0
    if chroma_ai and chroma_ai.collection:
        try:
            chroma_count = chroma_ai.collection.count()
        except Exception:
            pass
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini": {"ready": gemini_ready, "model": GEMINI_MODEL},
        "chromadb": {"ready": chroma_ai is not None, "vector_count": chroma_count},
    }


@app.post("/api/generate-form")
async def generate_form(request: GenerateFormRequest):
    """
    SIR-AG v2.1 Stage-based Generation.
    """
    prompt_text = request.prompt
    if not prompt_text:
        raise HTTPException(status_code=400, detail="prompt required")

    # Step 1: Analyze Intent (Logic Layer)
    intent_info = analyze_intent(prompt_text)
    
    # Step 2: Multi-tier Retrieval (Memory Layer)
    # Query Expansion: Search both raw prompt and AI-optimized keywords
    search_query = f"{prompt_text} {intent_info.get('keywords', '')}"
    retrieved = retrieve_questions(search_query, k=RETRIEVE_K)
    
    # Step 3: Synthesis (Intelligence Layer)
    form_data = None
    if gemini_ready:
        final_prompt = build_prompt(prompt_text, intent_info, retrieved, request.num_questions or DEFAULT_NUM_Q, language=request.language or "en")
        form_data = call_gemini(final_prompt, request.num_questions or DEFAULT_NUM_Q)

    # Step 4: Fallback (Reliability Layer)
    if not form_data:
        form_data = build_fallback_form(prompt_text, retrieved, request.num_questions or DEFAULT_NUM_Q, request.language or "vi")

    return JSONResponse(content=form_data)


@app.post("/api/ingest")
async def trigger_ingestion():
    """Trigger the U-Ingestor to sync files from user_data."""
    try:
        # Run ingestion in the background or synchronously if it's small
        # For now, we run it sync for simplicity but could use BackgroundTasks
        ingest_data(sample_limit=None)  # Full ingest
        return {"success": True, "message": "Ingestion complete."}
    except Exception as exc:
        logger.error("Ingestion failed: %s", exc)
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})


class LearnRequest(BaseModel):
    prompt: str
    questions: list # List of question text strings


@app.post("/api/memory/wipe")
async def wipe_all_memory():
    """RKD: Complete purge of ALL knowledge bases (Genesis Procedure)."""
    if not chroma_ai:
        return JSONResponse(status_code=503, content={"success": False, "error": "AI Memory not ready"})
    
    try:
        # Clear Refined
        s1 = chroma_ai.reset_collection(collection_name=COLLECTION_REFINED)
        # Clear Global
        s2 = chroma_ai.reset_collection(collection_name=COLLECTION_GLOBAL)
        
        return {
            "success": s1 and s2, 
            "message": "Project Genesis: System memory cleared. Ready for rebuilding.",
            "refined_cleared": s1,
            "global_cleared": s2
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

@app.delete("/api/memory")
async def reset_priority_memory():
    """RKD: Clear the human-refined priority memory collection."""
    if not chroma_ai:
        return JSONResponse(status_code=503, content={"success": False, "error": "AI Memory not ready"})
    
    try:
        success = chroma_ai.reset_collection(collection_name=COLLECTION_REFINED)
        return {"success": success, "message": "Priority memory cleared successfully. AI will now use baseline knowledge."}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

class LearnRequest(BaseModel):
    questions: list # List of question text strings
    collection_name: Optional[str] = COLLECTION_REFINED

@app.post("/api/learn")
async def learn_from_feedback(request: LearnRequest):
    """RKD: Ingest a list of validated questions into the specified collection."""
    if not chroma_ai:
        return JSONResponse(status_code=503, content={"success": False, "error": "AI Memory not ready"})
    
    try:
        data_to_upsert = [
            {
                "question": q, 
                "metadata": {
                    "source": "genesis_bootstrap" if request.collection_name == COLLECTION_GLOBAL else "human_feedback",
                    "ingested_at": str(datetime.now().isoformat())
                }
            } for q in request.questions
        ]
        success = chroma_ai.upsert_questions(data_to_upsert, collection_name=request.collection_name)
        
        return {
            "success": success, 
            "count": len(request.questions), 
            "collection": request.collection_name,
            "message": f"Successfully integrated {len(request.questions)} pillars into {request.collection_name}."
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

# --- PROJECT OMEGA ENDPOINTS ---

class IngestUrlRequest(BaseModel):
    url: str
    workspace_id: str
    promote_to_global: Optional[bool] = False

class IngestTextRequest(BaseModel):
    title: str
    text: str
    workspace_id: str
    promote_to_global: Optional[bool] = False

validator = ValidationAgent(api_key=GEMINI_API_KEY)

@app.post("/api/ingest/url")
async def ingest_url(request: IngestUrlRequest):
    """PROJECT OMEGA: Scrape URL, Validate, and Ingest into ChromaDB."""
    try:
        downloaded = trafilatura.fetch_url(request.url)
        if not downloaded:
            return JSONResponse(status_code=400, content={"success": False, "error": "Could not reach URL"})
        
        content = trafilatura.extract(downloaded)
        if not content:
            return JSONResponse(status_code=400, content={"success": False, "error": "No meaningful text found in URL"})
        
        # 1. Validate Quality
        report = validator.validate_content(content, source_info=request.url)
        if not report.get("is_valid"):
            return JSONResponse(status_code=422, content={
                "success": False, 
                "error": "Quality Gatekeeper rejected this content",
                "report": report
            })

        # 2. Convert text to "Questions" (Pillars)
        # Use Gemini to extract key research pillars from the text
        extraction_prompt = f"Extract exactly 5-10 research questions or key knowledge pillars from this text. Return only a JSON list of strings.\n\nTEXT:\n{content[:5000]}"
        raw_pillars = _gemini_call_wrapper(extraction_prompt)
        pillars = json.loads(raw_pillars)

        # 3. Upsert into Chroma with Metadata
        data_to_upsert = [
            {
                "question": p,
                "metadata": {
                    "source_url": request.url,
                    "workspace_id": request.workspace_id,
                    "visibility": "global" if (request.promote_to_global and report.get("overall_score", 0) > 85) else "private",
                    "quality_score": report.get("overall_score", 0),
                    "ingested_at": str(datetime.now().isoformat())
                }
            } for p in pillars
        ]
        
        success = chroma_ai.upsert_questions(data_to_upsert)
        
        return {
            "success": success,
            "count": len(pillars),
            "quality_report": report,
            "visibility": data_to_upsert[0]["metadata"]["visibility"]
        }
    except Exception as exc:
        logger.error(f"URL Ingestion failed: {exc}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

@app.post("/api/ingest/text")
async def ingest_text(request: IngestTextRequest):
    """PROJECT OMEGA: Process raw text snippet and integrate into intelligence bank."""
    try:
        # 1. Validate Quality
        report = validator.validate_content(request.text, source_info=f"Manual Input: {request.title}")
        if not report.get("is_valid"):
            return JSONResponse(status_code=422, content={"success": False, "error": "Low quality content rejected", "report": report})

        # 2. Extract Pillars
        extraction_prompt = f"Extract exactly 3-5 research questions/pillars from this text. Return a JSON list of strings.\n\nTEXT:\n{request.text[:5000]}"
        raw_pillars = _gemini_call_wrapper(extraction_prompt)
        pillars = json.loads(raw_pillars)

        # 3. Upsert
        data_to_upsert = [
            {
                "question": p,
                "metadata": {
                    "source_title": request.title,
                    "workspace_id": request.workspace_id,
                    "visibility": "global" if (request.promote_to_global and report.get("overall_score", 0) > 85) else "private",
                    "quality_score": report.get("overall_score", 0),
                    "ingested_at": str(datetime.now().isoformat())
                }
            } for p in pillars
        ]
        success = chroma_ai.upsert_questions(data_to_upsert)
        
        return {
            "success": success,
            "count": len(pillars),
            "quality_report": report
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})

@app.get("/api/status")
async def status():
    chroma_count = 0
    if chroma_ai and chroma_ai.collection:
        try:
            chroma_count = chroma_ai.collection.count()
        except Exception:
            pass
            
    # Calculate storage stats
    total_files = 0
    total_size_bytes = 0
    if os.path.exists("user_data"):
        for f in os.listdir("user_data"):
            f_path = os.path.join("user_data", f)
            if os.path.isfile(f_path):
                total_files += 1
                total_size_bytes += os.path.getsize(f_path)
    
    # Load processed count from checkpoint
    processed_count = 0
    try:
        if os.path.exists("logs/ingestion_checkpoint.json"):
            with open("logs/ingestion_checkpoint.json", "r") as f:
                ckpt = json.load(f)
                processed_count = len(ckpt.get("processed_files", []))
    except Exception:
        pass

    return {
        "gemini_api_key_configured": bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE"),
        "gemini_model": GEMINI_MODEL,
        "chromadb_path": str(CHROMA_PATH),
        "chromadb_vectors": chroma_count,
        "storage": {
            "total_files": total_files,
            "processed_files": processed_count,
            "total_size_mb": round(total_size_bytes / (1024 * 1024), 2),
            "sync_percent": round((processed_count / total_files * 100), 1) if total_files > 0 else 0
        },
        "retrieve_k": RETRIEVE_K,
        "default_num_questions": DEFAULT_NUM_Q,
    }



# ---------------------------------------------------------------------------
# COMPATIBILITY ENDPOINTS (matches what Backend/trained-model.service.js calls)
# ---------------------------------------------------------------------------

class GenerateQuestionsRequest(BaseModel):
    # Support both single keyword (legacy) and multi-keywords (v2)
    keyword: Optional[str] = Field(None, min_length=1, max_length=500)
    keywords: Optional[List[str]] = Field(default_factory=list)
    
    num_questions: Optional[int] = Field(DEFAULT_NUM_Q, ge=1, le=50)
    category: Optional[str] = Field("general")
    category_hint: Optional[str] = Field(None)
    offset: Optional[int] = Field(0, ge=0)
    
    # GẤU v2 Features
    form_type: Optional[str] = Field("survey")
    fine_tune_note: Optional[str] = Field("")
    language: Optional[str] = Field("en")


class PredictCategoryRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=500)


class BatchGenerateRequest(BaseModel):
    keywords: list
    num_questions: Optional[int] = Field(DEFAULT_NUM_Q, ge=1, le=20)


@app.post("/api/generate-questions")
async def generate_questions_compat(request: GenerateQuestionsRequest):
    """
    GẤU SIR-AG v2 Gấu Pipeline — called by Node.js Backend.
    Handles Multi-keywords, Form Architectures, and Fine-tuning.
    """
    keywords = request.keywords or ([request.keyword] if request.keyword else [])
    num_q    = request.num_questions or DEFAULT_NUM_Q
    offset   = request.offset or 0
    language = request.language or "en"
    
    if not keywords:
        raise HTTPException(status_code=400, detail="At least one keyword is required.")

    logger.info(">>> [GAU PIPELINE] keywords=%s n=%d form_type=%s", keywords, num_q, request.form_type)

    # 1. Multi-tier Retrieval Aggregate
    retrieved_all = []
    seen_ids = set()
    
    # Pre-process keywords: split by comma if a single pill contains multi-concepts
    expanded_keywords = []
    for kw in keywords:
        if "," in kw:
            expanded_keywords.extend([sub.strip() for sub in kw.split(",") if sub.strip()])
        else:
            expanded_keywords.append(kw.strip())
    
    # Retrieve for each resolved keyword and merge
    for kw in expanded_keywords:
        k_results = retrieve_questions(kw, k=RETRIEVE_K)
        for r in k_results:
            # Defensive deduplication: Use ID if exists, otherwise fallback to question text
            q_uid = r.get("id") or r.get("question")
            if q_uid not in seen_ids:
                retrieved_all.append(r)
                seen_ids.add(q_uid)
    
    # Sort by similarity score across all results
    retrieved_all = sorted(retrieved_all, key=lambda x: x.get("similarity_score", 0), reverse=True)

    # Log the grounding data for audit
    log_grounding_data(", ".join(keywords), retrieved_all[:RETRIEVE_K])

    if not retrieved_all:
        return JSONResponse(content={
            "success": False,
            "questions": [],
            "error": "No grounded knowledge found for these library pillars."
        })

    # Apply offset for diversity
    retrieved_slice = retrieved_all[offset:offset + num_q]

    # 3. Reasoning & Synthesis (Gemini)
    form_data = None
    if gemini_ready:
        # Use first keyword or join them for the goal description
        goal_text = ", ".join(keywords)
        
        # Step 2.5: Analyze Intent for Compat Endpoint
        intent_info = analyze_intent(goal_text)
        
        prompt = build_prompt(
            user_input=goal_text,
            intent_info=intent_info,
            retrieved=retrieved_slice,
            num_q=num_q,
            form_type=request.form_type,
            fine_tune=request.fine_tune_note,
            language=language
        )
        form_data = call_gemini(prompt, num_q)

    # 4. Standardized Output Normalization
    final_questions = []
    
    if form_data and "questions" in form_data:
        raw_questions = form_data.get("questions", [])
        for i, q in enumerate(raw_questions):
            final_questions.append({
                "id": q.get("id", f"q{i+1}"),
                "question": q.get("question", ""),
                "type": q.get("type", "text"),
                "required": q.get("required", True),
                "options": q.get("options", []),
                "category": request.category or "general",
                "method": "gau_v2_intelligence"
            })
        metadata_out = {
            "expected_insights": form_data.get("metadata", {}).get("expected_insights", "N/A"),
            "can_regenerate": len(retrieved_all) > offset + num_q,
            "fidelity": form_data.get("metadata", {}).get("grounding_fidelity", 1.0),
            "ui_hint": form_data.get("metadata", {}).get("ui_hint", "stepper_scroll")
        }
    else:
        # Grounded Fallback (Knowledge Highlights)
        fallback_ui = "stepper_scroll"
        if request.form_type == "assessment": fallback_ui = "single_question_step"
        elif request.form_type == "registration": fallback_ui = "classic_form"
        
        for i, r in enumerate(retrieved_slice):
            # Fallback Option Heuristic
            f_type = r.get("question_type", "text")
            f_options = r.get("options", [])
            if not f_options:
                if f_type == "rating": f_options = ["1", "2", "3", "4", "5"]
                elif f_type == "likert_scale": f_options = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                elif f_type in ("single_choice", "multiple_choice"): f_options = ["Option A", "Option B", "Option C"]

            final_questions.append({
                "id": f"q{i+1}",
                "question": r["question"],
                "type": f_type,
                "required": True,
                "options": f_options,
                "category": r.get("category", request.category),
                "confidence": r.get("similarity_score", 0),
                "method": "gau_v2_grounded_fallback"
            })
        metadata_out = {
            "expected_insights": "Direct knowledge highlights from the library (Grounded Fallback).",
            "can_regenerate": len(retrieved_all) > offset + num_q,
            "fidelity": retrieved_slice[0].get("similarity_score", 0) if retrieved_slice else 0,
            "ui_hint": fallback_ui
        }

    return JSONResponse(content={
        "success": True,
        "questions": final_questions,
        "metadata": metadata_out
    })


@app.post("/api/predict-category")
async def predict_category_compat(request: PredictCategoryRequest):
    """
    Compatibility endpoint — called by Backend trained-model.service.js.
    Uses ChromaDB results to determine the most likely category for a keyword.
    """
    keyword = request.keyword.strip()
    if not keyword:
        raise HTTPException(status_code=400, detail="keyword must not be empty")

    retrieved = retrieve_questions(keyword, k=5)
    if not retrieved:
        return JSONResponse(content={
            "success": False,
            "category": "it",
            "confidence": 0.0,
            "keyword": keyword,
        })

    # Vote: most common category among top results
    from collections import Counter
    cat_counts = Counter(r.get("category", "it") for r in retrieved)
    top_cat, top_count = cat_counts.most_common(1)[0]
    confidence = round(top_count / len(retrieved), 2)

    return JSONResponse(content={
        "success": True,
        "keyword": keyword,
        "category": top_cat,
        "confidence": confidence,
        "all_categories": dict(cat_counts),
    })


@app.post("/api/batch-generate")
async def batch_generate_compat(request: BatchGenerateRequest):
    """
    Compatibility endpoint — called by Backend trained-model.service.js.
    Generates questions for multiple keywords.
    """
    results = []
    for kw in request.keywords[:10]:  # Cap at 10 keywords per batch
        retrieved = retrieve_questions(str(kw), k=RETRIEVE_K)
        if not retrieved:
            results.append({"keyword": kw, "status": "failed", "questions": []})
            continue

        form_data = None
        if gemini_ready:
            dummy_intent = {"category": "it", "language": "vi"}
            prompt = build_prompt(str(kw), dummy_intent, retrieved, request.num_questions or DEFAULT_NUM_Q)
            form_data = call_gemini(prompt)

        questions = []
        if form_data and "sections" in form_data:
            for section in form_data.get("sections", []):
                questions.extend(section.get("questions", []))
        else:
            questions = [{"question": r["question"], "category": r.get("category", "it")} for r in retrieved[:request.num_questions or DEFAULT_NUM_Q]]

        results.append({"keyword": kw, "status": "success", "questions": questions})

    return JSONResponse(content={
        "success": True,
        "results": results,
        "total_keywords": len(request.keywords),
        "successful": len([r for r in results if r["status"] == "success"]),
    })


# ---------------------------------------------------------------------------
# ENTRYPOINT
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("rag_server:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
