import json
from unittest.mock import MagicMock, patch

from agent_core import AnalystAgent, AnalystResponse, ConversationMemory, Orchestrator


def _valid_analyst_json(company_name: str) -> str:
    return json.dumps(
        {
            "company_name": company_name,
            "risk_score": 35,
            "risk_level": "MEDIUM",
            "chain_of_thought": "Mock reasoning path.",
            "recommended_action": "Standard review",
        }
    )


class TestAgentInfrastructure:
    @patch("agent_core.AnalystAgent.analyse")
    @patch("agent_core.call_llm")
    @patch("agent_core.check_pep_associations")
    @patch("agent_core.search_adverse_news")
    @patch("agent_core.check_sanctions")
    @patch("agent_core.fetch_company_data")
    def test_tool_calling_loop_handles_multiple_tools(
        self,
        mock_fetch,
        mock_sanctions,
        mock_news,
        mock_pep,
        mock_call_llm,
        mock_analyse,
    ):
        mock_fetch.return_value = {
            "name": "Acme Corp",
            "registration_number": "RO10000001",
            "country": "RO",
            "status": "active",
            "address": "Str. Acme 1",
        }
        mock_sanctions.return_value = {"entity_name": "Acme Corp", "hits": []}
        mock_news.return_value = {"entity_name": "Acme Corp", "articles": []}
        mock_pep.return_value = {"entity_name": "Acme Corp", "matches": []}

        mock_call_llm.side_effect = [
            {
                "role": "assistant",
                "content": "Fetch company first.",
                "tool_calls": [
                    {
                        "id": "tc-1",
                        "type": "function",
                        "function": {
                            "name": "fetch_company_data",
                            "arguments": json.dumps({"company_name": "Acme Corp"}),
                        },
                    }
                ],
            },
            {
                "role": "assistant",
                "content": "Screen sanctions.",
                "tool_calls": [
                    {
                        "id": "tc-2",
                        "type": "function",
                        "function": {
                            "name": "check_sanctions",
                            "arguments": json.dumps({"entity_name": "Acme Corp"}),
                        },
                    }
                ],
            },
            {
                "role": "assistant",
                "content": "Check news and PEP.",
                "tool_calls": [
                    {
                        "id": "tc-3",
                        "type": "function",
                        "function": {
                            "name": "search_adverse_news",
                            "arguments": json.dumps({"entity_name": "Acme Corp"}),
                        },
                    },
                    {
                        "id": "tc-4",
                        "type": "function",
                        "function": {
                            "name": "check_pep_associations",
                            "arguments": json.dumps({"entity_name": "Acme Corp"}),
                        },
                    },
                ],
            },
            {
                "role": "assistant",
                "content": "All checks complete.",
                "tool_calls": [],
            },
        ]

        mock_analyse.return_value = AnalystResponse(
            company_name="Acme Corp",
            risk_score=35,
            risk_level="MEDIUM",
            chain_of_thought="Mock reasoning path.",
            recommended_action="Standard review",
        )

        orchestrator = Orchestrator(max_tool_iterations=8)
        result = orchestrator.run("Please analyse Acme Corp for AML risk.")

        mock_fetch.assert_called_once_with(company_name="Acme Corp")
        mock_sanctions.assert_called_once_with(entity_name="Acme Corp")
        mock_news.assert_called_once_with(entity_name="Acme Corp")
        mock_pep.assert_called_once_with(entity_name="Acme Corp")
        assert "tool_trace" in result
        assert len(result["tool_trace"]) == 4
        assert result["analysis"]["company_name"] == "Acme Corp"

    @patch("agent_core.call_llm", return_value={"role": "assistant", "content": "No tools required.", "tool_calls": []})
    def test_conversation_history_maintained_across_turns(self, _mock_call_llm):
        memory = ConversationMemory(max_messages=10)
        orchestrator = Orchestrator(memory=memory)

        result_one = orchestrator.run("Hello")
        result_two = orchestrator.run("Follow up question")

        user_messages = [m for m in memory.messages if m.get("role") == "user"]
        assert len(user_messages) == 2
        assert user_messages[0]["content"] == "Hello"
        assert user_messages[1]["content"] == "Follow up question"
        assert result_one["message"] == "No tools required."
        assert result_two["message"] == "No tools required."

    @patch("agent_core.call_llm")
    @patch("agent_core.VectorStoreClient")
    def test_rag_context_is_injected_in_prompt(self, mock_vector_store_class, mock_call_llm):
        memory = ConversationMemory(max_messages=10)
        memory.add_user("Please run deep analysis for Acme Corp")

        mock_vector = mock_vector_store_class.return_value
        mock_vector.search.return_value = [
            {"id": "1", "score": 0.99, "payload": {"company_name": "Old Acme", "risk_score": 75}}
        ]

        captured_prompt = {"value": ""}

        def _capture_prompt(*args, **kwargs):
            captured_prompt["value"] = kwargs.get("prompt") or (args[0] if args else "")
            return _valid_analyst_json("Acme Corp")

        mock_call_llm.side_effect = _capture_prompt

        agent = AnalystAgent(memory=memory)
        response = agent.analyse({"name": "Acme Corp", "country": "RO"})

        assert response.company_name == "Acme Corp"
        assert "Latest user request" in captured_prompt["value"]
        assert "Historical context" in captured_prompt["value"]
        assert "Old Acme" in captured_prompt["value"]
