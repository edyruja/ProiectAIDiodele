from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent_core import Orchestrator

app = FastAPI(title="AML Antigravity API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Phase 5 – /analyze-company endpoint
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """Request body for the company analysis endpoint."""
    company_name: str


@app.post("/analyze-company")
def analyze_company(request: AnalyzeRequest):
    """Run an AML analysis on the specified company.

    Triggers the Orchestrator, which:
      1. Calls fetch_company_data() to retrieve registry & sanctions data.
      2. Passes the data to AnalystAgent, which queries the LLM.
      3. Returns a validated AnalystResponse JSON object.
    """
    if not request.company_name.strip():
        raise HTTPException(status_code=422, detail="company_name must not be empty.")

    prompt = f"Please analyse {request.company_name} for AML risk."
    orchestrator = Orchestrator()
    result = orchestrator.run(prompt)
    return result
