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


def test_mock_companies_endpoint_shape():
    """Verify mock companies endpoint returns count/items payload."""
    response = client.get("/mock-companies?limit=50")
    assert response.status_code == 200

    payload = response.json()
    assert "count" in payload
    assert "items" in payload
    assert isinstance(payload["count"], int)
    assert isinstance(payload["items"], list)
