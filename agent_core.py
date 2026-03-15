"""
agent_core.py
Phase 5+ – Agentic orchestration with tool-calling and short-term memory.

Exposes:
  - AnalystResponse   – Pydantic model for structured AML output
  - ConversationMemory – bounded short-term context window
  - call_llm()        – LLM gateway compatible with tool-calling APIs
  - Orchestrator      – iterative tool-calling workflow coordinator
  - AnalystAgent      – structured AML risk analysis with RAG-style context
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Callable

import httpx
from pydantic import BaseModel

from database import SessionLocal
from models import CompanyProfile
from vector_store import VectorStoreClient
from tools.company_fetcher import fetch_company_data
from tools.news_scraper import search_adverse_news
from tools.pep_checker import check_pep_associations
from tools.sanctions_checker import check_sanctions


OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_TIMEOUT_SECONDS = int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "45"))
ORCHESTRATOR_MODEL = os.getenv("ORCHESTRATOR_MODEL", "openai/gpt-4o-mini")
ANALYST_MODEL = os.getenv("ANALYST_MODEL", "openai/gpt-4o-mini")

# Default behaviour keeps local development deterministic unless explicitly enabled.
OPENROUTER_USE_REAL_LLM = os.getenv("OPENROUTER_USE_REAL_LLM", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
OPENROUTER_FALLBACK_TO_STUB = os.getenv("OPENROUTER_FALLBACK_TO_STUB", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}


class AnalystResponse(BaseModel):
    """Structured AML analysis result returned by the Analyst Agent."""

    company_name: str
    risk_score: int
    risk_level: str
    chain_of_thought: str
    recommended_action: str


class ConversationMemory:
    """Stores a bounded message history to keep the context window stable."""

    def __init__(self, max_messages: int = 12) -> None:
        self.max_messages = max_messages
        self.messages: list[dict[str, Any]] = []

    def add_user(self, content: str) -> None:
        self._append({"role": "user", "content": content})

    def add_assistant(
        self,
        content: str,
        tool_calls: list[dict[str, Any]] | None = None,
    ) -> None:
        message: dict[str, Any] = {"role": "assistant", "content": content}
        if tool_calls:
            message["tool_calls"] = tool_calls
        self._append(message)

    def add_tool(self, name: str, content: str, tool_call_id: str | None = None) -> None:
        message: dict[str, Any] = {
            "role": "tool",
            "name": name,
            "content": content,
        }
        if tool_call_id:
            message["tool_call_id"] = tool_call_id
        self._append(message)

    def build_messages(self, system_prompt: str | None = None) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        if system_prompt:
            output.append({"role": "system", "content": system_prompt})
        output.extend(self.messages)
        return output

    def latest_user_prompt(self) -> str | None:
        for msg in reversed(self.messages):
            if msg.get("role") == "user":
                return str(msg.get("content", ""))
        return None

    def _append(self, message: dict[str, Any]) -> None:
        self.messages.append(message)
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages :]


def call_llm(
    prompt: str | None = None,
    *,
    messages: list[dict[str, Any]] | None = None,
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | dict[str, Any] | None = None,
    model: str | None = None,
    require_json: bool = False,
) -> str | dict[str, Any]:
    """LLM gateway compatible with both direct prompt and tool-calling styles."""
    use_real_call = OPENROUTER_USE_REAL_LLM and bool(OPENROUTER_API_KEY)

    if use_real_call:
        try:
            return _call_openrouter_real(
                prompt=prompt,
                messages=messages,
                tools=tools,
                tool_choice=tool_choice,
                model=model,
                require_json=require_json,
            )
        except Exception:
            if not OPENROUTER_FALLBACK_TO_STUB:
                raise

    return _call_openrouter_stub(
        prompt=prompt,
        messages=messages,
        tools=tools,
        tool_choice=tool_choice,
    )


def _call_openrouter_real(
    prompt: str | None,
    messages: list[dict[str, Any]] | None,
    tools: list[dict[str, Any]] | None,
    tool_choice: str | dict[str, Any] | None,
    model: str | None,
    require_json: bool,
) -> str | dict[str, Any]:
    """Call OpenRouter chat completions using messages and optional tool-calling."""
    request_messages = messages or []
    if not request_messages and prompt is not None:
        request_messages = [{"role": "user", "content": prompt}]

    if not request_messages:
        request_messages = [{"role": "user", "content": ""}]

    chosen_model = model or ORCHESTRATOR_MODEL
    payload: dict[str, Any] = {
        "model": chosen_model,
        "messages": request_messages,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = tool_choice or "auto"
    elif require_json:
        payload["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=OPENROUTER_TIMEOUT_SECONDS) as client:
        response = client.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()

    data = response.json()
    message = data["choices"][0]["message"]
    content = message.get("content", "")

    if message.get("tool_calls"):
        return {
            "role": "assistant",
            "content": content or "",
            "tool_calls": message["tool_calls"],
        }

    return content or ""


def _call_openrouter_stub(
    prompt: str | None,
    messages: list[dict[str, Any]] | None,
    tools: list[dict[str, Any]] | None,
    tool_choice: str | dict[str, Any] | None,
) -> str | dict[str, Any]:
    """Deterministic local stub that mimics both tool-calling and JSON output."""
    if messages is not None and tools:
        _ = tool_choice  # Placeholder for API compatibility
        return _stub_tool_calling_response(messages)

    if prompt is None and messages:
        user_messages = [m for m in messages if m.get("role") == "user"]
        text = str(user_messages[-1].get("content", "")) if user_messages else ""
        return f"Mock response: {text}" if text else "Mock response"

    prompt_text = prompt or ""
    company_name = _extract_company_name(prompt_text) or "Unknown Company"
    name_hash = sum(ord(c) for c in company_name)
    risk_score = (name_hash % 60) + 10
    payload = {
        "company_name": company_name,
        "risk_score": risk_score,
        "risk_level": "HIGH" if risk_score > 50 else ("MEDIUM" if risk_score > 30 else "LOW"),
        "chain_of_thought": (
            f"Automated risk assessment for {company_name}. "
            "Analysis based on registry, sanctions, and adverse news mocks."
        ),
        "recommended_action": "Enhanced due-diligence" if risk_score > 50 else "Standard review",
    }
    return json.dumps(payload)


def _stub_tool_calling_response(messages: list[dict[str, Any]]) -> dict[str, Any]:
    user_prompt = ""
    used_tools: list[str] = []
    tool_payloads: dict[str, Any] = {}

    for message in messages:
        role = message.get("role")
        if role == "user":
            user_prompt = str(message.get("content", ""))
        elif role == "tool":
            name = str(message.get("name", ""))
            used_tools.append(name)
            raw_payload = str(message.get("content", "{}"))
            try:
                tool_payloads[name] = json.loads(raw_payload)
            except json.JSONDecodeError:
                tool_payloads[name] = {"raw": raw_payload}

    company_name = _extract_company_name(user_prompt)
    if not company_name:
        return {"role": "assistant", "content": "No company was detected. Please provide one."}

    if "fetch_company_data" not in used_tools:
        return {
            "role": "assistant",
            "content": "Fetching company profile before risk scoring.",
            "tool_calls": [
                {
                    "id": "tool-call-fetch-1",
                    "type": "function",
                    "function": {
                        "name": "fetch_company_data",
                        "arguments": json.dumps({"company_name": company_name}),
                    },
                }
            ],
        }

    if "check_sanctions" not in used_tools:
        return {
            "role": "assistant",
            "content": "Running sanctions screening.",
            "tool_calls": [
                {
                    "id": "tool-call-sanctions-1",
                    "type": "function",
                    "function": {
                        "name": "check_sanctions",
                        "arguments": json.dumps({"entity_name": company_name}),
                    },
                }
            ],
        }

    if "search_adverse_news" not in used_tools:
        return {
            "role": "assistant",
            "content": "Searching adverse media signals.",
            "tool_calls": [
                {
                    "id": "tool-call-news-1",
                    "type": "function",
                    "function": {
                        "name": "search_adverse_news",
                        "arguments": json.dumps({"entity_name": company_name}),
                    },
                }
            ],
        }

    if "check_pep_associations" not in used_tools:
        return {
            "role": "assistant",
            "content": "Checking politically exposed person links.",
            "tool_calls": [
                {
                    "id": "tool-call-pep-1",
                    "type": "function",
                    "function": {
                        "name": "check_pep_associations",
                        "arguments": json.dumps({"entity_name": company_name}),
                    },
                }
            ],
        }

    sanctions_hits = tool_payloads.get("check_sanctions", {}).get("hits", [])
    adverse_news = tool_payloads.get("search_adverse_news", {}).get("articles", [])
    pep_matches = tool_payloads.get("check_pep_associations", {}).get("matches", [])
    return {
        "role": "assistant",
        "content": (
            f"Completed triage for {company_name}. "
            f"Sanctions hits: {len(sanctions_hits)}, "
            f"adverse news: {len(adverse_news)}, PEP matches: {len(pep_matches)}."
        ),
    }


def _extract_company_name(text: str) -> str | None:
    patterns = [
        r"[Aa]nalys[ei]s?\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Za-z0-9 &.,'-]+){0,4}?)\s+for\b",
        r"(?:check|lookup|screen|investigate|fetch|analyse|analyze)\s+([A-Z][A-Za-z0-9 &.,'-]+(?:\s+[A-Z][A-Za-z0-9 &.,'-]*){0,4})",
        r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return None


class Orchestrator:
    """Routes prompts through an iterative tool-calling loop."""

    _SYSTEM_PROMPT = (
        "You are an AML orchestration agent. Use tools when needed in this order: "
        "fetch company profile, sanctions, adverse news, then PEP checks. "
        "Do not fabricate tool outputs."
    )

    def __init__(
        self,
        memory: ConversationMemory | None = None,
        max_tool_iterations: int = 6,
    ) -> None:
        self.memory = memory or ConversationMemory()
        self.max_tool_iterations = max_tool_iterations
        self._tool_registry: dict[str, Callable[..., dict[str, Any]]] = {
            "fetch_company_data": fetch_company_data,
            "check_sanctions": check_sanctions,
            "search_adverse_news": search_adverse_news,
            "check_pep_associations": check_pep_associations,
        }
        self._tool_definitions = [
            {
                "type": "function",
                "function": {
                    "name": "fetch_company_data",
                    "description": "Fetch base company registry details.",
                    "parameters": {
                        "type": "object",
                        "properties": {"company_name": {"type": "string"}},
                        "required": ["company_name"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "check_sanctions",
                    "description": "Screen the entity against sanctions lists.",
                    "parameters": {
                        "type": "object",
                        "properties": {"entity_name": {"type": "string"}},
                        "required": ["entity_name"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_adverse_news",
                    "description": "Retrieve adverse media references for an entity.",
                    "parameters": {
                        "type": "object",
                        "properties": {"entity_name": {"type": "string"}},
                        "required": ["entity_name"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "check_pep_associations",
                    "description": "Check for politically exposed person links.",
                    "parameters": {
                        "type": "object",
                        "properties": {"entity_name": {"type": "string"}},
                        "required": ["entity_name"],
                    },
                },
            },
        ]

    def run(self, prompt: str) -> dict[str, Any]:
        """Process a user prompt, execute tool calls, and return AML output."""
        self.memory.add_user(prompt)

        company_data: dict[str, Any] | None = None
        tool_trace: list[dict[str, Any]] = []
        tool_evidence: dict[str, Any] = {}
        final_message = ""

        for _ in range(self.max_tool_iterations):
            llm_output = call_llm(
                messages=self.memory.build_messages(system_prompt=self._SYSTEM_PROMPT),
                tools=self._tool_definitions,
                tool_choice="auto",
                model=ORCHESTRATOR_MODEL,
            )
            assistant_message = self._normalise_assistant_message(llm_output)
            final_message = str(assistant_message.get("content", ""))
            tool_calls = assistant_message.get("tool_calls", [])
            self.memory.add_assistant(final_message, tool_calls=tool_calls)

            if not tool_calls:
                break

            for tool_call in tool_calls:
                executed = self._execute_tool_call(tool_call)
                tool_trace.append(executed)
                tool_evidence[executed["tool_name"]] = executed["result"]
                if executed["tool_name"] == "fetch_company_data" and "error" not in executed["result"]:
                    company_data = executed["result"]

                self.memory.add_tool(
                    name=executed["tool_name"],
                    content=json.dumps(executed["result"]),
                    tool_call_id=executed.get("id"),
                )

        if company_data:
            analyst = AnalystAgent(
                memory=self.memory,
                allow_fallback_on_invalid_json=True,
            )
            analysis = analyst.analyse(company_data, tool_evidence=tool_evidence)
            self._save_to_db(analysis, company_data)
            return {
                "company_data": company_data,
                "analysis": analysis.model_dump(),
                "tool_evidence": tool_evidence,
                "tool_trace": tool_trace,
                "orchestrator_message": final_message,
            }

        return {"message": final_message or "No actionable company data detected.", "tool_trace": tool_trace}

    def _normalise_assistant_message(self, llm_output: str | dict[str, Any]) -> dict[str, Any]:
        if isinstance(llm_output, dict):
            return llm_output
        return {"role": "assistant", "content": str(llm_output)}

    def _execute_tool_call(self, tool_call: dict[str, Any]) -> dict[str, Any]:
        function_block = tool_call.get("function", {})
        tool_name = str(function_block.get("name", ""))
        raw_arguments = function_block.get("arguments", "{}")

        if isinstance(raw_arguments, str):
            try:
                arguments = json.loads(raw_arguments)
            except json.JSONDecodeError:
                arguments = {}
        elif isinstance(raw_arguments, dict):
            arguments = raw_arguments
        else:
            arguments = {}

        if tool_name not in self._tool_registry:
            result: dict[str, Any] = {"error": f"Unknown tool: {tool_name}"}
        else:
            try:
                result = self._tool_registry[tool_name](**arguments)
            except Exception as exc:
                result = {"error": str(exc)}

        return {
            "id": str(tool_call.get("id", "")),
            "tool_name": tool_name,
            "arguments": arguments,
            "result": result,
        }

    def _save_to_db(self, analysis: AnalystResponse, company_data: dict[str, Any]) -> None:
        db = SessionLocal()
        try:
            profile = CompanyProfile(
                company_name=analysis.company_name,
                registration_number=company_data.get("registration_number"),
                country=company_data.get("country"),
                risk_score=analysis.risk_score / 100.0,
                risk_label=analysis.risk_level,
                risk_explanation=analysis.chain_of_thought,
                status=company_data.get("status"),
                address=company_data.get("address"),
            )
            db.add(profile)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


class AnalystAgent:
    """Runs AML analysis and validates structured output with Pydantic."""

    _SYSTEM_PROMPT_TEMPLATE = (
        "You are an AML (Anti-Money Laundering) risk analyst. "
        "Return strict JSON with keys: company_name, risk_score, risk_level, "
        "chain_of_thought, recommended_action.\n\n"
        "Company data:\n{company_data}\n\n"
        "Additional context:\n{context}"
    )

    def __init__(
        self,
        memory: ConversationMemory | None = None,
        vector_client: VectorStoreClient | None = None,
        allow_fallback_on_invalid_json: bool = False,
    ) -> None:
        self.memory = memory
        self.vector_client = vector_client or VectorStoreClient()
        self.allow_fallback_on_invalid_json = allow_fallback_on_invalid_json

    def analyse(
        self,
        company_data: dict[str, Any],
        tool_evidence: dict[str, Any] | None = None,
    ) -> AnalystResponse:
        context = self._build_context(company_data, tool_evidence=tool_evidence)
        prompt = self._SYSTEM_PROMPT_TEMPLATE.format(
            company_data=json.dumps(company_data, ensure_ascii=False, indent=2),
            context=context,
        )

        raw = call_llm(
            prompt=prompt,
            model=ANALYST_MODEL,
            require_json=True,
        )
        raw_text = raw.get("content", "") if isinstance(raw, dict) else str(raw)

        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            if self.allow_fallback_on_invalid_json:
                return self._fallback_decision(company_data, tool_evidence)
            raise ValueError(f"LLM returned non-JSON content. Raw response: {raw_text!r}") from exc

        return AnalystResponse(**payload)

    def _build_context(
        self,
        company_data: dict[str, Any],
        tool_evidence: dict[str, Any] | None = None,
    ) -> str:
        chunks: list[str] = []

        company_name = company_data.get("name") or company_data.get("company_name")
        if company_name:
            chunks.append(f"Target company: {company_name}")

        if self.memory:
            latest_prompt = self.memory.latest_user_prompt()
            if latest_prompt:
                chunks.append(f"Latest user request: {latest_prompt}")

            evidence_from_memory = self._collect_tool_evidence_from_memory()
            if evidence_from_memory:
                chunks.append(
                    "Recent tool evidence:\n"
                    + json.dumps(evidence_from_memory, ensure_ascii=False, indent=2)
                )

        if tool_evidence:
            chunks.append(
                "Tool evidence passed by orchestrator:\n"
                + json.dumps(tool_evidence, ensure_ascii=False, indent=2)
            )

            risk_prior = self._risk_prior_from_evidence(tool_evidence)
            chunks.append(
                "Decision prior from evidence: "
                f"score={risk_prior['risk_score']}, level={risk_prior['risk_level']}, "
                f"action={risk_prior['recommended_action']}"
            )

        try:
            results = self.vector_client.search(
                collection="company_embeddings",
                query_vector=[0.0] * 128,
                top_k=2,
            )
            if results:
                formatted_results: list[str] = []
                for res in results:
                    payload = res.get("payload", {})
                    formatted_results.append(
                        f"{payload.get('company_name', 'unknown')} "
                        f"(risk={payload.get('risk_score', 'n/a')})"
                    )
                chunks.append("Historical context: " + "; ".join(formatted_results))
        except Exception:
            chunks.append("Historical context: unavailable")

        return "\n".join(chunks) if chunks else "No additional context available."

    def _collect_tool_evidence_from_memory(self) -> dict[str, Any]:
        if not self.memory:
            return {}

        evidence: dict[str, Any] = {}
        for message in self.memory.messages:
            if message.get("role") != "tool":
                continue

            tool_name = str(message.get("name", ""))
            content = str(message.get("content", "{}"))
            if not tool_name:
                continue

            try:
                evidence[tool_name] = json.loads(content)
            except json.JSONDecodeError:
                evidence[tool_name] = {"raw": content}
        return evidence

    def _risk_prior_from_evidence(self, tool_evidence: dict[str, Any]) -> dict[str, Any]:
        sanctions_hits = len(tool_evidence.get("check_sanctions", {}).get("hits", []))
        adverse_articles = len(tool_evidence.get("search_adverse_news", {}).get("articles", []))
        pep_matches = len(tool_evidence.get("check_pep_associations", {}).get("matches", []))

        risk_score = min(100, 15 + sanctions_hits * 45 + pep_matches * 25 + adverse_articles * 10)
        if risk_score >= 80:
            risk_level = "CRITICAL"
            action = "Reject"
        elif risk_score >= 60:
            risk_level = "HIGH"
            action = "Enhanced due-diligence"
        elif risk_score >= 35:
            risk_level = "MEDIUM"
            action = "Standard review"
        else:
            risk_level = "LOW"
            action = "Approve"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommended_action": action,
            "signals": {
                "sanctions_hits": sanctions_hits,
                "adverse_articles": adverse_articles,
                "pep_matches": pep_matches,
            },
        }

    def _fallback_decision(
        self,
        company_data: dict[str, Any],
        tool_evidence: dict[str, Any] | None,
    ) -> AnalystResponse:
        evidence = tool_evidence or self._collect_tool_evidence_from_memory()
        prior = self._risk_prior_from_evidence(evidence)

        company_name = (
            company_data.get("name")
            or company_data.get("company_name")
            or "Unknown Company"
        )

        return AnalystResponse(
            company_name=company_name,
            risk_score=int(prior["risk_score"]),
            risk_level=str(prior["risk_level"]),
            chain_of_thought=(
                "LLM JSON was unavailable; using deterministic fallback based on tool evidence. "
                f"Signals: {json.dumps(prior['signals'])}"
            ),
            recommended_action=str(prior["recommended_action"]),
        )
