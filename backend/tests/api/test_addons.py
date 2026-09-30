"""Add-on routers (tracking / announcements / exports) — RBAC gates + shapes.

Same offline contract as test_rbac.py: an ALLOWED role reaches the handler
(200, or 500 when Supabase is unreachable); a DENIED role gets 403.
"""
from fastapi.testclient import TestClient

ALLOWED_CODES = {200, 500}


def _probe(factory, role: str, method: str, path: str, **kwargs) -> int:
    with factory(role) as c:
        return getattr(c, method.lower())(path, **kwargs).status_code


def test_tracking_role_boundaries(auth_client_factory):
    expectations = [
        ("GET", "/api/tracking/projects", "employee", True),
        ("GET", "/api/tracking/projects", "qa", True),
        ("GET", "/api/tracking/projects", "manager", True),
        ("GET", "/api/tracking/projects", "sales", False),
        ("GET", "/api/tracking/projects", "client", False),
        ("GET", "/api/tracking/projects/00000000-0000-0000-0000-000000000001/updates", "qa", True),
        ("GET", "/api/tracking/projects/00000000-0000-0000-0000-000000000001/updates", "client", True),
        ("GET", "/api/tracking/projects/00000000-0000-0000-0000-000000000001/updates", "hr", False),
    ]
    for method, path, role, allowed in expectations:
        got = _probe(auth_client_factory, role, method, path)
        if allowed:
            assert got in ALLOWED_CODES, f"{role} {method} {path}: expected {ALLOWED_CODES}, got {got}"
        else:
            assert got == 403, f"{role} {method} {path}: expected 403, got {got}"


def test_tracking_post_rejects_invalid_visibility(auth_client_factory):
    with auth_client_factory("employee") as c:
        r = c.post(
            "/api/tracking/projects/00000000-0000-0000-0000-000000000001/updates",
            json={"projectId": "00000000-0000-0000-0000-000000000001", "title": "x", "visibility": "public"},
        )
    assert r.status_code == 403  # employees can only post to their manager


def test_tracking_summary_admin_only(auth_client_factory):
    assert _probe(auth_client_factory, "admin", "GET", "/api/tracking/summary") in ALLOWED_CODES
    assert _probe(auth_client_factory, "employee", "GET", "/api/tracking/summary") == 403


def test_announcements_read_is_universal(auth_client_factory):
    for role in ("admin", "hr", "employee", "qa", "client"):
        assert _probe(auth_client_factory, role, "GET", "/api/announcements") in ALLOWED_CODES


def test_announcements_write_is_admin_hr(auth_client_factory):
    payload = {"title": "t", "body": "b"}
    assert _probe(auth_client_factory, "admin", "POST", "/api/announcements", json=payload) in ALLOWED_CODES
    assert _probe(auth_client_factory, "hr", "POST", "/api/announcements", json=payload) in ALLOWED_CODES
    assert _probe(auth_client_factory, "sales", "POST", "/api/announcements", json=payload) == 403
    assert _probe(auth_client_factory, "employee", "POST", "/api/announcements", json=payload) == 403


def test_exports_role_boundaries(auth_client_factory):
    expectations = [
        ("GET", "/api/exports/attendance", "hr", True),
        ("GET", "/api/exports/attendance", "sales", False),
        ("GET", "/api/exports/leave", "hr", True),
        ("GET", "/api/exports/leads", "sales", True),
        ("GET", "/api/exports/leads", "employee", False),
        ("GET", "/api/exports/invoices", "client", True),
        ("GET", "/api/exports/projects", "manager", True),
        ("GET", "/api/exports/employees", "hr", True),
        ("GET", "/api/exports/timesheets", "hr", True),
        ("GET", "/api/exports/tickets", "admin", True),
        ("GET", "/api/exports/tickets", "client", False),
    ]
    for method, path, role, allowed in expectations:
        got = _probe(auth_client_factory, role, method, path)
        if allowed:
            assert got in ALLOWED_CODES, f"{role} {method} {path}: expected {ALLOWED_CODES}, got {got}"
        else:
            assert got == 403, f"{role} {method} {path}: expected 403, got {got}"


def test_exports_require_auth(client: TestClient):
    assert client.get("/api/exports/attendance").status_code == 401


def test_calendar_endpoints_exist(auth_client_factory):
    assert _probe(auth_client_factory, "sales", "GET", "/api/exports/calendar.ics") in ALLOWED_CODES
    assert _probe(auth_client_factory, "employee", "GET", "/api/exports/calendar/google-links") in ALLOWED_CODES
