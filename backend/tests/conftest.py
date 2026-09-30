"""Pytest fixtures: offline app client + deterministic auth fakes.

No test touches the real Supabase project: dependency_overrides replace
get_session_user/require_role, and Supabase env vars are pointed at
placeholder values so no client can reach the network.
"""
import os
from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "https://offline.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "offline-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "offline-service-key")
os.environ.setdefault("ADMIN_SESSION_SECRET", "test-secret")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEBUG", "false")

from app.core.security import SessionUser, get_session_user, require_role  # noqa: E402
from app.main import app  # noqa: E402


def _fake_user(role: str, user_id: str = "00000000-0000-0000-0000-00000000000") -> SessionUser:
    return SessionUser(id=user_id, email=f"{role}@test.local", role=role, full_name=role.title())


@pytest.fixture
def client():
    """Unauthenticated app client (401s on protected routes)."""
    # raise_server_exceptions=False: let the global 500 handler's response through
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def auth_client_factory():
    """Context-manager factory: with factory('manager') as c: ..."""
    @contextmanager
    def _factory(role: str):
        user = _fake_user(role)

        async def _override_session():
            return user

        # require_role(...) returns an inner dependency that itself Depends(get_session_user);
        # overriding get_session_user covers every role gate.
        app.dependency_overrides[get_session_user] = _override_session
        try:
            with TestClient(app, raise_server_exceptions=False) as c:
                yield c
        finally:
            app.dependency_overrides.clear()

    return _factory
