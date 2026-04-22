import os
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
from tqdm import tqdm
import json
import uuid
import time
import re
import csv
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types

# Multi-format parsers
import pypdf
import docx
import openpyxl

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configuration
DATASETS_PATH = Path("question_datasets")
USER_DATA_PATH = Path("user_data")
CHROMA_PATH = Path("chroma_db")
COLLECTION_NAME = "question_bank"
CHECKPOINT_FILE = Path("logs/ingestion_checkpoint.json")
BATCH_SIZE = 100
CHUNK_SIZE = 800  # Characters for non-CSV documents
CHUNK_OVERLAP = 100

# Ensure directories exist
os.makedirs("logs", exist_ok=True)
os.makedirs(USER_DATA_PATH, exist_ok=True)
CHROMA_PATH.mkdir(exist_ok=True)

def get_ingestor():
    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    
    # Use a multilingual embedding model
    # Note: This will download the model on first run (~500MB)
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="paraphrase-multilingual-MiniLM-L12-v2"
    )
    
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )
    
    return collection

def load_checkpoint():
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r") as f:
            return json.load(f)
    return {"processed_files": [], "total_ingested": 0}

def save_checkpoint(processed_files, total_ingested):
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump({
            "processed_files": processed_files,
            "total_ingested": total_ingested,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)

class UnifiedParser:
    """U-Ingestor: Support for PDF, Word, Excel, and Text."""
    @staticmethod
    def parse_pdf(path: Path) -> str:
        text = ""
        with open(path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    @staticmethod
    def parse_docx(path: Path) -> str:
        doc = docx.Document(path)
        return "\n".join([para.text for para in doc.paragraphs])

    @staticmethod
    def parse_excel(path: Path) -> str:
        df = pd.read_excel(path)
        # Convert entire spreadsheet to a text representation
        return df.to_string()

    @staticmethod
    def chunk_text(text: str) -> list:
        """Recursive chunking to keep context together."""
        text = re.sub(r'\s+', ' ', text).strip()
        chunks = []
        for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
            chunks.append(text[i:i + CHUNK_SIZE])
        return [c for c in chunks if len(c) > 100]

def validate_data_quality(file_path: Path, sample_text: str) -> bool:
    """Vệ Sĩ AI: Check if content is safe and relevant."""
    if not GEMINI_API_KEY:
        return True # Skip if no key
    
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        # Use flash-latest for guardrails
        prompt = f"""Analyze this data sample from file '{file_path.name}':
        ---
        {sample_text[:3000]}
        ---
        Is this content SAFE to ingest, HIGH QUALITY, and containing meaningful info for creating surveys/forms?
        Return a JSON: {{"safe": true/false, "reason": "..."}}"""
        
        response = client.models.generate_content(
            model="gemini-1.5-flash-latest",
            contents=prompt,
            config=genai_types.GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        if not result.get("safe"):
            print(f"[GUARDRAIL] REJECTED {file_path.name}: {result.get('reason')}")
            return False
        return True
    except Exception as e:
        print(f"[ERROR] Guardrail bypass error: {e}")
        return True

def ingest_data(sample_limit=None, category=None):
    print(f"[START] SIR-AG v2: Starting Multi-Format Ingestion (Category: {category or 'auto'})...")
    collection = get_ingestor()
    checkpoint = load_checkpoint()
    
    processed_files = checkpoint["processed_files"]
    total_ingested = checkpoint["total_ingested"]
    
    # 1. Collect all files from datasets and user_data
    extensions = [".csv", ".pdf", ".docx", ".xlsx", ".xls"]
    all_files = []
    for folder in [DATASETS_PATH, USER_DATA_PATH]:
        if not folder.exists(): continue
        for ext in extensions:
            all_files.extend(list(folder.glob(f"*{ext}")))
    
    files_to_process = sorted([f for f in all_files if f.name not in processed_files])
    
    if not files_to_process:
        print("[INFO] All files already synced.")
        return

    print(f"[INFO] Found {len(files_to_process)} new files to process.")
    parser = UnifiedParser()
    
    for file_path in tqdm(files_to_process, desc="Syncing Documents", ascii=True):
        if sample_limit and total_ingested >= sample_limit:
            break
            
        try:
            ext = file_path.suffix.lower()
            documents = []
            metadatas = []
            
            # --- PARSING STAGE ---
            if ext == ".csv":
                try:
                    df = pd.read_csv(file_path, low_memory=False, on_bad_lines='skip', quoting=csv.QUOTE_MINIMAL)
                except Exception:
                    # Falback to more robust but slower python engine if C entry fails
                    df = pd.read_csv(file_path, low_memory=False, on_bad_lines='skip', engine='python')
                
                df = df.dropna(subset=['question'])
                # Sample for guardrail
                if not validate_data_quality(file_path, df.head(5).to_string()):
                    processed_files.append(file_path.name)
                    continue
                
                # Determine category from filename
                lower_name = file_path.name.lower()
                assigned_cat = "general"
                if "it" in lower_name: assigned_cat = "it"
                elif "marketing" in lower_name: assigned_cat = "marketing"
                elif "economics" in lower_name: assigned_cat = "economics"
                
                documents = df['question'].astype(str).tolist()
                for _, row in df.iterrows():
                    metadatas.append({
                        "source": file_path.name,
                        "keyword": str(row.get('keyword', 'unknown')),
                        "category": str(row.get('category', assigned_cat)),
                        "type": "question",
                        "visibility": "global",
                        "workspace_id": "system"
                    })
            else:
                # Binary files (PDF, Word, Excel)
                full_text = ""
                if ext == ".pdf": full_text = parser.parse_pdf(file_path)
                elif ext in [".docx", ".doc"]: full_text = parser.parse_docx(file_path)
                elif ext in [".xlsx", ".xls"]: full_text = parser.parse_excel(file_path)
                
                if not full_text.strip(): continue
                
                # Guardrail check
                if not validate_data_quality(file_path, full_text[:3000]):
                    processed_files.append(file_path.name)
                    continue
                    
                chunks = parser.chunk_text(full_text)
                documents = chunks
                metadatas = [{
                    "source": file_path.name, 
                    "type": "document_chunk",
                    "category": category or "general"
                } for _ in chunks]

            # --- UPSERT STAGE ---
            for i in range(0, len(documents), BATCH_SIZE):
                batch_docs = documents[i:i+BATCH_SIZE]
                batch_meta = metadatas[i:i+BATCH_SIZE]
                ids = [f"doc_{uuid.uuid5(uuid.NAMESPACE_DNS, doc)}_{i+idx}" 
                       for idx, doc in enumerate(batch_docs)]
                
                collection.upsert(documents=batch_docs, metadatas=batch_meta, ids=ids)
                total_ingested += len(batch_docs)

            processed_files.append(file_path.name)
            save_checkpoint(processed_files, total_ingested)
            
        except Exception as e:
            print(f"[ERROR] Error processing {file_path.name}: {e}")
            continue
    
    print(f"[DONE] Ingestion complete! Total items in ChromaDB: {total_ingested}")


if __name__ == "__main__":
    # For testing, we can limit to 1000 questions first
    import sys
    limit = 1000 if "--full" not in sys.argv else None
    ingest_data(sample_limit=limit)
