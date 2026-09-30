"""Unit: permission matrix invariants."""
from app.core.constants import ROLES
from app.core.permissions import P, ROLE_PERMISSIONS, role_has


def test_all_roles_have_matrices():
    for role in ROLES:
        assert role in ROLE_PERMISSIONS
        assert ROLE_PERMISSIONS[role], role


def test_admin_is_superset():
    for role in ROLES:
        if role == "admin":
            continue
        missing = set(ROLE_PERMISSIONS[role]) - set(ROLE_PERMISSIONS["admin"])
        assert not missing, f"admin lacks {role} perms: {missing}"


def test_client_cannot_touch_staff_resources():
    for perm in (P.USERS_MANAGE, P.LEADS_WRITE, P.TIMESHEETS_APPROVE, P.EMPLOYEES_WRITE):
        assert not role_has("client", perm)


def test_employee_scoping_permissions():
    assert role_has("employee", P.TASKS_UPDATE_OWN)
    assert not role_has("employee", P.TASKS_ASSIGN)


def test_role_has_helper():
    assert role_has("admin", P.SETTINGS_WRITE)
    assert role_has("manager", P.TIMESHEETS_APPROVE)
    assert not role_has("sales", P.TIMESHEETS_APPROVE)
