import logging
import chromadb
import datetime
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

    def delete_notebook(self, workspace_id: str) -> bool:
        """Completely deletes a private workspace collection."""
        if not self.client: return False
        col_name = f"workspace_{workspace_id}"
        try:
            self.client.delete_collection(col_name)
            logger.info(f"Deleted workspace collection: {col_name}")
            return True
        except Exception as e:
            logger.warning(f"Workspace {col_name} might not exist to delete: {e}")
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

    def hybrid_search(self, keyword: str, workspace_id: str = None, k: int = 15) -> List[Dict[str, Any]]:
        """Searches the global bank, and if a workspace is provided, searches it too. Merges results."""
        results = []
        
        # 1. Search Personal Workspace (Priority)
        if workspace_id:
            workspace_col = f"workspace_{workspace_id}"
            ws_results = self.search_questions(keyword, workspace_col, k)
            
            # [IMPROVEMENT] If no specific matches but we are in a workspace, 
            # try to get ANY relevant content to avoid total fallback to global knowledge.
            if not ws_results:
                logger.info(f"RAG: No specific matches for '{keyword}' in {workspace_col}. Trying broad peek...")
                collection = self.get_collection(workspace_col)
                if collection:
                    peek_res = collection.peek(limit=5)
                    for doc, meta, q_id in zip(peek_res['documents'], peek_res['metadatas'], peek_res['ids']):
                        ws_results.append({
                            "id": q_id,
                            "question": doc,
                            "category": meta.get("category", "general"),
                            "confidence": 0.5, # Low confidence but high relevance to workspace
                            "similarity_score": 0.5,
                            "source": workspace_col,
                            "is_broad_context": True
                        })
            
            # Boost workspace results slightly to prioritize private context
            for r in ws_results:
                r["similarity_score"] *= 1.2
            results.extend(ws_results)
            
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

    def get_collection_sources(self, collection_name: str) -> List[str]:
        """Extracts unique source names/titles from a collection's metadata."""
        collection = self.get_collection(collection_name)
        if not collection: return []
        try:
            res = collection.get(include=['metadatas'], limit=100)
            sources = set()
            if res and res['metadatas']:
                for m in res['metadatas']:
                    if m.get('source'):
                        sources.add(m.get('source'))
            return list(sources)
        except Exception as e:
            logger.warning(f"Could not fetch sources for {collection_name}: {e}")
            return []

    def update_source_name(self, workspace_id: str, old_name: str, new_name: str) -> bool:
        """Updates all chunks' metadata when a source is renamed."""
        collection_name = f"workspace_{workspace_id}"
        collection = self.get_collection(collection_name)
        if not collection: return False
        try:
            res = collection.get(where={"source": old_name}, include=['metadatas'])
            if not res or not res['ids']:
                return True
            
            ids = res['ids']
            new_metas = []
            for m in res['metadatas']:
                m['source'] = new_name
                new_metas.append(m)
            
            collection.update(ids=ids, metadatas=new_metas)
            logger.info(f"Updated {len(ids)} chunks: {old_name} -> {new_name} in {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error updating source name: {e}")
            return False

    def delete_source(self, workspace_id: str, source_name: str) -> bool:
        """Deletes all chunks belonging to a specific source in a workspace."""
        collection_name = f"workspace_{workspace_id}"
        collection = self.get_collection(collection_name)
        if not collection: return False
        try:
            collection.delete(where={"source": source_name})
            logger.info(f"Deleted source '{source_name}' from {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting source {source_name}: {e}")
            return False

    def upsert_workspace_summary(self, workspace_id: str, summary: str) -> bool:
        """Stores a high-level summary of the entire workspace for global context."""
        collection = self.get_collection("workspace_summaries")
        if not collection: return False
        try:
            collection.upsert(
                ids=[workspace_id],
                documents=[summary],
                metadatas=[{"type": "global_summary", "updated_at": str(datetime.datetime.now())}]
            )
            logger.info(f"Updated global summary for workspace: {workspace_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving workspace summary: {e}")
            return False

    def get_workspace_summary(self, workspace_id: str) -> str:
        """Retrieves the pre-computed global summary for a workspace."""
        collection = self.get_collection("workspace_summaries")
        if not collection: return ""
        try:
            res = collection.get(ids=[workspace_id])
            if res and res['documents']:
                return res['documents'][0]
            return ""
        except Exception:
            return ""

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
