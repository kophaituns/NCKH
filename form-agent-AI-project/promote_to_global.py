# promote_to_global.py
import chromadb
from pathlib import Path
import os
import tqdm

CHROMA_PATH = Path("chroma_db")
COLLECTION_NAME = "question_bank"
BATCH_SIZE = 5000

def promote_all():
    print(f"[START] Promoting records to Global visibility...")
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection = client.get_collection(name=COLLECTION_NAME)
    
    # 1. Get all IDs
    # Note: We use peek or get() to fetch IDs. Since we have 275k, we'll fetch in chunks.
    total_count = collection.count()
    print(f"[INFO] Collection count: {total_count}")
    
    # 2. Iterate and update
    # In Chroma, we can get IDs using .get() with pagination
    processed = 0
    while processed < total_count:
        # Get next batch of IDs
        batch_data = collection.get(
            limit=BATCH_SIZE,
            offset=processed,
            include=['metadatas']
        )
        
        ids = batch_data['ids']
        metadatas = batch_data['metadatas']
        
        if not ids:
            break
            
        # Update metadata for this batch
        new_metadatas = []
        for meta in metadatas:
            m = meta.copy() if meta else {}
            m["visibility"] = "global"
            m["workspace_id"] = "system"
            new_metadatas.append(m)
            
        # Perform update
        collection.update(
            ids=ids,
            metadatas=new_metadatas
        )
        
        processed += len(ids)
        print(f"  > Updated {processed}/{total_count} records...", end="\r")
    
    print(f"\n[DONE] Successfully promoted {processed} records to Global visibility.")

if __name__ == "__main__":
    promote_all()
