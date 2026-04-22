
import chromadb
from pathlib import Path

CHROMA_PATH = Path("chroma_db")
client = chromadb.PersistentClient(path=str(CHROMA_PATH))

collections = client.list_collections()
print(f"Collections found: {[c.name for c in collections]}")

for coll_name in [c.name for c in collections]:
    collection = client.get_collection(coll_name)
    print(f"Collection '{coll_name}' count: {collection.count()}")

# Peek at some data in question_bank
if "question_bank" in [c.name for c in collections]:
    qb = client.get_collection("question_bank")
    results = qb.peek(limit=5)
    print("\nPeek at 'question_bank':")
    for i in range(len(results['ids'])):
        print(f"ID: {results['ids'][i]}")
        print(f"Metadata: {results['metadatas'][i]}")
        print(f"Document: {results['documents'][i][:100]}...")
        print("-" * 20)
