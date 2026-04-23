from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from config import config
from chroma_client import chroma_wrapper
from ai_agent import ai_agent

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

logger = logging.getLogger(__name__)

class GenerateFormRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt")
    language: Optional[str] = Field("en", description="vi or en")
    num_questions: Optional[int] = Field(config.DEFAULT_NUM_Q, ge=3, le=20)
    category: Optional[str] = Field("general", description="Knowledge domain")
    form_type: Optional[str] = Field("survey", description="survey | quiz | etc")
    notebook_id: Optional[str] = Field(None, description="If provided, acts as a Personal NotebookLM")

@app.get("/")
async def root():
    return {
        "status": "online",
        "mode": "NotebookLM Multi-tenant",
        "gemini_ready": ai_agent.ready,
        "chroma_connected": chroma_wrapper.client is not None
    }

@app.post("/api/generate-form")
async def generate_form(request: GenerateFormRequest):
    # 1. Analyze Intent
    intent_info = ai_agent.analyze_intent(request.prompt, request.form_type)
    
    # 2. Retrieve Context (Hybrid Search if Notebook ID is present)
    search_query = f"{request.prompt} {intent_info.get('keywords', '')}"
    context_results = chroma_wrapper.hybrid_search(
        keyword=search_query,
        notebook_id=request.notebook_id,
        k=config.RETRIEVE_K
    )
    
    # 3. Generate Form with Gemini
    form_data = ai_agent.generate_form(
        user_prompt=request.prompt,
        context_results=context_results,
        intent_info=intent_info,
        num_q=request.num_questions,
        notebook_id=request.notebook_id,
        language=request.language
    )
    
    return JSONResponse(content=form_data)

class IngestNotebookRequest(BaseModel):
    notebook_id: str
    questions: List[str]

@app.post("/api/notebooks/ingest")
async def ingest_notebook_data(request: IngestNotebookRequest):
    """Ingest data strictly into a personal notebook collection."""
    data = [{"text": q, "metadata": {"source": "user_upload"}} for q in request.questions]
    target_col = f"notebook_{request.notebook_id}"
    
    success = chroma_wrapper.upsert_questions(data, target_col)
    if success:
        return {"success": True, "message": f"Ingested {len(request.questions)} items into {target_col}."}
    return JSONResponse(status_code=500, content={"success": False, "error": "Ingestion failed"})

@app.delete("/api/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str):
    """Delete a personal notebook and all its data."""
    success = chroma_wrapper.delete_notebook(notebook_id)
    if success:
        return {"success": True, "message": f"Notebook {notebook_id} completely wiped."}
    return JSONResponse(status_code=404, content={"success": False, "error": "Notebook not found or error deleting"})
