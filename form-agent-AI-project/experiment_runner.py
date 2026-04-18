#!/usr/bin/env python3
"""
=============================================================================
EXPERIMENT: So sánh 3 phương pháp truy xuất câu hỏi
=============================================================================
Mục tiêu khoa học:
  Chứng minh Semantic Search (ChromaDB + Sentence Transformers)
  vượt trội hơn TF-IDF và Template trong việc truy xuất câu hỏi khảo sát
  phù hợp với từ khóa đầu vào.

Phương pháp đánh giá:
  - Precision@K : Tỉ lệ câu hỏi đúng chuyên ngành trong K kết quả trả về
  - MRR         : Mean Reciprocal Rank (câu đúng xuất hiện ở vị trí nào)
  - Avg Cosine  : Điểm tương đồng trung bình (từ ChromaDB)
  - Latency     : Thời gian phản hồi (ms)
  - Relevance   : Điểm đánh giá thủ công (chạy --manual)
=============================================================================
"""

import os, sys, time, json, csv
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

# ── Thêm thư mục gốc vào PATH ───────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# ── Tập từ khóa thực nghiệm (đa dạng, có tiếng Việt và tiếng Anh) ───────────
EVAL_KEYWORDS = [
    # IT
    {"keyword": "cybersecurity",        "expected_category": "it"},
    {"keyword": "machine learning",     "expected_category": "it"},
    {"keyword": "cloud computing",      "expected_category": "it"},
    {"keyword": "api development",      "expected_category": "it"},
    {"keyword": "an toàn mạng",         "expected_category": "it"},    # tiếng Việt
    {"keyword": "học máy",              "expected_category": "it"},    # tiếng Việt
    {"keyword": "data science",         "expected_category": "it"},
    {"keyword": "devops pipeline",      "expected_category": "it"},
    # Economics
    {"keyword": "investment portfolio", "expected_category": "economics"},
    {"keyword": "risk assessment",      "expected_category": "economics"},
    {"keyword": "financial planning",   "expected_category": "economics"},
    {"keyword": "đầu tư tài chính",     "expected_category": "economics"}, # tiếng Việt
    {"keyword": "market analysis",      "expected_category": "economics"},
    {"keyword": "cryptocurrency",       "expected_category": "economics"},
    # Marketing
    {"keyword": "digital marketing",    "expected_category": "marketing"},
    {"keyword": "customer retention",   "expected_category": "marketing"},
    {"keyword": "seo optimization",     "expected_category": "marketing"},
    {"keyword": "chiến lược marketing", "expected_category": "marketing"}, # tiếng Việt
    {"keyword": "brand management",     "expected_category": "marketing"},
    {"keyword": "social media campaign","expected_category": "marketing"},
]

K = 5  # Precision@K


# ═══════════════════════════════════════════════════════════════════════════════
# PHƯƠNG PHÁP 1: TF-IDF (Baseline cũ)
# ═══════════════════════════════════════════════════════════════════════════════
def build_tfidf_index(sample_df):
    """Xây chỉ mục TF-IDF từ dataset questions."""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sample_df['question'].fillna(''))
    return vectorizer, tfidf_matrix

def search_tfidf(keyword, vectorizer, tfidf_matrix, df, k=K):
    """Tìm kiếm câu hỏi bằng TF-IDF."""
    from sklearn.metrics.pairwise import cosine_similarity
    
    query_vec = vectorizer.transform([keyword])
    scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_indices = scores.argsort()[::-1][:k]
    
    results = []
    for idx in top_indices:
        results.append({
            "question": df.iloc[idx]['question'],
            "category": df.iloc[idx]['category'],
            "score": float(scores[idx]),
        })
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# PHƯƠNG PHÁP 2: TEMPLATE (Fallback cũ)
# ═══════════════════════════════════════════════════════════════════════════════
IT_TEMPLATES = [
    "How do you implement {keyword} in a production environment?",
    "What are the best practices for {keyword}?",
    "What security considerations should be taken when using {keyword}?",
    "How do you troubleshoot common issues with {keyword}?",
    "What tools are essential for {keyword}?",
]
ECON_TEMPLATES = [
    "What factors should be considered when evaluating {keyword}?",
    "What are the risks associated with {keyword}?",
    "How do you measure {keyword} performance?",
    "What strategies work best for {keyword} investment?",
    "How do economic conditions affect {keyword}?",
]
MARKETING_TEMPLATES = [
    "How do you develop an effective {keyword} strategy?",
    "What KPIs are most important for {keyword}?",
    "How do you measure the ROI of {keyword} campaigns?",
    "What channels are most effective for {keyword}?",
    "How do you identify the right audience for {keyword}?",
]

