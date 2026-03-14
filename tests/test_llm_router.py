"""
Phase 5 – AI Agent Orchestration (LLM Routing)
QA / Test Engineer – Sub-agent 1

These tests are intentionally written BEFORE the implementation exists (RED phase).
They will fail with ImportError until Sub-agent 2 (Developer) creates agent_core.py.

TDD Cycle:
  1. Tests written here  → RED  (no implementation yet)
  2. Developer creates agent_core.py  → GREEN
  3. Tests pass, Git action requested.
"""

import json
import pytest
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Import the modules under test.
# ImportError is the expected failure mode at this stage (RED).
# ---------------------------------------------------------------------------
from agent_core import Orchestrator          # noqa: E402  (does not exist yet)
from agent_core import AnalystAgent          # noqa: E402  (does not exist yet)
from agent_core import AnalystResponse       # noqa: E402  (Pydantic model, does not exist yet)


# ===========================================================================
# Test 1 – Orchestrator Tool-Calling
# ===========================================================================

class TestOrchestratorToolCalling:
    """
    Verify that the Orchestrator correctly dispatches a prompt that requires
    company data to the fetch_company_data utility (Tool Calling).

    The LLM call itself is mocked so the test runs offline and deterministically.
    The test asserts that fetch_company_data was actually *invoked* with the
    company name extracted from the prompt, proving the router wired the tool.
    """

    PROMPT = "Please analyse Acme Corp for AML risk."
    EXPECTED_COMPANY = "Acme Corp"

    def test_orchestrator_calls_fetch_company_data_for_company_prompt(self):
        """
        Given a prompt mentioning a company name, the Orchestrator must invoke
        tools.company_fetcher.fetch_company_data at least once with that name.
        """
        # Patch fetch_company_data at the location the Orchestrator imports it.
        with patch(
            "agent_core.fetch_company_data",
            return_value={
                "name": self.EXPECTED_COMPANY,
                "status": "active",
                "directors": ["Jane Doe"],
                "registration_number": "RO00000001",
                "country": "RO",
                "address": "Str. Test nr. 1, București",
                "sanctions_hits": [],
            },
        ) as mock_fetch:
            orchestrator = Orchestrator()
            orchestrator.run(self.PROMPT)

        mock_fetch.assert_called_once(), (
            "Orchestrator.run() must call fetch_company_data() exactly once "
            "when the prompt contains a recognisable company name."
        )

    def test_orchestrator_passes_company_name_to_fetch(self):
        """
        The argument passed to fetch_company_data must match the company name
        present in the prompt.
        """
        with patch(
            "agent_core.fetch_company_data",
            return_value={
                "name": self.EXPECTED_COMPANY,
                "status": "active",
                "directors": [],
                "registration_number": "RO00000002",
                "country": "RO",
                "address": "Str. Demo nr. 2, Cluj",
                "sanctions_hits": [],
            },
        ) as mock_fetch:
            orchestrator = Orchestrator()
            orchestrator.run(self.PROMPT)

        call_args = mock_fetch.call_args
        assert call_args is not None, "fetch_company_data was never called."
        positional_or_keyword = (
            call_args.args[0] if call_args.args else call_args.kwargs.get("company_name")
        )
        assert positional_or_keyword == self.EXPECTED_COMPANY, (
            f"Expected fetch_company_data to be called with {self.EXPECTED_COMPANY!r}, "
            f"but got {positional_or_keyword!r}."
        )

    def test_orchestrator_does_not_call_fetch_for_generic_prompt(self):
        """
        A generic prompt that does NOT mention a company should NOT trigger
        fetch_company_data (guard against over-eager tool calling).
        """
        with patch("agent_core.fetch_company_data") as mock_fetch:
            orchestrator = Orchestrator()
            orchestrator.run("What is the weather today?")

        mock_fetch.assert_not_called(), (
            "Orchestrator should NOT call fetch_company_data for prompts "
            "that do not reference a company."
        )


# ===========================================================================
# Test 2 – AnalystAgent Pydantic-Defined JSON Output
# ===========================================================================

class TestAnalystAgentJsonOutput:
    """
    Verify that AnalystAgent always returns a response that conforms to the
    AnalystResponse Pydantic model, regardless of what the underlying LLM
    actually returns.

    The LLM is mocked to return a valid JSON string; the test confirms that
    AnalystAgent parses and validates this into an AnalystResponse instance.
    """

    # Minimal valid JSON the mocked LLM will return.
    MOCK_LLM_JSON = json.dumps({
        "company_name": "Acme Corp",
        "risk_score": 42,
        "risk_level": "MEDIUM",
        "chain_of_thought": "No sanctions hits found. Directors appear clean.",
        "recommended_action": "Standard due-diligence review.",
    })

    COMPANY_DATA = {
        "name": "Acme Corp",
        "status": "active",
        "directors": ["Jane Doe"],
        "registration_number": "RO00000003",
        "country": "RO",
        "address": "Str. QA nr. 3, Iași",
        "sanctions_hits": [],
    }

    def test_analyst_returns_pydantic_model_instance(self):
        """
        AnalystAgent.analyse() must return an AnalystResponse Pydantic model.
        """
        with patch("agent_core.call_llm", return_value=self.MOCK_LLM_JSON):
            agent = AnalystAgent()
            response = agent.analyse(self.COMPANY_DATA)

        assert isinstance(response, AnalystResponse), (
            f"AnalystAgent.analyse() must return an AnalystResponse, "
            f"got {type(response).__name__!r} instead."
        )

    def test_analyst_response_has_required_fields(self):
        """
        The returned AnalystResponse must expose the mandatory AML fields:
        company_name, risk_score, risk_level, chain_of_thought, recommended_action.
        """
        with patch("agent_core.call_llm", return_value=self.MOCK_LLM_JSON):
            agent = AnalystAgent()
            response = agent.analyse(self.COMPANY_DATA)

        assert hasattr(response, "company_name"), "AnalystResponse must have 'company_name'."
        assert hasattr(response, "risk_score"), "AnalystResponse must have 'risk_score'."
        assert hasattr(response, "risk_level"), "AnalystResponse must have 'risk_level'."
        assert hasattr(response, "chain_of_thought"), "AnalystResponse must have 'chain_of_thought'."
        assert hasattr(response, "recommended_action"), "AnalystResponse must have 'recommended_action'."

    def test_analyst_response_values_match_llm_output(self):
        """
        Field values must reflect what the (mocked) LLM returned.
        """
        with patch("agent_core.call_llm", return_value=self.MOCK_LLM_JSON):
            agent = AnalystAgent()
            response = agent.analyse(self.COMPANY_DATA)

        assert response.company_name == "Acme Corp", (
            f"Expected company_name='Acme Corp', got {response.company_name!r}."
        )
        assert response.risk_score == 42, (
            f"Expected risk_score=42, got {response.risk_score!r}."
        )
        assert response.risk_level == "MEDIUM", (
            f"Expected risk_level='MEDIUM', got {response.risk_level!r}."
        )

    def test_analyst_raises_on_invalid_llm_json(self):
        """
        If the LLM returns malformed JSON (or missing required fields),
        AnalystAgent must raise a ValidationError or ValueError rather than
        silently returning broken data.
        """
        with patch("agent_core.call_llm", return_value="NOT VALID JSON {{{{"):
            agent = AnalystAgent()
            with pytest.raises((ValueError, Exception)):
                agent.analyse(self.COMPANY_DATA)
