"""Authentication behavior (offline; Supabase unreachable on purpose)."""
from fastapi.testclient import TestClient


def test_login_requires_email_shape(client: TestClient):
    r = client.post("/api/auth/login", json={"email": "x@y", "password": "whatever"})
    assert r.status_code == 422  # EmailStr rejects


def test_login_invalid_credentials(client: TestClient):
    r = client.post("/api/auth/login", json={"email": "someone@example.com", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["error_code"] == "UNAUTHENTICATED"


def test_me_requires_token(client: TestClient):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_garbage_token(client: TestClient):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401


def test_refresh_requires_header(client: TestClient):
    assert client.post("/api/auth/refresh").status_code == 400


def test_v1_login_same_behavior(client: TestClient):
    r = client.post("/api/v1/auth/login", json={"email": "someone@example.com", "password": "wrong"})
    assert r.status_code == 401