def search_template(keyword, expected_cat, k=K):
    """Sinh câu hỏi bằng template (không có semantic understanding)."""
    cat_map = {
        "it": IT_TEMPLATES,
        "economics": ECON_TEMPLATES,
        "marketing": MARKETING_TEMPLATES,
    }
    templates = cat_map.get(expected_cat, IT_TEMPLATES)
    results = []
    for t in templates[:k]:
        results.append({
            "question": t.format(keyword=keyword),
            "category": expected_cat,
            "score": 0.0,  # Template không có score
        })
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# PHƯƠNG PHÁP 3: SEMANTIC SEARCH (ChromaDB - Hệ thống mới)
# ═══════════════════════════════════════════════════════════════════════════════
def search_semantic(keyword, chroma_ai, k=K):
    """Tìm kiếm câu hỏi bằng ChromaDB Semantic Search."""
    results = chroma_ai.query_questions(keyword, num_results=k)
    return [
        {
            "question": r["question"],
            "category": r["category"],
            "score": r.get("similarity_score", 0.0),
        }
        for r in results
    ]

# ═══════════════════════════════════════════════════════════════════════════════
# METRICS
# ═══════════════════════════════════════════════════════════════════════════════
def precision_at_k(results, expected_category, k=K):
    """Tính Precision@K: tỉ lệ câu hỏi đúng chuyên ngành."""
    if not results:
        return 0.0
    correct = sum(1 for r in results[:k] if r.get('category', '') == expected_category)
    return correct / min(k, len(results))

def mean_reciprocal_rank(results, expected_category):
    """Tính MRR: câu đúng đầu tiên xuất hiện ở vị trí nào."""
    for i, r in enumerate(results):
        if r.get('category', '') == expected_category:
            return 1.0 / (i + 1)
    return 0.0

