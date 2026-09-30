"""Health + docs + global error envelope."""
from fastapi.testclient import TestClient


def test_root_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"


def test_root(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["docs"] == "/docs"


def test_swagger_and_openapi(client: TestClient):
    assert client.get("/docs").status_code == 200
    assert client.get("/redoc").status_code == 200
    spec = client.get("/openapi.json").json()
    assert "/api/auth/login" in spec["paths"]
    assert "/api/v1/auth/login" in spec["paths"]


def test_error_envelope_shape(client: TestClient):
    r = client.get("/api/admin/stats")  # no token
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert "message" in body and "error_code" in body


def test_validation_error_envelope(client: TestClient):
    r = client.post("/api/auth/login", json={"email": "not-an-email", "password": ""})
    assert r.status_code == 422
    body = r.json()
    assert body["success"] is False
    assert body["error_code"] == "VALIDATION_FAILED"
