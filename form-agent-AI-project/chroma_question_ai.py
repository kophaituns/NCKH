import os
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
import logging
from datetime import datetime

# Configuration
CHROMA_PATH = Path("chroma_db")
COLLECTION_NAME = "question_bank"

# Setup logging
logger = logging.getLogger(__name__)

class ChromaQuestionAI:
    def __init__(self, persistence_path=CHROMA_PATH):
        self.persistence_path = Path(persistence_path)
        self.persistence_path.mkdir(exist_ok=True)
        
        # Initialize Client
        self.client = chromadb.PersistentClient(path=str(self.persistence_path))
        
        # Setup Embedding Function (must match ingestor)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
        
        # Get Collection
        try:
            self.collection = self.client.get_collection(
                name=COLLECTION_NAME,
                embedding_function=self.embedding_fn
            )
            logger.info("ChromaDB connected: %s", COLLECTION_NAME)
        except Exception as e:
            logger.error("ChromaDB collection not found %s: %s", COLLECTION_NAME, e)
            self.collection = None

    def query_questions(self, keyword, num_results=5, offset=0, categories=None, where_filter=None, collection_name=COLLECTION_NAME):
        """
        Search for questions semantically similar to the keyword.
        """
        # Targeted collection retrieval
        collection = self.collection
        if collection_name != COLLECTION_NAME:
            try:
                collection = self.client.get_collection(
                    name=collection_name,
                    embedding_function=self.embedding_fn
                )
            except Exception:
                logger.warning("Collection %s not found, falling back.", collection_name)
                return []

        if not collection:
            logger.error("No valid collection to query.")
            return []

        try:
            # Prepare filters if categories are provided (Merge with where_filter if exists)
            effective_filter = where_filter
            if categories:
                cat_filter = {}
                if isinstance(categories, list):
                    cat_filter = {"category": {"$in": categories}}
                else:
                    cat_filter = {"category": categories}
                
                if effective_filter:
                    # Combine existing filter with category filter using $and
                    effective_filter = {"$and": [effective_filter, cat_filter]}
                else:
                    effective_filter = cat_filter

            # Query Chroma with oversampling to allow for deduplication
            # Oversample to ensure we find enough unique results
            oversample_factor = 3
            query_limit = max(50, (offset + num_results) * oversample_factor)
            
            results = collection.query(
                query_texts=[keyword],
                n_results=query_limit,
                where=effective_filter,
                include=["documents", "metadatas", "distances"]
            )

            if not results or not results["documents"] or len(results["documents"][0]) == 0:
                return []

            # Process results with deduplication
            seen_content = set()
            formatted_questions = []
            
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0]
            ids = results["ids"][0]

            for doc, meta, dist, q_id in zip(docs, metas, dists, ids):
                # Normalize content for comparison
                content_norm = doc.strip().lower()
                
                # Deduplication check
                if content_norm in seen_content:
                    continue
                seen_content.add(content_norm)
                
                # dist is cosine distance (0 is identical, 2 is opposite)
                confidence = max(0, 1 - dist)
                
                formatted_questions.append({
                    "id": q_id,
                    "question": doc,
                    "category": meta.get("category", "unknown"),
                    "confidence": confidence,
                    "method": "chroma_semantic_search",
                    "source_keyword": meta.get("keyword", ""),
                    "question_type": self._detect_form_type(doc),
                    "semantic_type": meta.get("sub_category", "general"),
                    "similarity_score": round(1 - dist, 4),
                    "launch_count": int(meta.get("launch_count", 0))
                })

            # Apply offset and limit AFTER deduplication
            final_results = formatted_questions[offset : offset + num_results]
            
            # Diagnostic log if we retrieved fewer unique items than requested
            if len(final_results) < num_results and len(formatted_questions) < query_limit:
                logger.info("Retrieved only %d unique questions for '%s'", len(final_results), keyword)
                
            return final_results

        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return []

    def _detect_form_type(self, question_text):
        # Basic implementation mirroring the one in RealDataQuestionTrainer
        import re
        q = question_text.lower().strip()
        if re.search(r'(rate|rating|how (satisfied|likely)|on a scale|level of)', q):
            return 'rating'
        if re.search(r'(agree|disagree|strongly|extent do you)', q):
            return 'likert_scale'
        if re.search(r'^(do you|does|is|are|can|could|would|should|will|has|have)\s', q):
            return 'single_choice'
        if re.search(r'^(what|how|why|describe|explain|list|name|identify|tell)', q):
            return 'open_ended'
        return 'text'

    def reset_collection(self, collection_name=COLLECTION_NAME):
        """
        Delete all items in a collection and recreate it.
        """
        try:
            # Delete the collection entirely
            self.client.delete_collection(name=collection_name)
            
            # Recreate it immediately so it's ready for use
            self.client.create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn
            )
            
            # If it was the primary collection, update the local reference
            if collection_name == COLLECTION_NAME:
                self.collection = self.client.get_collection(
                    name=collection_name,
                    embedding_function=self.embedding_fn
                )
                
            logger.info("Collection %s has been reset (cleared).", collection_name)
            return True
        except Exception as e:
            logger.error("Error resetting collection %s: %s", collection_name, e)
            # If it didn't exist, that's fine too - just try creating it
            try:
                self.client.get_or_create_collection(
                    name=collection_name,
                    embedding_function=self.embedding_fn
                )
                return True
            except:
                return False

    def upsert_questions(self, questions, collection_name=COLLECTION_NAME):
        """
        Add or update questions in the specified collection.
        'questions' should be a list of dicts with:
        - question: text content
        - id: optional unique identifier
        - metadata: dict of additional fields
        """
        try:
            # Get or create collection
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn
            )
            
            unique_entries = {}
            import hashlib
            from datetime import datetime

            for q in questions:
                q_text = q.get("question") or q.get("text")
                if not q_text: continue
                
                # Deterministic ID based on question hash (8 chars) to group identical questions
                q_hash = hashlib.md5(q_text.strip().lower().encode()).hexdigest()[:12]
                q_id = q.get("id") or f"usr_{q_hash}"
                
                meta = q.get("metadata", {}).copy() # Use copy to avoid side effects
                # Ensure core metadata fields exist
                meta.setdefault("category", "general")
                meta.setdefault("sub_category", "refined")
                meta.setdefault("source", "giga_ingest")
                meta.setdefault("ingested_at", str(datetime.now().isoformat()))
                
                # Store in dict to handle intra-batch duplicates
                # If duplicate exists in batch, the last one wins
                unique_entries[q_id] = {
                    "document": q_text,
                    "metadata": meta
                }
            
            if unique_entries:
                ids = list(unique_entries.keys())
                documents = [v["document"] for v in unique_entries.values()]
                metadatas = [v["metadata"] for v in unique_entries.values()]
                
                collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info("Upserted %d unique questions to collection: %s", len(ids), collection_name)
                return True
            return False
        except Exception as e:
            logger.error("Error upserting to ChromaDB: %s", e)
            return False

# Test logic
if __name__ == "__main__":
    from datetime import datetime # Needed for the new method
    ai = ChromaQuestionAI()
    test_keyword = "AI và Machine Learning"
    print(f"🔍 Testing ChromaDB search for: '{test_keyword}'")
    results = ai.query_questions(test_keyword, num_results=3)
    for q in results:
        print(f"- {q['question']} (Conf: {q['confidence']:.2f})")
