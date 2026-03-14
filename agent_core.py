"""
agent_core.py
Phase 5 – AI Agent Orchestration (LLM Routing)

Exposes:
  - AnalystResponse   – Pydantic model for the structured AML output
  - call_llm()        – thin wrapper around the OpenRouter API (mocked for now)
  - Orchestrator      – routes a user prompt, triggers tool calls when appropriate
  - AnalystAgent      – calls the LLM and parses its JSON output into AnalystResponse

NOTE (Phase 5 / Sprint 1):
    The real OpenRouter HTTP call in call_llm() is intentionally stubbed with a
    deterministic dummy response so the test suite can reach GREEN before live
    API credentials are provisioned.  Replace _call_openrouter_real() when keys
    are available.
"""

from __future__ import annotations

import json
import re
from typing import Any

from pydantic import BaseModel, ValidationError

from database import SessionLocal
from models import CompanyProfile
from vector_store import VectorStoreClient
from tools.company_fetcher import fetch_company_data  # noqa: F401 (re-exported for patching)


# ---------------------------------------------------------------------------
# Pydantic schema – the single source of truth for the Analyst's output
# ---------------------------------------------------------------------------

class AnalystResponse(BaseModel):
    """Structured AML analysis result returned by the Analyst Agent."""

    company_name: str
    risk_score: int          # 0 – 100
    risk_level: str          # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    chain_of_thought: str    # step-by-step reasoning produced by the LLM
    recommended_action: str  # e.g. "Approve", "Enhanced due-diligence", "Reject"


# ---------------------------------------------------------------------------
# LLM gateway – swap the body of _call_openrouter_real() for production use
# ---------------------------------------------------------------------------

def call_llm(prompt: str) -> str:
    """Send *prompt* to the configured LLM and return its raw text response.

    Current implementation: returns a deterministic stub so the test suite
    can run without live credentials.  Replace with a real HTTP call when
    OpenRouter keys are available.
    """
    return _call_openrouter_stub(prompt)


def _call_openrouter_stub(prompt: str) -> str:
    """Deterministic mock – always returns a minimal valid AnalystResponse JSON."""
    # Extract a company name from the prompt heuristically for a realistic stub.
    company_match = re.search(r"company(?:\s*name)?[:\s]+([A-Za-z0-9 &.,'-]+)", prompt, re.I)
    company_name = company_match.group(1).strip() if company_match else "Unknown Company"

    payload = {
        "company_name": company_name,
        "risk_score": 20,
        "risk_level": "LOW",
        "chain_of_thought": (
            "No sanctions hits detected. "
            "Directors have no adverse media. "
            "Registration appears valid."
        ),
        "recommended_action": "Standard due-diligence review.",
    }
    return json.dumps(payload)


def _call_openrouter_real(prompt: str, model: str = "openai/gpt-4o-mini") -> str:  # pragma: no cover
    """Production implementation (not called in tests).

    Requires OPENROUTER_API_KEY environment variable.
    """
    import os
    import httpx  # already in requirements.txt

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise EnvironmentError("OPENROUTER_API_KEY is not set.")

    response = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


# ---------------------------------------------------------------------------
# Orchestrator – routes prompt, calls tools, coordinates sub-agents
# ---------------------------------------------------------------------------

# Simple heuristic patterns that signal "this prompt is about a company"
_COMPANY_TRIGGER_PATTERNS = [
    r"\b(analyz|check|lookup|investigate|screen|fetch)\b.{0,60}\b([A-Z][A-Za-z0-9 &.,'-]{2,})\b",
    r"\b([A-Z][A-Za-z0-9 &.,'-]{2,})\b.{0,60}\b(AML|risk|sanctions|due.diligence)\b",
    r"\bPlease\s+analys[ei]\b.+?([A-Z][A-Za-z0-9 &.,'-]{2,})\b",
]

_COMPANY_NAME_PATTERNS = [
    # "analyse Acme Corp for …"
    r"[Aa]nalys[ei]s?\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Za-z0-9 &.,'-]+){0,4}?)\s+for\b",
    # "check Acme Corp"
    r"(?:check|lookup|screen|investigate|fetch)\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Z][A-Za-z0-9 &.,'-]*){0,3})",
    # Generic: two+ title-cased words in a row
    r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b",
]


