# scratch_check_counts.py
import chromadb
import os

# Define paths
DB_PATH = os.path.join(os.getcwd(), "chroma_db")
print(f"Checking ChromaDB at: {DB_PATH}")

client = chromadb.PersistentClient(path=DB_PATH)

collections = client.list_collections()
print(f"\nFound {len(collections)} collections:")

for col_name in collections:
    col = client.get_collection(name=col_name)
    count = col.count()
    print(f"- {col_name}: {count} vectors")
