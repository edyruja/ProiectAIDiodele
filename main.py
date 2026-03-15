import json
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import CompanyProfile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery.result import AsyncResult
from fastapi.responses import JSONResponse

from agent_core import Orchestrator
from worker import celery_app, run_osint_analysis

app = FastAPI(title="AML Antigravity API", version="0.1.0")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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


from fastapi import BackgroundTasks

@app.post("/analyze-company")
def analyze_company(request: AnalyzeRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Submit a company analysis to be run in the background.

    Returns immediately with a task_id so the frontend can poll for completion.
    """
    company_name = request.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=422, detail="company_name must not be empty.")

    # Check for existing company records (case-insensitive substring match)
    existing_company = db.query(CompanyProfile).filter(
        CompanyProfile.company_name.ilike(f"%{company_name}%")
    ).first()

    # Trigger the background task asynchronously so it doesn't block the HTTP response
    task_id = f"mock-task-{company_name.replace(' ', '-').lower()}"
    
    def trigger_celery():
        try:
            run_osint_analysis.delay(company_name)
        except Exception as e:
            print(f"Warning: Could not connect to Celery broker: {e}")

    background_tasks.add_task(trigger_celery)
        
    return {
        "message": "Analysis started in background (or failed to start if no broker).",
        "task_id": task_id,
        "cached_data": existing_company.to_dict() if existing_company else None
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

@app.get("/api/companies")
def get_companies(db: Session = Depends(get_db)):
    """Fetch mock companies from the SQLite database."""
    companies = db.query(CompanyProfile).limit(50).all()
    result = []
    
    for company in companies:
        result.append(company.to_dict())
        
    return result

