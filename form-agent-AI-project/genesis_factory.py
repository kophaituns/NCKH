import os
import json
import time
import requests
from datetime import datetime
from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv

load_dotenv()

# Configuration
AI_SERVER_URL = "http://localhost:8000/api"
API_KEY = os.getenv("GEMINI_API_KEY", "")
# Re-confirmed model name from list: models/gemini-flash-latest
GEMINI_MODEL = "gemini-flash-latest"

# 3 CORE INDUSTRIES & KEYWORDS (Targeted Jumpstart)
KEYWORD_TAXONOMY = {
    "it": ['Python', 'Data Science', 'Security', 'React', 'FastAPI'],
    "marketing": ['SEO', 'Digital Ads', 'Branding', 'Social Media', 'Leads'],
    "economics": ['Inflation', 'GDP', 'Markets', 'Banking', 'Trade']
}

class MicroGenesisFactory:
    def __init__(self):
        if not API_KEY:
            print("❌ GEMINI_API_KEY not found!")
            return
        self.client = genai.Client(api_key=API_KEY)
        print(f"🚀 Micro-Genesis Factory Active (Safe Mode). Target: 15 Core Keywords.")

    def generate_micro_batch(self, category, keyword):
        print(f"🧬 [{datetime.now().strftime('%H:%M:%S')}] Synthesizing: {keyword}...")
        
        # Asking for only 20 questions to minimize token/quota pressure
        prompt = f"""Generate 20 high-quality, scientifically structured research questions for the keyword '{keyword}' in {category}.
        JSON array of objects: [{{'question': str, 'type': str}}]. Language: Tiếng Việt."""

        max_retries = 5
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        temperature=0.7,
                        response_mime_type="application/json"
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                if "429" in str(e):
                    wait = 60 * (attempt + 1)
                    print(f"⏳ Rate limited (429). Cooling down for {wait}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(wait)
                    continue
                print(f"⚠️ Error: {e}")
                return []

    def ingest(self, questions, category):
        if not questions: return
        payload = {
            "questions": [q['question'] for q in questions],
            "collection_name": "question_bank"
        }
        try:
            res = requests.post(f"{AI_SERVER_URL}/learn", json=payload, timeout=30)
            if res.status_code == 200:
                print(f"✅ Ingested {len(questions)} pillars for {category}.")
                return True
        except Exception as e:
            print(f"⚠️ Connection error: {e}")
        return False

    def run(self):
        total = 0
        for category, keywords in KEYWORD_TAXONOMY.items():
            for kw in keywords:
                questions = self.generate_micro_batch(category, kw)
                if questions:
                    if self.ingest(questions, category):
                        total += len(questions)
                
                # CRITICAL: Sleep long enough to reset the Free Tier RPM (usually 15-20 RPM)
                print("💤 Safety nap (45s) to avoid Google filter...")
                time.sleep(45)
            
        print(f"\n🏆 JUMPSTART COMPLETE. Total Pillars Synthesized: {total}")

if __name__ == "__main__":
    factory = MicroGenesisFactory()
    factory.run()
