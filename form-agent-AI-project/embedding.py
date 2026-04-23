import os
import sys

# Windows DLL fix for torch / sentence-transformers
if os.name == 'nt':
    for p in [
        os.path.join(sys.prefix, 'Lib', 'site-packages', 'torch', 'lib'),
        r"D:\NCKH\form-agent-AI-project\.venv\Lib\site-packages\torch\lib"
    ]:
        if os.path.exists(p):
            try:
                os.add_dll_directory(p)
            except Exception:
                pass

from chromadb.utils import embedding_functions

# Singleton embedding function
_embedding_fn = None

def get_embedding_function():
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
    return _embedding_fn

def compute_embeddings(texts: list[str]) -> list[list[float]]:
    """Helper to compute embeddings manually and return native python floats (prevents Windows crash)."""
    fn = get_embedding_function()
    raw = fn(texts)
    # Convert numpy to python float lists
    return [
        [float(x) for x in emb] if hasattr(emb, "__iter__") and not isinstance(emb, list) else emb
        for emb in raw
    ]
