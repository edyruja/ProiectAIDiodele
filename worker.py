import os
from celery import Celery

from agent_core import Orchestrator

# Configuration for Celery
# We use Redis as both the message broker and the result backend.
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

celery_app = Celery(
    "aml_worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

# Optional: Configuration tuning for Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="aml_worker.run_osint_analysis", bind=True, max_retries=3)
def run_osint_analysis(self, company_name: str) -> dict:
    """
    Background task to orchestrate the AML analysis.
    This wraps the Orchestrator call which can be long-running due to:
    - OSINT data scraping
    - Vector database retrieval
    - LLM complex reasoning
    """
    try:
        prompt = f"Please analyse {company_name} for AML risk."
        orchestrator = Orchestrator()
        result = orchestrator.run(prompt)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
