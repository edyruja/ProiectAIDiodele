# Collaboration and Implementation Protocol: TDVC - AML Antigravity System

**Team:** 3 Human Developers + Antigravity Agent System
**Focus:** Full-Stack (Predominantly FastAPI Backend + Basic React/Next.js Frontend for testing)
**Main Working Branch:** `dev`

---

## 🛑 Rules of Engagement for Antigravity Agents

1. **Mandatory Human-in-the-Loop (HITL):** The AI Agent will not rewrite critical or architectural files without first presenting the proposed code for review. The final integration decision into the codebase belongs exclusively to the human developer at the keyboard.
2. **Controlled Git Workflow:** - All new code is written on feature branches derived from `dev` (e.g., `feature/db-setup`, `feature/basic-frontend`).
   - When a phase or functionality is complete and tested (GREEN), the agent will prepare the Git commands (`git add .`, `git commit -m "message"`, `git push origin branch-name`).
   - **The agent MUST WAIT for explicit confirmation ("CONFIRM" / "YES")** from the human user before executing Git commands in the terminal.
   - After the push, a human developer will manage the Pull Request/Merge process to the `dev` branch.
3. **Test-Driven Development (TDD):** The cycle must be respected: QA writes the test (fails) -> Dev writes the code -> Test passes -> Git confirmation.

---

## Phase 1: Frontend Framework Setup (React & Tailwind)
**Status:** [x] Complete

**Sub-agent 1: QA / Test Engineer**
- [x] Configure testing framework (Vitest and React Testing Library) and add `test` script to `package.json`.
- [x] Write Test 1: Verify if the main `App` component renders on screen without errors.
- [x] Verification: Tests fail (RED) because the project is not fully initialized.

**Sub-agent 2: Developer**
- [x] Initialize base project (Vite with React + TypeScript or Next.js).
- [x] Configure TailwindCSS for rapid styling.
- [x] Clean up default files (App.css, standard logos) to have a clean working environment.
- [x] Install component library (e.g., shadcn/ui) to avoid wasting time on basic CSS.
- [x] Verification: Tests pass (GREEN).
- [x] **Git Action:** Request human confirmation for commit/push on branch `feature/init-frontend`.

---

## Phase 2: Initial Backend Setup (FastAPI Infrastructure)
**Status:** [x] Complete

**Sub-agent 1: QA / Test Engineer**
- [x] Create `test_main.py` file using `pytest`.
- [x] Write Test 1: Verify if the health check endpoint (`GET /health`) returns status 200 and JSON `{"status": "ok"}`.
- [x] Verification: Tests fail (RED).

**Sub-agent 2: Developer**
- [x] Initialize Python virtual environment and create `requirements.txt` (FastAPI, Uvicorn, Pytest, CORS middleware).
- [x] Create `main.py` and configure basic FastAPI instance. **Important:** Configure CORS to allow requests from the Frontend port.
- [x] Implement `/health` endpoint.
- [x] Verification: All tests pass (GREEN).
- [x] **Git Action:** Request human confirmation for commit/push on branch `feature/init-fastapi`.

---

## Phase 3: Database Integration (PostgreSQL & Vector Store)
**Status:** [ ] Pending

**Sub-agent 1: QA / Test Engineer**
- [ ] Create integration tests in `test_database.py`.
- [ ] Test 1: Verify PostgreSQL connection and schema creation for `CompanyProfile`.
- [ ] Test 2: Verify initialization of the Vector DB client (Qdrant/Pinecone) and ability to insert a dummy vector.
- [ ] Verification: Tests fail (RED).

**Sub-agent 2: Developer**
- [ ] Configure SQLAlchemy for PostgreSQL connection.
- [ ] Create basic ORM models (`models.py`).
- [ ] Create `vector_store.py` module (including MCP support for agents).
- [ ] Verification: Tests pass (GREEN).
- [ ] **Git Action:** Request human confirmation for commit/push.

---

## Phase 4: Data Pipeline & OSINT Tooling (Extraction)
**Status:** [x] Completed

**Sub-agent 1: QA / Test Engineer**
- [x] Create `test_tools.py` file.
- [x] Test 1: Verify `fetch_company_data()` function with valid input.
- [x] Test 2: Verify geocoding/address validation function.
- [x] Verification: Tests fail (RED).

**Sub-agent 2: Developer**
- [x] Create `tools/` folder and implement API query scripts (commercial registers, sanctions databases).
- [x] Implement data extraction logic.
- [x] Verification: Tests pass (GREEN).
- [x] **Git Action:** Request human confirmation for commit/push.

---

## Phase 5: AI Agent Orchestration (LLM Routing)
**Status:** [ ] Pending

**Sub-agent 1: QA / Test Engineer**
- [ ] Create `test_llm_router.py` file.
- [ ] Test 1: Send a test prompt to the orchestrator and verify if it correctly calls the `fetch_company_data` utility (Tool Calling).
- [ ] Test 2: Verify if the Analyst Agent returns the final response strictly in the Pydantic-defined JSON format.
- [ ] Verification: Tests fail (RED).

**Sub-agent 2: Developer**
- [ ] Configure OpenRouter integration in `agent_core.py`.
- [ ] Implement LLM Routing system (Orchestrator + Analyst) and Chain of Thought.
- [ ] Create POST `/analyze-company` endpoint that links agents to the API.
- [ ] Verification: Tests pass (GREEN).
- [ ] **Git Action:** Request human confirmation for commit/push.

---

## Phase 6: Basic Frontend (Integration and Testing Interface)

**Sub-agent 1: QA / Test Engineer**
- [x] Create `DashboardAML.test.jsx` file.
- [x] Test 1: Verify if an input form exists to enter a company name.
- [x] Test 2: Submit mock data and verify if the UI displays "AML Risk Score" and "Explanation (Chain of Thought)" sections.
- [x] Verification: Tests fail (RED).

**Sub-agent 2: Developer**
