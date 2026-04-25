from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from content_extractor import content_extractor
from config import config
from chroma_client import chroma_wrapper
from ai_agent import ai_agent
import time
from fastapi import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Modular RAG Form API (NotebookLM Edition)",
    description="Multi-tenant Form Generator using Dynamic Collections + Gemini",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    logger.info(f">>> Incoming Request: {method} {path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"<<< Request Completed: {method} {path} - Status: {response.status_code} - Time: {process_time:.4f}s")
        return response
    except Exception as e:
        logger.error(f"!!! Request Failed: {method} {path} - Error: {str(e)}")
        raise e

class GenerateQuestionsRequest(BaseModel):
    keyword: str = Field(..., description="Natural language prompt or keywords")
    language: Optional[str] = Field("en", description="vi or en")
    num_questions: Optional[int] = Field(config.DEFAULT_NUM_Q, ge=1, le=20)
    category_hint: Optional[str] = Field("general", description="Knowledge domain")
    form_type: Optional[str] = Field("survey", description="survey | quiz | etc")
    workspace_id: Optional[str] = Field(None, description="If provided, acts as a Personal NotebookLM")
    fine_tune_note: Optional[str] = Field(None, description="Critical tone/style instruction from user")

@app.get("/")
async def root():
    return {
        "status": "online",
        "mode": "NotebookLM Multi-tenant",
        "gemini_ready": ai_agent.ready,
        "chroma_connected": chroma_wrapper.client is not None
    }

@app.get("/api/health")
async def health_check():
    return {"status": "online", "timestamp": time.time()}

@app.post("/api/generate-questions")
async def generate_questions(request: GenerateQuestionsRequest):
    try:
        logger.info(f"--- [GENERATE_QUESTIONS] Start ---")
        logger.info(f"Payload: {request.dict()}")
        
        # [GAU UPDATE] Workspace Context Awareness
        context_hint = None
        if request.workspace_id:
            sources = chroma_wrapper.get_collection_sources(f"workspace_{request.workspace_id}")
            if sources:
                context_hint = ", ".join(sources)
                logger.info(f"Workspace Context Detected: {context_hint}")

        # 1. Analyze Intent (with context hint)
        intent_info = ai_agent.analyze_intent(request.keyword, request.form_type, context_hint)
        logger.info(f"Intent Analysis: {intent_info}")
        
        # 2. Retrieve Context (Hybrid Search if Workspace ID is present)
        search_query = f"{request.keyword} {intent_info.get('keywords', '')}"
        
        # We pass workspace_id to chroma_wrapper to search the specific notebook collection
        context_results = chroma_wrapper.hybrid_search(
            keyword=search_query,
            workspace_id=request.workspace_id,
            k=config.RETRIEVE_K
        )
        logger.info(f"Context Retrieval: Found {len(context_results)} chunks")
        
        # 3. Generate Form with Gemini
        logger.info(f"--- [GENERATE_QUESTIONS] Calling AI Agent... ---")
        form_data = ai_agent.generate_form(
            user_prompt=request.keyword,
            context_results=context_results,
            intent_info=intent_info,
            num_q=request.num_questions,
            workspace_id=request.workspace_id,
            fine_tune_note=request.fine_tune_note,
            language=request.language,
            context_hint=context_hint
        )
        
        if not form_data or not form_data.get('questions'):
            logger.warning(f"--- [GENERATE_QUESTIONS] Warning: No questions generated! ---")
        
        logger.info(f"--- [GENERATE_QUESTIONS] Success - Questions generated: {len(form_data.get('questions', []))} ---")
        return JSONResponse(content=form_data)
    except Exception as e:
        logger.error(f"--- [GENERATE_QUESTIONS] Fatal Error: {str(e)} ---")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class IngestNotebookRequest(BaseModel):
    workspace_id: str
    questions: List[str]

@app.post("/api/notebooks/ingest")
async def ingest_notebook_data(request: IngestNotebookRequest):
    """Ingest raw text list into a personal workspace."""
    data = [{"text": q, "metadata": {"source": "user_upload"}} for q in request.questions]
    target_col = f"workspace_{request.workspace_id}"
    
    success = chroma_wrapper.upsert_questions(data, target_col)
    if success:
        return {"success": True, "message": f"Ingested {len(request.questions)} items into {target_col}."}
    return JSONResponse(status_code=500, content={"success": False, "error": "Ingestion failed"})

@app.delete("/api/notebooks/{workspace_id}")
async def delete_notebook(workspace_id: str):
    """Delete a personal workspace and all its data."""
    success = chroma_wrapper.delete_notebook(workspace_id)
    if success:
        return {"success": True, "message": f"Workspace {workspace_id} completely wiped."}
    return JSONResponse(status_code=404, content={"success": False, "error": "Workspace not found or error deleting"})


async def background_summarize(workspace_id: str):
    """Background task to update workspace knowledge map."""
    try:
        logger.info(f"Background summarizing workspace: {workspace_id}")
        workspace_col = f"workspace_{workspace_id}"
        collection = chroma_wrapper.get_collection(workspace_col)
        if collection:
            res = collection.peek(limit=50)
            if res and res['documents']:
                summary = ai_agent.generate_workspace_summary(res['documents'], workspace_id)
                if summary:
                    chroma_wrapper.upsert_workspace_summary(workspace_id, summary)
    except Exception as e:
        logger.error(f"Background summarize failed for {workspace_id}: {e}")

class IngestUrlRequest(BaseModel):
    url: str
    workspace_id: Optional[str] = None
    promote_to_global: bool = False
    category: str = "general"

@app.post("/api/ingest/url")
async def ingest_url(request: IngestUrlRequest, background_tasks: BackgroundTasks):
    try:
        text = content_extractor.extract_from_url(request.url)
        
        # AI Gatekeeper Validation (Skip if manual category provided)
        if not request.category or request.category == "general":
            audit = ai_agent.validate_and_classify(text)
            if not audit.get("is_valid", False) or audit.get("quality_score", 0) < 4:
                return JSONResponse(status_code=400, content={
                    "success": False, 
                    "error": "Content rejected by AI Auditor", 
                    "reason": audit.get("reason", "Low quality")
                })
            category = audit.get("category", "general")
            quality = audit.get("quality_score", 5)
        else:
            category = request.category
            quality = 9 # Assume high quality for manual overrides

        # Split into chunks
        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        data = [{"text": c, "metadata": {
            "source": request.url, 
            "category": category,
            "quality_score": quality
        }} for c in chunks]
        
        target_col = f"workspace_{request.workspace_id}" if request.workspace_id else "global_knowledge"
        
        success = chroma_wrapper.upsert_questions(data, target_col)
        
        if success and request.workspace_id:
            background_tasks.add_task(background_summarize, request.workspace_id)
            
        return {
            "success": success, 
            "category_applied": category,
            "chunks": len(chunks)
        }
    except Exception as e:
        logger.error(f"URL ingest error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class IngestYoutubeRequest(BaseModel):
    youtube_url: str
    workspace_id: Optional[str] = None
    promote_to_global: bool = False
    category: str = "general"

@app.post("/api/ingest/youtube")
async def ingest_youtube(request: IngestYoutubeRequest, background_tasks: BackgroundTasks):
    try:
        text = content_extractor.extract_from_youtube(request.youtube_url)
        
        # AI Gatekeeper Validation
        audit = ai_agent.validate_and_classify(text)
        if not audit.get("is_valid", False):
            return JSONResponse(status_code=400, content={"success": False, "error": "Invalid video content"})

        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        data = [{"text": c, "metadata": {
            "source": request.youtube_url,
            "category": audit.get("category", "general"),
            "quality_score": audit.get("quality_score", 5)
        }} for c in chunks]
        
        target_col = f"workspace_{request.workspace_id}" if request.workspace_id else "global_knowledge"
        
        success = chroma_wrapper.upsert_questions(data, target_col)
        
        if success and request.workspace_id:
            background_tasks.add_task(background_summarize, request.workspace_id)
            
        return {"success": success, "quality_report": audit, "chunks": len(chunks), "source": title}
    except Exception as e:
        logger.error(f"YouTube ingest error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class IngestTextRequest(BaseModel):
    title: str
    text: str
    workspace_id: Optional[str] = None
    promote_to_global: bool = False
    category: str = "general"

@app.post("/api/ingest/text")
async def ingest_text(request: IngestTextRequest, background_tasks: BackgroundTasks):
    try:
        # AI Gatekeeper Validation (Skip if manual category provided)
        if not request.category or request.category == "general":
            audit = ai_agent.validate_and_classify(request.text)
            if not audit.get("is_valid", False):
                return JSONResponse(status_code=400, content={"success": False, "error": "Text content rejected"})
            category = audit.get("category", "general")
            quality = audit.get("quality_score", 5)
        else:
            category = request.category
            quality = 10 # Manual batching is trusted

        chunks = [request.text[i:i+1000] for i in range(0, len(request.text), 1000)]
        data = [{"text": c, "metadata": {
            "source": request.title,
            "category": category,
            "quality_score": quality
        }} for c in chunks]
        
        target_col = f"workspace_{request.workspace_id}" if request.workspace_id else "global_knowledge"
        
        success = chroma_wrapper.upsert_questions(data, target_col)
        
        if success and request.workspace_id:
            background_tasks.add_task(background_summarize, request.workspace_id)
            
        return {"success": success, "category": category, "chunks": len(chunks)}
    except Exception as e:
        logger.error(f"Text ingest error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class LearnRequest(BaseModel):
    questions: List[Dict[str, Any]]

@app.post("/api/learn")
async def learn_from_feedback(request: LearnRequest):
    """Save human-refined questions to a special collection for future fine-tuning."""
    try:
        success = chroma_wrapper.upsert_questions(request.questions, config.COLLECTION_REFINED)
        return {"success": success, "message": "Feedback saved to AI Memory."}
    except Exception as e:
        logger.error(f"Learning error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class UpdateSourceRequest(BaseModel):
    workspace_id: str
    old_name: str
    new_name: str

@app.post("/api/workspace/update-source")
async def update_workspace_source(request: UpdateSourceRequest):
    """Synchronize source renaming with ChromaDB metadata."""
    try:
        success = chroma_wrapper.update_source_name(
            request.workspace_id, 
            request.old_name, 
            request.new_name
        )
        return {"success": success}
    except Exception as e:
        logger.error(f"Source update error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class DeleteSourceRequest(BaseModel):
    source_title: str
    workspace_id: str

@app.post("/api/delete-source")
async def delete_source(request: DeleteSourceRequest):
    """Removes all chunks associated with a specific source."""
    try:
        success = chroma_wrapper.delete_source(request.workspace_id, request.source_title)
        return {"success": success}
    except Exception as e:
        logger.error(f"Delete source error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

class SummarizeRequest(BaseModel):
    workspace_id: str

@app.post("/api/workspace/summarize")
async def summarize_workspace(request: SummarizeRequest):
    """Generates and saves a high-level summary of the workspace."""
    try:
        workspace_col = f"workspace_{request.workspace_id}"
        collection = chroma_wrapper.get_collection(workspace_col)
        if not collection:
            return {"success": False, "error": "Workspace collection not found"}
        
        # Get sample data for summary
        res = collection.peek(limit=50)
        chunks = res['documents']
        
        summary = ai_agent.generate_workspace_summary(chunks, request.workspace_id)
        if summary:
            chroma_wrapper.upsert_workspace_summary(request.workspace_id, summary)
            return {"success": True, "summary": summary}
        return {"success": False, "error": "Could not generate summary"}
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
