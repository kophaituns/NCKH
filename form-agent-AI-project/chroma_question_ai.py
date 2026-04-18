import os
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
import logging

# Configuration
CHROMA_PATH = Path("chroma_db")
COLLECTION_NAME = "question_bank"

# Setup logging
logging.basicConfig(level=logging.INFO)
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

    def query_questions(self, keyword, num_results=5, offset=0, categories=None, collection_name=COLLECTION_NAME):
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
            # Prepare filters if categories are provided
            where_filter = None
            if categories:
                if isinstance(categories, list):
                    where_filter = {"category": {"$in": categories}}
                else:
                    where_filter = {"category": categories}

            # Query Chroma
            results = collection.query(
                query_texts=[keyword],
                n_results=offset + num_results,
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )

            if not results or not results["documents"]:
                return []

            # Process results
            formatted_questions = []
            
            # Slicing for offset
            docs = results["documents"][0][offset:]
            metas = results["metadatas"][0][offset:]
            dists = results["distances"][0][offset:]

            for i, (doc, meta, dist) in enumerate(zip(docs, metas, dists)):
                # dist is cosine distance (0 is identical, 2 is opposite)
                # Convert to confidence score (1 - dist)
                confidence = max(0, 1 - dist)
                
                formatted_questions.append({
                    "question": doc,
                    "category": meta.get("category", "unknown"),
                    "confidence": confidence,
                    "method": "chroma_semantic_search",
                    "source_keyword": meta.get("keyword", ""),
                    "question_type": self._detect_form_type(doc),
                    "semantic_type": meta.get("sub_category", "general"),
                    "similarity_score": round(1 - dist, 4)
                })

            return formatted_questions

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

# Test logic
if __name__ == "__main__":
    ai = ChromaQuestionAI()
    test_keyword = "AI và Machine Learning"
    print(f"🔍 Testing ChromaDB search for: '{test_keyword}'")
    results = ai.query_questions(test_keyword, num_results=3)
    for q in results:
        print(f"- {q['question']} (Conf: {q['confidence']:.2f})")
