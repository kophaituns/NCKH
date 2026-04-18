import os
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
from tqdm import tqdm
import json
import uuid
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configuration
DATASETS_PATH = Path("question_datasets")
CHROMA_PATH = Path("chroma_db")
COLLECTION_NAME = "question_bank"
CHECKPOINT_FILE = Path("logs/ingestion_checkpoint.json")
BATCH_SIZE = 200  # Smaller batches for stability

# Ensure directories exist
os.makedirs("logs", exist_ok=True)
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

def validate_data_quality(file_path: Path, sample_text: str) -> bool:
    """Vệ Sĩ AI: Check if content is safe and relevant."""
    if not GEMINI_API_KEY:
        return True # Skip if no key
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = f"""Analyze this data sample from file '{file_path.name}':
    ---
    {sample_text[:2000]}
    ---
    Is this content SAFE, RELEVANT to survey/form generation, and HIGH QUALITY?
    Return a JSON: {{"safe": true/false, "reason": "..."}}"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(response_mime_type="application/json")
        )
        result = json.loads(response.text.strip())
        if not result.get("safe"):
            print(f" 🛡️  Guardrail REJECTED {file_path.name}: {result.get('reason')}")
            return False
        return True
    except Exception as e:
        print(f" ⚠️  Guardrail bypass error: {e}")
        return True

def ingest_data(sample_limit=None):
    print(f" Starting ChromaDB Ingestion...")
    collection = get_ingestor()
    checkpoint = load_checkpoint()
    
    processed_files = checkpoint["processed_files"]
    total_ingested = checkpoint["total_ingested"]
    
    # Get all CSV files
    csv_files = sorted([f for f in DATASETS_PATH.glob("*.csv") if f.name not in processed_files])
    
    if not csv_files:
        print(" All files already processed or no files found.")
        return

    print(f" Found {len(csv_files)} new files to process.")
    
    try:
        for file_path in tqdm(csv_files, desc="Processing CSV files"):
            if sample_limit and total_ingested >= sample_limit:
                print(f" Sample limit reached ({sample_limit}). Stopping.")
                break
                
            try:
                # Read CSV
                df = pd.read_csv(file_path, low_memory=False)
                
                # Vệ Sĩ AI: Validate first 5 rows
                sample_data = df.head(5).to_string()
                if not validate_data_quality(file_path, sample_data):
                    processed_files.append(file_path.name)
                    save_checkpoint(processed_files, total_ingested)
                    continue

                # Filter valid rows
                df = df.dropna(subset=['question', 'keyword'])
                
                # Prepare batches
                for i in range(0, len(df), BATCH_SIZE):
                    if sample_limit and total_ingested >= sample_limit:
                        break
                        
                    batch_df = df.iloc[i:i+BATCH_SIZE]
                    
                    documents = batch_df['question'].tolist()
                    
                    # Metadata must be simple types (str, int, float, bool)
                    metadatas = []
                    for _, row in batch_df.iterrows():
                        metadatas.append({
                            "keyword": str(row.get('keyword', '')),
                            "category": str(row.get('category', '')),
                            "sub_category": str(row.get('sub_category', '')),
                            "level": str(row.get('level', '')),
                            "language": str(row.get('language', 'en'))
                        })
                        
                    # Generate unique IDs to avoid "duplicated ID" errors even for same questions
                    ids = [f"{uuid.uuid5(uuid.NAMESPACE_DNS, doc)}_{int(time.time()*1000)}_{i+idx}" 
                           for idx, doc in enumerate(documents)]
                    
                    try:
                        # Upsert into Chroma
                        collection.upsert(
                            documents=documents,
                            metadatas=metadatas,
                            ids=ids
                        )
                        total_ingested += len(documents)
                    except Exception as batch_error:
                        print(f"   Error in batch: {batch_error}")
                        continue
                
                # Update checkpoint
                processed_files.append(file_path.name)
                save_checkpoint(processed_files, total_ingested)
                
            except Exception as e:
                print(f" Error processing {file_path.name}: {e}")
                continue
                
    except KeyboardInterrupt:
        print("\n Ingestion interrupted by user. Progress saved.")
    
    print(f" Ingestion complete! Total questions in ChromaDB: {total_ingested}")

if __name__ == "__main__":
    # For testing, we can limit to 1000 questions first
    import sys
    limit = 1000 if "--full" not in sys.argv else None
    ingest_data(sample_limit=limit)
