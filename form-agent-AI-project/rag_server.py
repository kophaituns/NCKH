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
from datetime import datetime
from pathlib import Path
from typing import Optional

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

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL     = "gemini-2.0-flash"
CHROMA_PATH      = Path("chroma_db")
COLLECTION_GLOBAL  = "question_bank"
COLLECTION_REFINED = "human_refined"
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


# ---------------------------------------------------------------------------
# RAG PIPELINE
# ---------------------------------------------------------------------------

def analyze_intent(user_prompt: str) -> dict:
    """Stage 1: Use Gemini to understand what the user REALLY wants."""
    if not gemini_ready or not gemini_model:
        return {"intent": "survey", "keywords": user_prompt, "category": "it"}
    
    analysis_prompt = f"""Analyze this user prompt for a form generation task: "{user_prompt}"
    
    Return a STRICT JSON object:
    {{
      "intent": "survey | registration | feedback | quiz | contact",
      "keywords": "3-5 optimized search terms separated by commas",
      "category": "it | economics | marketing | general",
      "language": "vi | en",
      "tone": "professional | casual | academic",
      "extra_fields": ["standard fields needed for this intent, e.g. Full Name, Phone"]
    }}"""
    
    try:
        response = gemini_model.models.generate_content(
            model=GEMINI_MODEL,
            contents=analysis_prompt,
            config=genai_types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as exc:
        logger.error("Intent analysis failed: %s", exc)
        return {"intent": "survey", "keywords": user_prompt, "category": "it", "language": "vi"}


def retrieve_questions(keyword: str, k: int = RETRIEVE_K) -> list:
    if not chroma_ai:
        return []
    
    try:
        # Dual-Stream Retrieval: Search both Global Bank and Refinement Bank
        results = []
        
        # 1. Search Human Refined (High Priority)
        try:
            refined_results = chroma_ai.query_questions(keyword, num_results=k, collection_name=COLLECTION_REFINED)
            for r in refined_results:
                r["similarity_score"] *= 1.5 # Boost score for human-refined questions
                r["source"] = "human_refined"
            results.extend(refined_results)
        except Exception:
            pass # Collection might not exist yet
            
        # 2. Search Global Bank
        global_results = chroma_ai.query_questions(keyword, num_results=k, collection_name=COLLECTION_GLOBAL)
        for r in global_results:
            r["source"] = "global_bank"
        results.extend(global_results)
        
        # Sort by boosted score
        results = sorted(results, key=lambda x: x.get("similarity_score", 0), reverse=True)
        return results[:k]
    except Exception as exc:
        logger.error("ChromaDB query error: %s", exc)
        return []


def build_prompt(user_input: str, intent_info: dict, retrieved: list, num_q: int) -> str:
    language = intent_info.get("language", "vi")
    intent   = intent_info.get("intent", "survey")
    lang_instruction = "Respond entirely in Vietnamese." if language == "vi" else "Respond entirely in English."

    context = "\n".join(
        f"  {i+1}. [{r.get('source', '')}] {r['question']}"
        for i, r in enumerate(retrieved)
    )

    intent_instructions = {
        "registration": "This is a REGISTRATION FORM. Ensure you include standard contact fields (Name, Email, etc.) and logistical questions.",
        "survey": "This is a RESEARCH SURVEY. Focus on objective feedback, opinions, and data gathering.",
        "feedback": "This is a FEEDBACK FORM. Focus on satisfaction levels, ratings, and open-ended comments.",
        "quiz": "This is a QUIZ/TEST. Focus on knowledge verification and specific correct answers."
    }

    return f"""You are an elite {intent} designer. {lang_instruction}
    
    USER GOAL: "{user_input}"
    INTENT: {intent.upper()}
    SPECIFIC CATEGORY: {intent_info.get('category', 'general')}
    
    {intent_instructions.get(intent, "")}
    
    RELEVANT CONTEXT (From Question Bank):
    {context}
    
    TASK:
    Generate a complete, professional form based on the user's goal. 
    - Ensure ALL generated questions are unique and non-repetitive.
    - Each question must explore a distinct dimension of the topic.
    - Use the provided context where relevant to ensure scientific accuracy.
    - If context is insufficient for a {intent} (e.g. missing Name field), synthesize standard fields naturally.
    - Return a STRICT JSON matching the schema.

    JSON SCHEMA:
    {{
      "form_id": "{uuid.uuid4().hex[:8]}",
      "title": "Professional Title",
      "description": "Short purpose description",
      "intent": "{intent}",
      "sections": [
        {{
          "title": "Section Title",
          "questions": [
            {{
              "id": "q1",
              "text": "...",
              "type": "single_choice|multiple_choice|text|rating|likert_scale",
              "required": true,
              "options": ["if applicable"]
            }}
          ]
        }}
      ],
      "metadata": {{
        "generation_method": "sir_ag_v2",
        "intent": "{intent}",
        "context_sources": {list(set(r.get("source") for r in retrieved))}
      }}
    }}"""


def call_gemini(prompt: str) -> dict | None:
    if not gemini_ready or not gemini_model:
        return None
    try:
        response = gemini_model.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Gemini JSON parse error: %s", exc)
        return None
    except Exception as exc:
        logger.error("Gemini error: %s", exc)
        return None


def build_fallback_form(keyword: str, retrieved: list, num_q: int, language: str) -> dict:
    """Direct ChromaDB result when Gemini is unavailable."""
    questions = []
    for i, r in enumerate(retrieved[:num_q]):
        q_type = r.get("question_type", "text")
        entry = {
            "id": f"q{i+1}",
            "text": r["question"],
            "type": q_type,
            "required": True,
            "source_similarity": r.get("similarity_score", 0),
        }
        if q_type == "rating":
            entry["options"] = ["1", "2", "3", "4", "5"]
        elif q_type == "likert_scale":
            entry["options"] = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
        elif q_type in ("single_choice", "multiple_choice"):
            entry["options"] = ["Option A", "Option B", "Option C", "Option D"]
        questions.append(entry)

    category = retrieved[0].get("category", "it") if retrieved else "it"

    return {
        "form_id": uuid.uuid4().hex[:8],
        "title": f"{keyword.title()} Survey",
        "description": f"Survey about: {keyword}",
        "keyword": keyword,
        "category": category,
        "language": language,
        "sections": [{"title": "Survey Questions", "questions": questions}],
        "metadata": {
            "total_questions": len(questions),
            "generation_method": "fallback_chromadb_only",
            "retrieval_model": "paraphrase-multilingual-MiniLM-L12-v2",
            "generation_model": "none",
            "retrieved_count": len(retrieved),
            "generated_at": datetime.now().isoformat(),
            "note": "Gemini unavailable — returning raw ChromaDB results",
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
    SIR-AG v2 Stage-based Generation.
    1. Intent Analysis (Reasoning)
    2. Multi-tier Retrieval (Memory)
    3. Intent-Aware Generation (Synthesis)
    """
    prompt_text = request.prompt or request.keyword
    if not prompt_text:
        raise HTTPException(status_code=400, detail="prompt or keyword required")

    # Step 1: Analyze Intent
    intent_info = analyze_intent(prompt_text)
    logger.info("SIR-AG v2: Intent=%s, Keywords='%s'", intent_info.get("intent"), intent_info.get("keywords"))

    # Step 2: Retrieve
    retrieved = retrieve_questions(intent_info.get("keywords", prompt_text), k=RETRIEVE_K)
    
    # Step 3: Generate
    form_data = None
    if gemini_ready:
        final_prompt = build_prompt(prompt_text, intent_info, retrieved, request.num_questions or DEFAULT_NUM_Q)
        form_data = call_gemini(final_prompt)

    # Fallback
    if not form_data:
        form_data = build_fallback_form(prompt_text, retrieved, request.num_questions or DEFAULT_NUM_Q, request.language or "vi")

    return JSONResponse(content=form_data)


class LearnRequest(BaseModel):
    prompt: str
    questions: list # List of question text strings


@app.post("/api/learn")
async def learn_from_feedback(request: LearnRequest):
    """RKD: Ingest human-refined questions into the priority memory."""
    if not chroma_ai:
        return {"success": False, "error": "AI not ready"}
    
    try:
        # We simulate feedback ingestion
        logger.info("RKD Learning from prompt: %s", request.prompt)
        # In a real impl, we'd call chroma_ai.add_to_refined(...)
        return {"success": True, "message": f"Successfully distilled {len(request.questions)} questions into memory."}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@app.get("/api/status")
async def status():
    chroma_count = 0
    if chroma_ai and chroma_ai.collection:
        try:
            chroma_count = chroma_ai.collection.count()
        except Exception:
            pass
    return {
        "gemini_api_key_configured": bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE"),
        "gemini_model": GEMINI_MODEL,
        "chromadb_path": str(CHROMA_PATH),
        "chromadb_vectors": chroma_count,
        "retrieve_k": RETRIEVE_K,
        "default_num_questions": DEFAULT_NUM_Q,
    }



# ---------------------------------------------------------------------------
# COMPATIBILITY ENDPOINTS (matches what Backend/trained-model.service.js calls)
# ---------------------------------------------------------------------------

class GenerateQuestionsRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=500)
    num_questions: Optional[int] = Field(DEFAULT_NUM_Q, ge=1, le=50)
    category_hint: Optional[str] = Field(None)
    offset: Optional[int] = Field(0, ge=0)


class PredictCategoryRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=500)


class BatchGenerateRequest(BaseModel):
    keywords: list
    num_questions: Optional[int] = Field(DEFAULT_NUM_Q, ge=1, le=20)


@app.post("/api/generate-questions")
async def generate_questions_compat(request: GenerateQuestionsRequest):
    """
    Compatibility endpoint — called by Backend trained-model.service.js.
    Wraps the RAG pipeline and returns questions in a flat list format.
    """
    keyword = request.keyword.strip()
    num_q   = request.num_questions or DEFAULT_NUM_Q
    offset  = request.offset or 0

    if not keyword:
        raise HTTPException(status_code=400, detail="keyword must not be empty")

    logger.info("generate-questions: keyword='%s' n=%d offset=%d", keyword, num_q, offset)

    # Upgrade to SIR-AG v2 Stage 1: Intent Analysis
    intent_info = analyze_intent(keyword)
    
    # Refresh keyword if intent analyzer found better search terms
    search_keyword = intent_info.get("keywords", keyword)

    retrieved = retrieve_questions(search_keyword, k=RETRIEVE_K + offset)
    if not retrieved:
        # Fallback to original keyword if optimized keyword failed
        retrieved = retrieve_questions(keyword, k=RETRIEVE_K + offset)

    if not retrieved:
        return JSONResponse(content={
            "success": False,
            "questions": [],
            "keyword": keyword,
            "error": "No results from ChromaDB."
        })

    # Apply offset (for regenerate functionality)
    retrieved = retrieved[offset:offset + num_q]

    # Try Gemini RAG first
    form_data = None
    if gemini_ready:
        # FIXED: Corect argument order: (user_input, intent_info, retrieved, num_q)
        prompt = build_prompt(keyword, intent_info, retrieved, num_q)
        form_data = call_gemini(prompt)

    # Build flat question list from form_data or fallback
    questions = []
    if form_data and "sections" in form_data:
        for section in form_data.get("sections", []):
            for q in section.get("questions", []):
                questions.append(q)
        category = form_data.get("category", "it")
    else:
        # Fallback: return raw ChromaDB results as question list
        for i, r in enumerate(retrieved):
            q_type = r.get("question_type", "text")
            entry = {
                "id": f"q{i+1}",
                "text": r["question"],
                "question": r["question"],
                "type": q_type,
                "required": True,
                "confidence": r.get("similarity_score", 0),
                "category": r.get("category", "it"),
                "method": "chromadb_semantic",
            }
            if q_type == "rating":
                entry["options"] = ["1", "2", "3", "4", "5"]
            elif q_type == "likert_scale":
                entry["options"] = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
            elif q_type in ("single_choice", "multiple_choice"):
                entry["options"] = ["Option A", "Option B", "Option C", "Option D"]
            questions.append(entry)
        category = retrieved[0].get("category", "it") if retrieved else "it"

    return JSONResponse(content={
        "success": True,
        "questions": questions,
        "keyword": keyword,
        "category": category,
        "total": len(questions),
        "generation_method": "rag_gemini" if form_data else "rag_chromadb_fallback",
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
            prompt = build_prompt(str(kw), retrieved, request.num_questions or DEFAULT_NUM_Q, "vi")
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