class Orchestrator:
    """Top-level agent router.

    Decides whether a user prompt requires external tool calls (e.g.
    fetch_company_data) before handing off to specialised sub-agents.
    """

    def run(self, prompt: str) -> dict[str, Any]:
        """Process *prompt* and return a result dict.

        Side-effects:
            - Calls ``fetch_company_data`` when a company name is detected.
        """
        company_name = self._extract_company_name(prompt)

        if company_name:
            company_data = fetch_company_data(company_name)
            analyst = AnalystAgent()
            analysis = analyst.analyse(company_data)
            
            # Phase 8: Database Persistence
            self._save_to_db(analysis, company_data)
            
            return {
                "company_data": company_data,
                "analysis": analysis.model_dump(),
            }

        # Generic prompt – no tool calls needed
        return {"message": call_llm(prompt)}

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _is_company_prompt(self, prompt: str) -> bool:
        """Return True if the prompt appears to reference a specific company."""
        for pattern in _COMPANY_TRIGGER_PATTERNS:
            if re.search(pattern, prompt):
                return True
        return False

    def _extract_company_name(self, prompt: str) -> str | None:
        """Best-effort extraction of a company name from *prompt*.

        Returns ``None`` when no company name can be identified, which
        prevents spurious tool calls for generic prompts.
        """
        for pattern in _COMPANY_NAME_PATTERNS:
            match = re.search(pattern, prompt)
            if match:
                return match.group(1).strip()
        return None

    def _save_to_db(self, analysis: AnalystResponse, company_data: dict[str, Any]) -> None:
        """Persist the analysis results to the PostgreSQL database."""
        db = SessionLocal()
        try:
            profile = CompanyProfile(
                company_name=analysis.company_name,
                registration_number=company_data.get("registration_number"),
                country=company_data.get("country"),
                risk_score=analysis.risk_score / 100.0,  # Convert to 0.0 - 1.0 range
                risk_label=analysis.risk_level,
                risk_explanation=analysis.chain_of_thought,
                status=company_data.get("status"),
                address=company_data.get("address"),
            )
            db.add(profile)
            db.commit()
        except Exception:
            db.rollback()
            # In a production system, we would log this error.
        finally:
            db.close()


# ---------------------------------------------------------------------------
# AnalystAgent – calls the LLM and parses its output into AnalystResponse
# ---------------------------------------------------------------------------

class AnalystAgent:
    """Runs the AML analysis LLM prompt and validates the structured output."""

    _SYSTEM_PROMPT_TEMPLATE = (
        "You are an AML (Anti-Money Laundering) risk analyst. "
        "You will be given structured company data and must return a JSON object "
        "with these exact keys: company_name, risk_score (0-100 int), risk_level "
        "(LOW|MEDIUM|HIGH|CRITICAL), chain_of_thought (str), recommended_action (str). "
        "Return ONLY the JSON object, no markdown fences.\n\n"
        "Company data:\n{company_data}"
    )

    def analyse(self, company_data: dict[str, Any]) -> AnalystResponse:
        """Analyse *company_data* via the LLM and return a validated AnalystResponse.

        Raises:
            ValueError: If the LLM response is not valid JSON.
            pydantic.ValidationError: If required fields are missing or have wrong types.
        """
        # Phase 8: RAG Injection
        vector_client = VectorStoreClient()
        # In a real system, we'd generate an embedding for the company name or profile
        # For the prototype, we use a dummy zero-vector if needed, or just search by name
        # if the vector store supported it. Here we simulate the RAG step.
        historical_context = ""
        try:
            # Attempt a search (using a dummy vector for the prototype)
            results = vector_client.search(
                collection="company_embeddings",
                query_vector=[0.0] * 128,  # Mock vector size
                top_k=2
            )
            if results:
                historical_context = "\nHistorical context from previous investigations:\n"
                for res in results:
                    p = res.get("payload", {})
                    historical_context += f"- {p.get('company_name')}: Risk {p.get('risk_score')}\n"
        except Exception:
            pass # Fail gracefully if vector store is unavailable

        prompt = self._SYSTEM_PROMPT_TEMPLATE.format(
            company_data=json.dumps(company_data, ensure_ascii=False, indent=2)
        )
        if historical_context:
            prompt += historical_context
            
        raw: str = call_llm(prompt)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"LLM returned non-JSON content. Raw response: {raw!r}"
            ) from exc

        # Pydantic validation – raises ValidationError on schema mismatch
        return AnalystResponse(**data)
