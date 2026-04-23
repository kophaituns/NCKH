import json
import logging
import re
import uuid
from typing import Dict, Any, List

from google import genai
from google.genai import types as genai_types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import config

logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        self.model_name = config.GEMINI_MODEL
        self.ready = False
        self.client = None

        if self.api_key and self.api_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.ready = True
                logger.info(f"AIAgent ready with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to init AIAgent: {e}")

    @retry(
        wait=wait_exponential(multiplier=0.5, min=1, max=10),
        stop=stop_after_attempt(2),
        retry=retry_if_exception_type(Exception),
        reraise=True
    )
    def call_gemini(self, prompt: str, mime_type: str = "application/json") -> str:
        if not self.ready:
            raise Exception("Gemini client not initialized")
            
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=4096,
                response_mime_type=mime_type,
            ),
        )
        return response.text.strip()

    def analyze_intent(self, user_prompt: str, expected_intent: str = "survey") -> Dict[str, Any]:
        """Analyzes user intent."""
        if not self.ready:
            return {"intent": expected_intent, "keywords": user_prompt, "category": "general"}
            
        prompt = f"""Analyze this user prompt for a form generation task: "{user_prompt}"
CONTEXT: Expected type: {expected_intent}.
        
Return a STRICT JSON object:
{{
  "intent": "survey | registration | feedback | quiz | contact",
  "keywords": "3-5 optimized search terms separated by commas",
  "category": "it | economics | marketing | general"
}}"""
        try:
            raw = self.call_gemini(prompt)
            return json.loads(raw)
        except Exception:
            return {"intent": expected_intent, "keywords": user_prompt, "category": "general"}

    def generate_form(self, user_prompt: str, context_results: List[Dict], intent_info: Dict, num_q: int, notebook_id: str = None, language: str = "vi") -> Dict[str, Any]:
        """Builds the prompt based on whether it is a Personal Notebook or Global RAG."""
        
        # Prepare context JSON
        grounding_context = []
        is_private = False
        
        for r in context_results:
            if r.get("source", "").startswith("notebook_"):
                is_private = True
            grounding_context.append({
                "text": r["question"],
                "source": "PRIVATE_NOTEBOOK" if r.get("source", "").startswith("notebook_") else "GLOBAL_BANK",
                "fidelity": r.get("similarity_score", 0)
            })
            
        avg_fidelity = sum(r.get("similarity_score", 0) for r in context_results) / len(context_results) if context_results else 0
        
        # DYNAMIC PROMPTING (NotebookLM Style)
        if notebook_id and is_private:
            grounding_clause = """[STRICT NOTEBOOK GROUNDING]
CRITICAL RULE: The context below is from the user's PERSONAL NOTEBOOK. 
You MUST prioritize this data. Do not invent things outside their notebook context unless strictly necessary to bridge gaps. Every question generated should heavily reflect their uploaded documents."""
        else:
            grounding_clause = """[GLOBAL HYBRID GROUNDING]
You are using the global question bank. Blend the provided context with your own internal expert knowledge to create the best possible form."""

        prompt = f"""You are an Expert AI Form Generator.
Target Language: {language.upper()}

[1] RESEARCH OBJECTIVE:
"{user_prompt}"
- Domain: {intent_info.get('category', 'general').upper()}

[2] KNOWLEDGE CONTEXT (RAG):
{grounding_clause}
{json.dumps(grounding_context, indent=2) if grounding_context else 'NO CONTEXT. USE INTERNAL EXPERTISE.'}

[3] EXECUTION RULES:
1. Synthesize the context to create exactly {num_q} highly relevant form questions.
2. Form type should be '{intent_info.get('intent', 'survey')}'.
3. RETURN STRICT JSON ONLY.

[4] JSON OUTPUT SCHEMA:
{{
  "form_id": "{uuid.uuid4().hex[:8]}",
  "title": "Generated Form Title",
  "description": "Short description",
  "questions": [
    {{
      "id": "q1",
      "question": "Question text here?",
      "type": "single_choice | multiple_choice | likert_scale | rating | text",
      "grounded": true,
      "required": true,
      "options": ["Opt 1", "Opt 2"]
    }}
  ],
  "metadata": {{
    "expected_insights": "Analysis of what this measures",
    "grounding_fidelity": {round(avg_fidelity, 2)},
    "mode": "{"personal_notebook" if notebook_id else "global_bank"}"
  }}
}}"""
        if not self.ready:
            return self._build_fallback(user_prompt, context_results, num_q)

        try:
            raw = self.call_gemini(prompt)
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
            result = json.loads(raw)
            return result
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            return self._build_fallback(user_prompt, context_results, num_q)

    def _build_fallback(self, prompt: str, results: List[Dict], num_q: int) -> Dict[str, Any]:
        """Fallback to direct ChromaDB items."""
        questions = []
        for i, r in enumerate(results[:num_q]):
            questions.append({
                "id": f"q{i+1}",
                "question": r["question"],
                "type": "text",
                "required": True,
                "options": []
            })
        return {
            "form_id": uuid.uuid4().hex[:8],
            "title": "Fallback Form",
            "description": f"Generated from local DB for: {prompt}",
            "questions": questions,
            "metadata": {"generation_method": "fallback"}
        }

ai_agent = AIAgent()
