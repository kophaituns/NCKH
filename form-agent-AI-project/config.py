import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ChromaDB
    CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
    CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
    COLLECTION_GLOBAL = os.getenv("COLLECTION_GLOBAL", "global_knowledge")
    COLLECTION_REFINED = os.getenv("COLLECTION_REFINED", "human_refined")
    
    # Gemini
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    
    # Settings
    RETRIEVE_K = 15
    DEFAULT_NUM_Q = 7

config = Config()
