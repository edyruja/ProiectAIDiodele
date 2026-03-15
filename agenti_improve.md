# Agent Infrastructure Improvement Plan

This plan aims to evolve the current agent architecture from a regex-based heuristic model to a more robust, "agentic" tool-calling model. It also introduces proper memory management (context window) and expands the OSINT toolkit to support deep investigations.

> **IMPORTANT: User Review Required**
> The orchestrator will switch from regex-based extraction to LLM-driven tool calling. This might affect how the agent responds to ambiguous prompts.

> **NOTE**
> `call_llm` will be updated to include a "tools" parameter. While we still use a mock for testing, the interface will align with OpenAI/OpenRouter tool-calling standards.

---

## Proposed Changes

### Core Agent Architecture
* **[MODIFY]** `agent_core.py`
    * Refactor `Orchestrator` to use a loop that handles tool calls.
    * Implement `ConversationMemory` class to store short-term context.
    * Update `AnalystAgent` to automatically query `VectorStoreClient` based on the conversation context.
    * Update `call_llm` to support `tools` and `tool_choice` parameters.

### OSINT Toolset Expansion
* **[NEW]** `sanctions_checker.py`
    * Implement a tool to check entities against sanction lists (OFAC, EU, UN). *(Initial version will use a refined mock with realistic data patterns).*
* **[NEW]** `news_scraper.py`
    * Implement a tool to search for adverse news related to a company. *(Initially will simulate news search results).*
* **[NEW]** `pep_checker.py`
    * Implement a tool to check for Politically Exposed Persons (PEPs) associated with the entity.

---

## Verification Plan

### Automated Tests
* Run `pytest test_database.py` to ensure persistence still works.
* Create `test_agent_infrastructure.py` to verify:
    * Tool-calling loop correctly handles multiple tools.
    * Conversation history is maintained across turns.
    * RAG context is injected correctly.
* **Command:** `pytest test_agent_infrastructure.py`

### Manual Verification
* Test "Rapid Triage" (UC1) via the UI (if available) or via `main.py` entry point.
* Trigger a "Deep Analysis" (UC2) and verify that the reasoning log shows multiple tool calls (Sanctions, News, PEP).