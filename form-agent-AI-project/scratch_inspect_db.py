
import sqlite3
import os

db_path = 'chroma_db/chroma.sqlite3'
if not os.path.exists(db_path):
    print("Database not found!")
    exit()

conn = sqlite3.connect(db_path)
view_cursor = conn.cursor()

print("--- COLLECTIONS ---")
view_cursor.execute("SELECT id, name FROM collections")
collections = view_cursor.fetchall()
for c in collections:
    print(c)

print("\n--- TABLE SIZES (approx) ---")
tables = ['embeddings', 'embedding_metadata', 'embeddings_queue', 'collections']
for table in tables:
    try:
        view_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = view_cursor.fetchone()[0]
        print(f"Table {table}: {count} rows")
    except Exception as e:
        print(f"Table {table}: Could not count ({e})")

# Check if there are any embeddings not linked to current collections
if collections:
    coll_ids = [f"'{c[0]}'" for c in collections]
    coll_ids_str = ",".join(coll_ids)
    try:
        view_cursor.execute(f"SELECT COUNT(*) FROM embeddings WHERE collection_id NOT IN ({coll_ids_str})")
        orphaned = view_cursor.fetchone()[0]
        print(f"\nOrphaned embeddings (not in current collections): {orphaned}")
    except Exception as e:
        print(f"\nError checking orphans: {e}")

conn.close()
