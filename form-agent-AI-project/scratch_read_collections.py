
import sqlite3
conn = sqlite3.connect('chroma_db/chroma.sqlite3')
cursor = conn.cursor()
cursor.execute("SELECT * FROM collections")
rows = cursor.fetchall()
for row in rows:
    print(row)
conn.close()
