import os
import pandas as pd
import requests
import logging
from tqdm import tqdm
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATASET_DIR = "d:/NCKH/form-agent-AI-project/question_datasets"
API_URL = "http://localhost:8003/api/ingest/text"
CHECKPOINT_FILE = "ingest_checkpoint.json"

def load_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return set(json.load(f))
    return set()

def save_checkpoint(completed_files):
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(list(completed_files), f)

def ingest_all():
    files = sorted([f for f in os.listdir(DATASET_DIR) if f.endswith('.csv')])
    completed_files = load_checkpoint()
    
    files_to_process = [f for f in files if f not in completed_files]
    logger.info(f"Total: {len(files)} files. Remaining: {len(files_to_process)}.")
    
    total_ingested = 0
    for filename in tqdm(files_to_process, desc="Ingesting files"):
        file_path = os.path.join(DATASET_DIR, filename)
        try:
            df = pd.read_csv(file_path, on_bad_lines='skip', engine='python')
            q_col = next((c for c in df.columns if 'question' in c.lower()), None)
            
            if not q_col:
                completed_files.add(filename)
                continue
                
            questions = df[q_col].dropna().unique().tolist()
            if not questions:
                completed_files.add(filename)
                continue

            # --- OPTIMIZATION: Classify the FILE once ---
            # Sample first 3 questions to represent the file
            sample_text = "\n".join(questions[:5])
            
            # We call the API once WITHOUT category to let AI classify it
            # Then we use that category for the rest of the file
            first_batch = questions[:50]
            try:
                resp = requests.post(API_URL, json={
                    "title": f"Header of {filename}",
                    "text": "\n---\n".join(first_batch),
                    "category": "general" # This triggers AI Audit in main.py
                }, timeout=60)
                
                if resp.status_code == 200:
                    detected_category = resp.json().get("category", "general")
                    logger.info(f"File {filename} detected as: {detected_category}")
                else:
                    logger.error(f"Failed to audit {filename}, skipping file.")
                    continue
            except Exception as e:
                logger.error(f"Audit request failed: {e}")
                continue

            # --- Now ingest the REST of the file using the DETECTED category ---
            # (To save 99% of tokens by skipping further AI audits)
            batch_size = 150
            for i in range(50, len(questions), batch_size):
                batch = questions[i:i+batch_size]
                text_block = "\n---\n".join(batch)
                
                payload = {
                    "title": f"Batch from {filename}",
                    "text": text_block,
                    "workspace_id": None,
                    "category": detected_category # Passing this skips AI Audit in main.py
                }
                
                try:
                    response = requests.post(API_URL, json=payload, timeout=60)
                    if response.status_code == 200:
                        total_ingested += len(batch)
                except Exception as e:
                    logger.error(f"Batch failed: {e}")
                    time.sleep(1)
            
            completed_files.add(filename)
            save_checkpoint(completed_files)
            
        except Exception as e:
            logger.error(f"Critical error {filename}: {e}")

    logger.info(f"Done! Total: {total_ingested}")

if __name__ == "__main__":
    ingest_all()
