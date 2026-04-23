import logging
import chromadb
from typing import List, Dict, Any

from config import config
from embedding import get_embedding_function, compute_embeddings

logger = logging.getLogger(__name__)

class ChromaClientWrapper:
    def __init__(self):
        self.host = config.CHROMA_HOST
        self.port = config.CHROMA_PORT
        
        try:
            self.client = chromadb.HttpClient(host=self.host, port=self.port)
            logger.info(f"Connected to ChromaDB HTTP Server at {self.host}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB Server: {e}")
            self.client = None

    def get_collection(self, name: str):
        if not self.client:
            return None
        try:
            return self.client.get_or_create_collection(
                name=name,
                embedding_function=get_embedding_function()
            )
        except Exception as e:
            logger.error(f"Error getting collection {name}: {e}")
            return None

    def delete_notebook(self, notebook_id: str) -> bool:
        """Completely deletes a private notebook collection."""
        if not self.client: return False
        col_name = f"notebook_{notebook_id}"
        try:
            self.client.delete_collection(col_name)
            logger.info(f"Deleted notebook collection: {col_name}")
            return True
        except Exception as e:
            logger.warning(f"Notebook {col_name} might not exist to delete: {e}")
            return False

    def search_questions(self, keyword: str, collection_name: str, k: int = 15, where_filter: dict = None) -> List[Dict[str, Any]]:
        collection = self.get_collection(collection_name)
        if not collection:
            return []

        try:
            results = collection.query(
                query_texts=[keyword],
                n_results=k,
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )

            if not results or not results["documents"] or len(results["documents"][0]) == 0:
                return []

            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0]
            ids = results["ids"][0]

            formatted = []
            for doc, meta, dist, q_id in zip(docs, metas, dists, ids):
                confidence = max(0, 1 - dist)
                formatted.append({
                    "id": q_id,
                    "question": doc,
                    "category": meta.get("category", "general"),
                    "confidence": confidence,
                    "similarity_score": round(1 - dist, 4),
                    "source": collection_name
                })
            return formatted
        except Exception as e:
            logger.error(f"Search error in {collection_name}: {e}")
            return []

    def hybrid_search(self, keyword: str, notebook_id: str = None, k: int = 15) -> List[Dict[str, Any]]:
        """Searches the global bank, and if a notebook is provided, searches it too. Merges results."""
        results = []
        
        # 1. Search Personal Notebook (Priority)
        if notebook_id:
            notebook_col = f"notebook_{notebook_id}"
            nb_results = self.search_questions(keyword, notebook_col, k)
            # Boost notebook results slightly to prioritize private context
            for r in nb_results:
                r["similarity_score"] *= 1.2
            results.extend(nb_results)
            
        # 2. Search Global Bank
        global_results = self.search_questions(keyword, config.COLLECTION_GLOBAL, k)
        results.extend(global_results)
        
        # 3. Sort and deduplicate
        results = sorted(results, key=lambda x: x.get("similarity_score", 0), reverse=True)
        
        unique_results = []
        seen = set()
        for r in results:
            q_norm = r["question"].strip().lower()
            if q_norm not in seen:
                unique_results.append(r)
                seen.add(q_norm)
                
        return unique_results[:k]

    def upsert_questions(self, questions: List[Dict], collection_name: str) -> bool:
        collection = self.get_collection(collection_name)
        if not collection: return False

        try:
            ids, docs, metas = [], [], []
            for q in questions:
                q_text = q.get("text") or q.get("question")
                if not q_text: continue
                docs.append(q_text)
                
                import hashlib
                q_hash = hashlib.md5(q_text.strip().lower().encode()).hexdigest()[:12]
                ids.append(q.get("id") or f"usr_{q_hash}")
                
                meta = q.get("metadata", {}).copy()
                sanitized_meta = {k: (v if isinstance(v, (str, int, float, bool)) else (str(v) if v is not None else "")) for k, v in meta.items()}
                metas.append(sanitized_meta)

            if not docs: return False

            embeddings = compute_embeddings(docs)
            collection.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embeddings)
            logger.info(f"Upserted {len(docs)} items to {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Upsert error: {e}")
            return False

chroma_wrapper = ChromaClientWrapper()
