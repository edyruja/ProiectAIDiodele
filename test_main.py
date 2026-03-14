from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """
    Test 1: Verify health check endpoint
    GET /health should return 200 and {"status": "ok"}
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
