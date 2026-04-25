import json
import logging
import re
import uuid
from typing import Dict, Any, List

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import config

logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        self.model_name = config.GEMINI_MODEL
        self.ready = False
        self.model = None

        if self.api_key and self.api_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
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
            logger.error("!!! AIAgent ERROR: Gemini client not initialized !!!")
            raise Exception("Gemini client not initialized")
            
        logger.info(f"--- Calling Gemini API [{self.model_name}] ---")
        try:
            response = self.model.generate_content(
                contents=prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=4096,
                    response_mime_type=mime_type,
                ),
            )
            logger.info("--- Gemini Response: OK ---")
            return response.text.strip()
        except Exception as e:
            logger.error(f"!!! Gemini API Request Failed: {str(e)} !!!")
            raise e

    def analyze_intent(self, user_prompt: str, expected_intent: str = "survey", context_hint: str = None) -> Dict[str, Any]:
        """Analyzes user intent with optional workspace context."""
        if not self.ready:
            return {"intent": expected_intent, "keywords": user_prompt, "category": "general"}
            
        hint_clause = f"\nWORKSPACE CONTEXT (Known documents): {context_hint}" if context_hint else ""
        
        prompt = f"""Analyze this user prompt for a form generation task: "{user_prompt}"
CONTEXT: Expected type: {expected_intent}.{hint_clause}
        
Return a STRICT JSON object:
{{
  "intent": "survey | registration | assessment | application | custom",
  "keywords": "3-5 optimized search terms separated by commas. If the prompt is vague, use the WORKSPACE CONTEXT to find the most relevant subjects.",
  "category": "it | economics | marketing | general"
}}"""
        try:
            raw = self.call_gemini(prompt)
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
            return json.loads(raw)
        except Exception:
            return {"intent": expected_intent, "keywords": user_prompt, "category": "general"}

    def validate_and_classify(self, text_sample: str) -> Dict[str, Any]:
        """AI Gatekeeper: Determines if data is valid and which industry it belongs to."""
        if not self.ready:
            return {"category": "general", "quality_score": 5, "is_valid": True}

        prompt = f"""You are a Content Auditor. Analyze the following text snippet:
---
{text_sample[:2000]}
---
Determine:
1. Industry Category: Must be one of [it, marketing, economics, general].
2. Quality Score: 1-10 based on depth and clarity.
3. Validity: Is this educational/informational? Or is it junk/malicious?

Return STRICT JSON:
{{
  "category": "it | marketing | economics | general",
  "quality_score": number,
  "is_valid": boolean,
  "reason": "short explanation"
}}"""
        try:
            raw = self.call_gemini(prompt)
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
            return json.loads(raw)
        except Exception:
            return {"category": "general", "quality_score": 5, "is_valid": True, "reason": "Error during audit"}

    def generate_form(self, user_prompt: str, context_results: List[Dict], intent_info: Dict, num_q: int, workspace_id: str = None, fine_tune_note: str = None, language: str = "en", context_hint: str = None) -> Dict[str, Any]:
        """Synthesizes a complete form using RAG results and intent analysis."""
        logger.info(f"--- [AI_AGENT] Generating Form: {user_prompt[:50]}... ---")
        
        # Filter and sanitize context
        grounding_context = [
            {"text": r["question"], "source": r["source"], "category": r.get("category", "general")} 
            for r in context_results if r.get("similarity_score", 0) > 0.35
        ]
        
        is_private = workspace_id is not None
        
        # Layer 2: Form Architecture Instructions (STRICT ROLE PLAYING)
        form_type = intent_info.get('intent', 'survey')
        arch_rules = {
            "survey": """[ROLE: RESEARCH SCIENTIST]
- Focus: Measuring opinions, behaviors, and satisfaction.
- Style: Use Likert scales (1-5), rating scales, and open-ended feedback.
- Goal: Generate insights about the target audience's perception of the topic.""",
            
            "assessment": """[ROLE: ACADEMIC EXAMINER / NOTEBOOK_LM STYLE]
- Focus: Knowledge retention, definitions, and technical accuracy.
- Style: Multiple choice with 1 correct answer, True/False, and 'Explain the concept' questions.
- Goal: Test if the user has read and understood the specific facts, dates, and names in the document. 
- NOTE: Be pedantic and thorough about the details.""",
            
            "registration": """[ROLE: DATA ADMINISTRATOR]
- Focus: Onboarding and identification.
- Style: Short text, email validation, phone numbers, and preference checkboxes.
- Goal: Capture structured user data for a system or event.""",
            
            "application": """[ROLE: HR/ADMISSIONS EXPERT]
- Focus: Qualification and screening.
- Style: Long-form motivation questions, experience verification, and 'Yes/No' eligibility criteria.
- Goal: Filter candidates based on their suitability for a specific role/program.""",
            
            "custom": "Follow the user's instructions and tone strictly above all else."
        }
        arch_clause = arch_rules.get(form_type, arch_rules["survey"])
        
        # Hard Override for common requests
        if fine_tune_note:
            ft_lower = fine_tune_note.lower()
            if "multiple choice" in ft_lower or "single choice" in ft_lower or "trắc nghiệm" in ft_lower:
                arch_clause += "\n[STRICT OVERRIDE]: Use ONLY 'multiple_choice' or 'single_choice' types. Each question MUST have exactly 4 distinct options."
            elif "likert" in ft_lower:
                arch_clause += "\n[STRICT OVERRIDE]: Use ONLY 'likert_scale' type for all items."

        # Layer 1: Grounding Instructions (CONTEXT DIFFERENTIATION)
        global_summary = ""
        if workspace_id:
            from chroma_client import chroma_wrapper
            global_summary = chroma_wrapper.get_workspace_summary(workspace_id)

        if workspace_id and is_private:
            logger.info(f"[AI_AGENT] Mode: PRIVATE_NOTEBOOK_GROUNDING (Workspace: {workspace_id})")
            summary_clause = f"\nWORKSPACE KNOWLEDGE MAP (Deep Summary):\n{global_summary}\n" if global_summary else ""
            grounding_clause = f"""[STRICT NOTEBOOK GROUNDING - DEEP DIVE MODE]
{summary_clause}
- SOURCE: User's Private Notebook ({workspace_id}).
- RULE: You are a specialist in THIS SPECIFIC document. 
- MANDATE: Use specific names, dates, and unique terms found in the provided context. 
- IGNORE global generic knowledge if it conflicts with or dilutes the specific details of this document."""
        else:
            logger.info("[AI_AGENT] Mode: GLOBAL_HYBRID_GROUNDING")
            grounding_clause = """[GLOBAL HYBRID GROUNDING - TEMPLATE MODE]
- SOURCE: Global Question Bank & General Knowledge.
- RULE: You are a Professional Consultant.
- MANDATE: Create a high-fidelity, industry-standard form. 
- BLEND the provided context chunks with global best practices to ensure the form is comprehensive and professional."""

        # Layer 3: Fine-Tuning Instructions
        fine_tune_clause = f"\n[USER OVERRIDING CONSTRAINT]: {fine_tune_note}\n- This is a MANDATORY constraint from the user. It overrides any default behavior." if fine_tune_note else ""

        # Calculate average fidelity for metadata
        avg_fidelity = sum([r.get("similarity_score", 0) for r in context_results]) / len(context_results) if context_results else 0.5

        # Final Assembly
        prompt = f"""You are an Expert AI Form Architect.
Target Language: {language.upper()}

[1] RESEARCH OBJECTIVE:
"{user_prompt}"
- Form Type: {form_type.upper()}
- Domain: {intent_info.get('category', 'general').upper()}

[2] KNOWLEDGE CONTEXT (RAG):
{grounding_clause}
{json.dumps(grounding_context, indent=2) if grounding_context else 'NO CONTEXT FOUND. USE EXPERT PARAMETRIC KNOWLEDGE.'}

[3] EXECUTION RULES:
- Generate exactly {num_q} items.
- PRIMARY INSTRUCTION: {arch_clause}
- CRITICAL: The 'question' field must contain the full question text. Do NOT split the question into words in the 'options' field.
- CRITICAL: The 'options' field must contain actual choices (e.g., Strongly Agree, Agree) or be an empty array [] for text questions.
{fine_tune_clause}
- RETURN STRICT JSON ONLY.

[4] JSON OUTPUT SCHEMA (NodeJS Compatible):
{{
  "title": "Generated Form Title",
  "description": "Analysis-driven description",
  "questions": [
    {{
      "question": "Question text here?",
      "type": "multiple_choice | single_choice | likert_scale | rating | text | quiz",
      "options": ["Option A", "Option B"],
      "confidence": 0.95,
      "category": "{intent_info.get('category', 'general')}",
      "grounded": true,
      "required": true
    }}
  ],
  "metadata": {{
    "expected_insights": "Analysis of what this measures",
    "avg_fidelity": {round(avg_fidelity, 3)},
    "is_notebook_mode": {"true" if workspace_id else "false"}
  }}
}}"""

        if not self.ready:
            return self._build_fallback(user_prompt, context_results, num_q)

        try:
            raw = self.call_gemini(prompt)
            logger.info(f"--- [AI_AGENT] Raw Gemini Response (First 200 chars): {raw[:200]}... ---")
            raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
            raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
            result = json.loads(raw)
            logger.info(f"--- [AI_AGENT] Form Successfully Synthesized: {result.get('title', 'Untitled')} ---")
            return result
        except Exception as e:
            logger.error(f"!!! [AI_AGENT] Gemini Synthesis Failed: {str(e)} !!!")
            if 'raw' in locals():
                logger.error(f"!!! [AI_AGENT] Failed Raw Content: {raw[:500]} !!!")
            return self._build_fallback(user_prompt, context_results, num_q)

    def _build_fallback(self, prompt: str, results: List[Dict], num_q: int) -> Dict[str, Any]:
        """Fallback to direct ChromaDB items."""
        questions = []
        for i, r in enumerate(results[:num_q]):
            questions.append({
                "question": r["question"],
                "type": "text",
                "options": [],
                "confidence": r.get("similarity_score", 0.5),
                "category": r.get("category", "general"),
                "grounded": True,
                "required": True
            })
            
        return {
            "title": f"Draft Form for {prompt}",
            "description": "Automated fallback draft",
            "questions": questions,
            "metadata": {"fallback": True}
        }

    def generate_workspace_summary(self, chunks: List[str], workspace_id: str) -> str:
        """Creates a high-level knowledge map of the workspace."""
        if not chunks: return ""
        
        # Take a representative sample of chunks if there are too many
        sample_size = min(20, len(chunks))
        text_sample = "\n---\n".join(chunks[:sample_size])
        
        prompt = f"""You are a Knowledge Architect. Analyze these excerpts from Workspace {workspace_id}:
---
{text_sample}
---
Task: Create a concise Knowledge Map (max 200 words).
Include:
1. Main Theme/Subject.
2. Key Entities (Names, Products, Concepts).
3. Primary Purpose of the documents.
4. Specific Terminology to maintain consistency."""

        try:
            summary = self.call_gemini(prompt)
            return summary.strip()
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return ""

ai_agent = AIAgent()
