"""RBAC permission matrix — historically mirrored the retired legacy Next.js backend (see git history)."""

HR_PERMS = [
    "employees.read", "employees.write", "leave.approve", "attendance.read.all",
    "departments.write", "projects.read.all", "users.manage", "audit.read",
]

SALES_PERMS = [
    "leads.read", "leads.write", "clients.read", "clients.write",
    "proposals.write", "contracts.write", "invoices.write", "sales.analytics",
]

MANAGER_PERMS = [
    "projects.read.all", "projects.write", "tasks.assign", "milestones.write",
    "timesheets.approve", "reviews.write", "leave.approve",
    "tasks.read.own", "tasks.update.own", "timesheets.own", "leave.own",
]

EMPLOYEE_PERMS = [
    "tasks.read.own", "tasks.update.own", "timesheets.own", "leave.own",
]

CLIENT_PERMS = [
    "client.projects.read", "client.invoices.read",
    "client.tickets", "client.documents.read",
]

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": sorted(set(HR_PERMS + SALES_PERMS + MANAGER_PERMS + EMPLOYEE_PERMS + CLIENT_PERMS) | {
        "users.manage", "settings.write", "audit.read",
    }),
    "hr": HR_PERMS,
    "sales": SALES_PERMS,
    "manager": MANAGER_PERMS,
    "employee": EMPLOYEE_PERMS,
    "client": CLIENT_PERMS,
}

ROLE_HOME: dict[str, str] = {
    "admin": "/admin",
    "hr": "/hr",
    "sales": "/sales",
    "manager": "/manager",
    "employee": "/employee",
    "client": "/client",
}

# Fallback map served by GET /api/admin/settings before any rows exist
# (mirrors frontend/src/lib/mock-data.ts initialSiteSettings).
INITIAL_SITE_SETTINGS: dict = {
    "site_name": "CoralSwift",
    "tagline": "Enterprise Architecture & Digital Transformation",
    "email": "hello@coralswift.com",
    "phone": "+1 (555) 010-2026",
    "address": "100 Harbor Boulevard, Suite 400",
    "social_links": {},
    "seo": {"title": "CoralSwift", "description": "Enterprise architecture studio"},
}
