"""RBAC matrix — role fakes prove authorization is enforced server-side.

Offline contract: an ALLOWED role passes the gate and reaches the handler, which
then fails on the (unreachable) database → 500. A DENIED role never reaches the
handler → 403. 401 would mean the auth dependency itself failed.
"""
from fastapi.testclient import TestClient

ALLOWED_CODES = {200, 500}  # 500 = handler reached, Supabase unreachable (offline env)


def _probe(factory, role: str, method: str, path: str) -> int:
    with factory(role) as c:
        return getattr(c, method.lower())(path).status_code


def test_role_boundaries(auth_client_factory):
    expectations = [
        ("GET", "/api/employee/tasks", "employee", True),
        ("GET", "/api/employee/tasks", "client", False),
        ("GET", "/api/manager/projects", "manager", True),
        ("GET", "/api/manager/projects", "sales", False),
        ("GET", "/api/sales/leads", "sales", True),
        ("GET", "/api/sales/leads", "employee", False),
        ("GET", "/api/hr/employees", "hr", True),
        ("GET", "/api/hr/employees", "manager", False),
        ("GET", "/api/client/overview", "client", True),
        ("GET", "/api/client/overview", "hr", False),
        ("GET", "/api/admin/stats", "employee", False),  # require_role() default → admin only
        ("GET", "/api/admin/stats", "admin", True),
    ]
    for method, path, role, allowed in expectations:
        got = _probe(auth_client_factory, role, method, path)
        if allowed:
            assert got in ALLOWED_CODES, f"{role} {method} {path}: expected gate-pass {ALLOWED_CODES}, got {got}"
        else:
            assert got == 403, f"{role} {method} {path}: expected 403, got {got}"


def test_admin_always_allowed(auth_client_factory):
    for method, path in (
        ("GET", "/api/employee/tasks"),
        ("GET", "/api/manager/projects"),
        ("GET", "/api/sales/leads"),
        ("GET", "/api/hr/employees"),
        ("GET", "/api/client/overview"),
        ("GET", "/api/admin/stats"),
    ):
        got = _probe(auth_client_factory, "admin", method, path)
        assert got in ALLOWED_CODES, f"admin {method} {path}: got {got}"


def test_denied_never_reaches_handler(auth_client_factory):
    """A 403 must carry the standard envelope + FORBIDDEN code."""
    with auth_client_factory("employee") as c:
        r = c.get("/api/hr/employees")
    assert r.status_code == 403
    body = r.json()
    assert body["success"] is False and body["error_code"] == "FORBIDDEN"


def test_v1_parity_authorized(auth_client_factory):
    with auth_client_factory("sales") as c:
        legacy = c.get("/api/sales/leads").status_code
        versioned = c.get("/api/v1/sales/leads").status_code
    assert legacy == versioned
