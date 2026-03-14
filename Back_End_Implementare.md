# Software Implementation Plan: Antigravity AI System

**Context:** Technical roadmap and implementation plan.  
**Recipient:** Antigravity Agents (Development Team / Autonomous Systems).  
**Purpose:** Step-by-step execution guide for building the web infrastructure and the autonomous agent ecosystem.

---

# 1. Core Infrastructure and Tech Stack

To support the AI system, the infrastructure must be fast, asynchronous, and easily integrable with machine learning models.

## Backend & Databases

### Backend & API
**Python + FastAPI**

Provides high performance, native support for asynchronous processes (critical for handling hundreds of external requests), and automatic OpenAPI (Swagger) documentation generation for synchronization with the frontend team.

### Asynchronous Processing (Task Queue)
**Celery + Redis**

Long-running OSINT investigations will run in the background without blocking the user interface. Redis will act as the message broker.

### Relational Database (Transactional)
**PostgreSQL**

Used to store user data, risk scores, search history, and audit logs essential for compliance and Explainable AI (XAI).

### Vector Database (AI Core)
**Qdrant** (or **Pinecone**)

Stores embeddings for legal texts and previous reports.

**Recommendation:**
- **Qdrant** for future self-hosting flexibility (common requirement in defense environments)
- **Pinecone** for rapid serverless deployment

---

# 2. Analyst Dashboard Frontend

### Main Framework
**Next.js (React) with TypeScript**

TypeScript is mandatory to prevent errors when handling complex data structures (JSON) returned by AI agents.

### Styling & UI
**Tailwind CSS** together with **shadcn/ui** for rapid development and a clean interface.

### Network Visualization (Graph Analysis)
**React Flow** or **Cytoscape.js**

Essential tools to visually render the “spider web” of shell company networks (directors, addresses, connected entities).

---

# 3. Data Bridge: OSINT Integration & Scraping

The system requires specialized tools to extract real-world intelligence where official APIs are missing.

### OSINT APIs

Integration with pre-existing data platforms such as:

- **OpenCorporates API** (global company registry data)
- **Google Maps / Places API** (physical address validation)

### Dynamic Scraping

Use **Playwright** or **Selenium** (via Python) to extract data from obscure commercial registries or dynamic government websites that do not provide APIs.

---

# 4. AI Agent Architecture (Autonomous Ecosystem)

The system does not rely on a single monolithic model, but instead on a **multi-agent architecture based on task delegation**, designed for speed, cost reduction, and decision transparency.

---

# Workflow and Key Concepts

## A. LLM Routing (Task Distribution via OpenRouter)

The system uses specialized open-source models to avoid dependency on local hardware.

### Orchestrator Agent
Uses fast models (e.g., **Meta Llama 3 8B / Mixtral**).

Responsibilities:
- Receive the initial request
- Analyze intent
- Decide which databases or tools must be queried

Goal: **maximum speed and minimal cost**

### Analyst Agent ("The Brain")

Uses complex reasoning models (e.g., **Llama 3 70B / Qwen 2.5 72B**).

Responsibilities:
- Process all collected data
- Perform logical deductions
- Generate the final risk report

---

## B. Tool Calling

The Orchestrator Agent does not “guess” but retrieves real data by executing predefined functions:

- Address lookup via **Google Maps API**
- Corporate registry queries (via scraping/API modules)
- Sanctions list verification for individuals and entities

---

## C. Vector Database Integration via MCP (Model Context Protocol)

For standardization and security, the vector database (Qdrant) will be exposed to agents using **Model Context Protocol (MCP)**.

**Advantage:**

By building an MCP server for the vector database, the AI model will be able to query the system’s “memory” in a standardized way.

If in the future we change the LLM or add other databases, the MCP connection remains uniform, dramatically reducing integration complexity.

---

## D. RAG (Retrieval-Augmented Generation)

The system’s long-term memory (efficiently accessed via MCP).

When the agent investigates an entity, the RAG system automatically searches for:

- Similar past investigations
- Updated embargo legislation
- OFAC sanction lists

These data points are injected directly into the Analyst agent’s context.

---

## E. Context Window Optimization

To prevent hallucinations and maintain performance, the system sends to models only **cleaned and preprocessed text**, including:

- Essential extracts retrieved via RAG
- Raw results from tool calls

Background noise (e.g., unnecessary HTML tags) is removed.

---

## F. Chain of Thought Reasoning (Explainable AI)

The Analyst Agent is constrained via prompt engineering to apply **step-by-step reasoning before issuing a verdict**, ensuring legal traceability.

Example reasoning generation:

1. Address located  
2. Address belongs to a residential building  
3. Company declares large-scale industrial production  
4. Logical contradiction detected  
5. Conclusion: **High Risk**

---

## G. Structured JSON Output

At the end of the reasoning process (Chain of Thought), the agent is forced to format the result strictly in **JSON format**.

This payload is captured by **FastAPI** and routed to:

- **PostgreSQL** for storage
- **Frontend dashboard** for visualization