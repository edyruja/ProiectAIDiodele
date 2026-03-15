from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery.result import AsyncResult
from sqlalchemy.orm import Session

from agent_core import Orchestrator
from database import get_db
from models import CompanyProfile
from worker import celery_app, run_osint_analysis

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


@app.get("/mock-companies")
def list_mock_companies(
    limit: int = Query(default=50, ge=1, le=200),
    query: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return mock company records from the database for frontend dashboards."""
    statement = db.query(CompanyProfile)
    if query and query.strip():
        term = f"%{query.strip()}%"
        statement = statement.filter(CompanyProfile.company_name.ilike(term))

    companies = statement.order_by(CompanyProfile.id.asc()).limit(limit).all()
    return {
        "count": len(companies),
        "items": [company.to_dict() for company in companies],
    }


# ---------------------------------------------------------------------------
# Phase 5 – /analyze-company endpoint
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """Request body for the company analysis endpoint."""
    company_name: str


@app.post("/analyze-company")
def analyze_company(request: AnalyzeRequest):
    """Submit a company analysis to be run in the background.

    Returns immediately with a task_id so the frontend can poll for completion.
    """
    if not request.company_name.strip():
        raise HTTPException(status_code=422, detail="company_name must not be empty.")

    task = run_osint_analysis.delay(request.company_name)
    
    return {
        "message": "Analysis started in background.",
        "task_id": task.id
    }


@app.get("/analysis-status/{task_id}")
def get_analysis_status(task_id: str):
    """Poll for the status of a scheduled AML analysis task."""
    result = AsyncResult(task_id, app=celery_app)
    
    response_data = {
        "task_id": task_id,
        "status": result.status
    }
    
    if result.status == "SUCCESS":
        response_data["result"] = result.result
    elif result.status == "FAILURE":
        response_data["error"] = str(result.info)
        
    return response_data


# ---------------------------------------------------------------------------
# DEV / TESTING – /analyze-company-sync (no Redis, no Celery required)
# ---------------------------------------------------------------------------

@app.post("/analyze-company-sync")
def analyze_company_sync(request: AnalyzeRequest):
    """Run the AML analysis synchronously in-process.
    
    This endpoint skips Celery/Redis entirely and is intended for
    local development and testing only. The result is returned directly
    in the response, matching the same shape as a polled SUCCESS result.
    """
    if not request.company_name.strip():
        raise HTTPException(status_code=422, detail="company_name must not be empty.")

    try:
        prompt = f"Please analyse {request.company_name} for AML risk."
        orchestrator = Orchestrator()
        result = orchestrator.run(prompt)
        return {
            "status": "SUCCESS",
            "result": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
