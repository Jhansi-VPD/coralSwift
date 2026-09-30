"""Canonical permission catalog + role matrix (single source of truth for RBAC).

Permission naming: <resource>.<action>. The coarse `require_role()` gates remain
for module boundaries; `require_permission(...)` is the fine-grained dependency
for sensitive operations.
"""

class P:
    """Permission constants."""
    # admin / org
    SETTINGS_READ = "settings.read"
    SETTINGS_WRITE = "settings.write"
    AUDIT_READ = "audit.read"
    ENQUIRIES_MANAGE = "enquiries.manage"
    APPLICATIONS_MANAGE = "applications.manage"
    CONTENT_MANAGE = "content.manage"
    # hr
    USERS_MANAGE = "users.manage"
    EMPLOYEES_READ = "employees.read"
    EMPLOYEES_WRITE = "employees.write"
    DEPARTMENTS_WRITE = "departments.write"
    LEAVE_APPROVE = "leave.approve"
    ATTENDANCE_READ_ALL = "attendance.read.all"
    # sales
    LEADS_READ = "leads.read"
    LEADS_WRITE = "leads.write"
    CLIENTS_READ = "clients.read"
    CLIENTS_WRITE = "clients.write"
    PROPOSALS_WRITE = "proposals.write"
    CONTRACTS_WRITE = "contracts.write"
    SALES_ANALYTICS = "sales.analytics"
    # manager
    PROJECTS_READ_ALL = "projects.read.all"
    PROJECTS_WRITE = "projects.write"
    TASKS_ASSIGN = "tasks.assign"
    MILESTONES_WRITE = "milestones.write"
    TIMESHEETS_APPROVE = "timesheets.approve"
    REVIEWS_WRITE = "reviews.write"
    # employee (self-service)
    TASKS_READ_OWN = "tasks.read.own"
    TASKS_UPDATE_OWN = "tasks.update.own"
    TIMESHEETS_OWN = "timesheets.own"
    LEAVE_OWN = "leave.own"
    ATTENDANCE_OWN = "attendance.own"
    DOCUMENTS_OWN = "documents.own"
    # client portal
    CLIENT_PROJECTS_READ = "client.projects.read"
    CLIENT_INVOICES_READ = "client.invoices.read"
    CLIENT_TICKETS = "client.tickets"
    CLIENT_DOCUMENTS_READ = "client.documents.read"


_HR = [
    P.EMPLOYEES_READ, P.EMPLOYEES_WRITE, P.LEAVE_APPROVE, P.ATTENDANCE_READ_ALL,
    P.DEPARTMENTS_WRITE, P.PROJECTS_READ_ALL, P.USERS_MANAGE, P.AUDIT_READ,
]

_SALES = [
    P.LEADS_READ, P.LEADS_WRITE, P.CLIENTS_READ, P.CLIENTS_WRITE,
    P.PROPOSALS_WRITE, P.CONTRACTS_WRITE, P.SALES_ANALYTICS, P.CLIENT_INVOICES_READ,
]

_MANAGER = [
    P.PROJECTS_READ_ALL, P.PROJECTS_WRITE, P.TASKS_ASSIGN, P.MILESTONES_WRITE,
    P.TIMESHEETS_APPROVE, P.REVIEWS_WRITE, P.LEAVE_APPROVE,
    P.TASKS_READ_OWN, P.TASKS_UPDATE_OWN, P.TIMESHEETS_OWN, P.LEAVE_OWN,
    P.ATTENDANCE_OWN, P.DOCUMENTS_OWN, P.EMPLOYEES_READ,
]

_EMPLOYEE = [
    P.TASKS_READ_OWN, P.TASKS_UPDATE_OWN, P.TIMESHEETS_OWN, P.LEAVE_OWN,
    P.ATTENDANCE_OWN, P.DOCUMENTS_OWN,
]

_CLIENT = [
    P.CLIENT_PROJECTS_READ, P.CLIENT_INVOICES_READ, P.CLIENT_TICKETS, P.CLIENT_DOCUMENTS_READ,
]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": sorted(set(_HR + _SALES + _MANAGER + _EMPLOYEE + _CLIENT) | {
        P.SETTINGS_READ, P.SETTINGS_WRITE, P.AUDIT_READ,
        P.ENQUIRIES_MANAGE, P.APPLICATIONS_MANAGE, P.CONTENT_MANAGE, P.USERS_MANAGE,
    }),
    "hr": _HR,
    "sales": _SALES,
    "manager": _MANAGER,
    "employee": _EMPLOYEE,
    "client": _CLIENT,
}


def role_has(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, [])
