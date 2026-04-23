import csv
from pathlib import Path
from typing import List, Dict

def parse_local_file(file_path: Path) -> List[Dict]:
    """Parses local files into a list of questions to ingest."""
    results = []
    try:
        if file_path.suffix == '.csv':
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    q = row.get('question', '').strip()
                    if q:
                        results.append({
                            "text": q,
                            "metadata": {"source_file": file_path.name, "category": row.get('category', 'general')}
                        })
        elif file_path.suffix == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    q = line.strip()
                    if q and len(q) > 10:
                        results.append({
                            "text": q,
                            "metadata": {"source_file": file_path.name}
                        })
    except Exception as e:
        print(f"Failed to parse {file_path}: {e}")
    return results
