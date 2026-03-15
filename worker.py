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
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    broker_connection_timeout=1.0,
)

@celery_app.task(name="aml_worker.run_osint_analysis", bind=True, max_retries=3)
def run_osint_analysis(self, company_name: str) -> dict:
    """
    Background task to orchestrate the AML analysis.
    This wraps the Orchestrator call which can be long-running due to:
    - OSINT data scraping
    - Vector database retrieval
    - LLM complex reasoning

    On SUCCESS the returned dict contains:
        - ``company_data``    – raw OSINT payload
        - ``analysis``        – structured AnalystResponse fields
        - ``updated_profile`` – the freshly committed CompanyProfile row (to_dict()).
                                Frontend can use this as the "data is fresh" signal
                                to re-render without an extra /api/companies poll.
    """
    try:
        prompt = f"Please analyse {company_name} for AML risk."
        orchestrator = Orchestrator()
        result = orchestrator.run(prompt)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
