import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app

client = TestClient(app)

@patch("main.run_osint_analysis.delay")
def test_analyze_company_returns_task_id(mock_delay):
    """Submit a company analysis and ensure it returns a task_id instead of blocking."""
    mock_task = MagicMock()
    mock_task.id = "mock-task-id-123"
    mock_delay.return_value = mock_task
    
    response = client.post("/analyze-company", json={"company_name": "Test Acme Corp"})
    assert response.status_code == 200, response.text
    data = response.json()
    assert "task_id" in data
    assert data["task_id"] == "mock-task-id-123"
    assert "message" in data  # Usually says "Analysis started in background."

@patch("main.AsyncResult")
def test_analysis_status_endpoint(mock_async_result):
    """Poll the status endpoint with a fake task ID."""
    mock_instance = MagicMock()
    mock_instance.status = "SUCCESS"
    mock_instance.result = {"mock_result": True}
    mock_async_result.return_value = mock_instance
    
    response = client.get("/analysis-status/fake-task-1234")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "SUCCESS"
    assert "result" in data