def avg_score(results):
    """Trung bình điểm similarity."""
    if not results:
        return 0.0
    return np.mean([r.get('score', 0.0) for r in results])

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXPERIMENT RUNNER
# ═══════════════════════════════════════════════════════════════════════════════
def run_experiment(use_chroma=True, manual_rating=False):
    print("=" * 70)
    print("  EXPERIMENT: So sánh 3 phương pháp truy xuất câu hỏi")
    print(f"  Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Số từ khóa test: {len(EVAL_KEYWORDS)} | K={K}")
    print("=" * 70)

    # ── Load dataset TF-IDF ──────────────────────────────────────────────────
    print("\n📦 Đang load dataset cho TF-IDF...")
    sample_path = "question_datasets/question_sample_1000.csv"
    df_sample = pd.read_csv(sample_path)
    vectorizer, tfidf_matrix = build_tfidf_index(df_sample)
    print(f"   ✅ Loaded {len(df_sample)} câu hỏi cho TF-IDF index")

    # ── Load ChromaDB ────────────────────────────────────────────────────────
    chroma_ai = None
    if use_chroma:
        print("\n🔗 Đang kết nối ChromaDB...")
        try:
            from chroma_question_ai import ChromaQuestionAI
            chroma_ai = ChromaQuestionAI()
            count = chroma_ai.collection.count() if chroma_ai.collection else 0
            print(f"   ✅ ChromaDB: {count:,} vectors đã được nạp")
        except Exception as e:
            print(f"   ⚠️  ChromaDB không khả dụng: {e}")
            print("   → Sẽ bỏ qua phương pháp Semantic trong thực nghiệm này.")
            chroma_ai = None

    # ── Chạy thực nghiệm ─────────────────────────────────────────────────────
    all_results = []
    print("\n🔬 Bắt đầu thực nghiệm...\n")
    print(f"{'Keyword':<28} {'Method':<12} {'P@K':>5} {'MRR':>5} {'AvgSim':>7} {'Lat(ms)':>8}")
    print("-" * 70)

    for item in EVAL_KEYWORDS:
        kw = item["keyword"]
        cat = item["expected_category"]
        row = {"keyword": kw, "expected_category": cat}

        # Method 1: TF-IDF
        t0 = time.perf_counter()
        tfidf_res = search_tfidf(kw, vectorizer, tfidf_matrix, df_sample)
        lat_tfidf = (time.perf_counter() - t0) * 1000
        p_tfidf = precision_at_k(tfidf_res, cat)
        mrr_tfidf = mean_reciprocal_rank(tfidf_res, cat)
        sim_tfidf = avg_score(tfidf_res)
        row.update({"tfidf_pk": p_tfidf, "tfidf_mrr": mrr_tfidf, "tfidf_sim": sim_tfidf, "tfidf_lat": lat_tfidf})
        print(f"{kw:<28} {'TF-IDF':<12} {p_tfidf:>5.2f} {mrr_tfidf:>5.2f} {sim_tfidf:>7.4f} {lat_tfidf:>7.1f}ms")

        # Method 2: Template
        t0 = time.perf_counter()
        tmpl_res = search_template(kw, cat)
        lat_tmpl = (time.perf_counter() - t0) * 1000
        p_tmpl = precision_at_k(tmpl_res, cat)
        mrr_tmpl = mean_reciprocal_rank(tmpl_res, cat)
        row.update({"tmpl_pk": p_tmpl, "tmpl_mrr": mrr_tmpl, "tmpl_lat": lat_tmpl})
        print(f"{kw:<28} {'Template':<12} {p_tmpl:>5.2f} {mrr_tmpl:>5.2f} {'N/A':>7} {lat_tmpl:>7.1f}ms")

        # Method 3: Semantic (ChromaDB)
        if chroma_ai:
            t0 = time.perf_counter()
            sem_res = search_semantic(kw, chroma_ai)
            lat_sem = (time.perf_counter() - t0) * 1000
            p_sem = precision_at_k(sem_res, cat)
            mrr_sem = mean_reciprocal_rank(sem_res, cat)
            sim_sem = avg_score(sem_res)
            row.update({"sem_pk": p_sem, "sem_mrr": mrr_sem, "sem_sim": sim_sem, "sem_lat": lat_sem})
            print(f"{kw:<28} {'Semantic':<12} {p_sem:>5.2f} {mrr_sem:>5.2f} {sim_sem:>7.4f} {lat_sem:>7.1f}ms")
        else:
            row.update({"sem_pk": None, "sem_mrr": None, "sem_sim": None, "sem_lat": None})

        print()
        all_results.append(row)

    # ── Tổng kết ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  TỔNG KẾT KẾT QUẢ THỰC NGHIỆM")
    print("=" * 70)

    df_res = pd.DataFrame(all_results)

    methods = ["tfidf", "tmpl"]
    if chroma_ai:
        methods.append("sem")

    summary = {}
    for m in methods:
        name = {"tfidf": "TF-IDF (Baseline)", "tmpl": "Template (Fallback)", "sem": "Semantic (Hệ thống mới)"}[m]
        pk_col = f"{m}_pk"
        mrr_col = f"{m}_mrr"
        lat_col = f"{m}_lat"
        sim_col = f"{m}_sim" if m in ["tfidf", "sem"] else None

        avg_pk  = df_res[pk_col].mean() if pk_col in df_res else 0
        avg_mrr = df_res[mrr_col].mean() if mrr_col in df_res else 0
        avg_lat = df_res[lat_col].mean() if lat_col in df_res else 0
        avg_sim = df_res[sim_col].mean() if sim_col and sim_col in df_res else None

        summary[name] = {"Precision@K": avg_pk, "MRR": avg_mrr, "Avg Latency (ms)": avg_lat, "Avg Similarity": avg_sim}

        sim_str = f"{avg_sim:.4f}" if avg_sim is not None else "  N/A "
        print(f"\n  [{name}]")
        print(f"    Precision@{K}      : {avg_pk:.4f}  ({avg_pk*100:.1f}%)")
        print(f"    Mean Reciprocal Rank: {avg_mrr:.4f}")
        print(f"    Avg Cosine Sim      : {sim_str}")
        print(f"    Avg Latency         : {avg_lat:.1f} ms")

    # ── Lưu kết quả ra file ──────────────────────────────────────────────────
    out_dir = Path("experiment_results")
    out_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    # CSV chi tiết
    csv_path = out_dir / f"experiment_detail_{ts}.csv"
    df_res.to_csv(csv_path, index=False)

    # JSON tổng kết
    json_path = out_dir / f"experiment_summary_{ts}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": ts,
            "eval_keywords_count": len(EVAL_KEYWORDS),
            "K": K,
            "summary": summary
        }, f, indent=2, ensure_ascii=False)

    print(f"\n📁 Kết quả đã lưu:")
    print(f"   Chi tiết  → {csv_path}")
    print(f"   Tổng kết  → {json_path}")
    print("=" * 70)

    return summary


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Chạy thực nghiệm so sánh 3 phương pháp truy xuất")
    parser.add_argument("--no-chroma", action="store_true", help="Bỏ qua ChromaDB (chỉ test TF-IDF và Template)")
    args = parser.parse_args()

    run_experiment(use_chroma=not args.no_chroma)
