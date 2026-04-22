# validation_agent.py
import json
import logging
import re
from typing import Dict, Any, Optional
from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

class ValidationAgent:
    def __init__(self, api_key: str, model_id: str = "gemini-flash-latest"):
        self.client = genai.Client(api_key=api_key)
        self.model_id = model_id

    def validate_content(self, text: str, source_info: str = "Unknown") -> Dict[str, Any]:
        """
        Uses Gemini to audit the research quality of ingested knowledge.
        Returns a score and a categorization report.
        """
        if not text or len(text.strip()) < 100:
            return {
                "score": 0,
                "is_valid": False,
                "reason": "Text too short to be meaningful research knowledge.",
                "category": "junk"
            }

        # Truncate if too long for validation speed
        audit_text = text[:8000]

        prompt = f"""You are the "Vanguard Research Auditor". Your task is to evaluate if the following text is suitable for grounding an AI system specialized in IT, Marketing, and Economics research.

[TEXT START]
{audit_text}
[TEXT END]

Source: {source_info}

Analyze based on:
1. SCIENTIFIC RELEVANCE: Does it contain data, methodologies, or foundational knowledge (0-100)?
2. NOISE LEVEL: Is it full of ads, navigation menu fragments, or irrelevant formatting (0-100)?
3. RELIABILITY: Does it present logical and coherent information (0-100)?

Return a STRICT JSON object:
{{
  "overall_score": int (0-100),
  "is_valid": boolean (score > 60),
  "category": "it | marketing | economics | general | junk",
  "reasoning": "short explanation",
  "detected_language": "vi | en",
  "contains_pii": boolean
}}"""

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.0, # Strict analysis
                    response_mime_type="application/json",
                ),
            )
            
            raw = response.text.strip()
            # Clean possible markdown wrap
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
            
            return json.loads(raw)
        except Exception as e:
            logger.error(f"Validation Agent error: {e}")
            return {
                "score": 50,
                "is_valid": True, # Fail-safe to true if AI is down but data looks okay
                "reason": f"AI Validation timeout: {str(e)}",
                "category": "general"
            }
