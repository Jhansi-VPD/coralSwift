"""CoralSwift backend seed — six demo role users + baseline org data.

Usage:
    cd backend
    python -m venv .venv (once) && .venv/Scripts/activate (Windows) / source .venv/bin/activate
    pip install -r requirements.txt
    copy .env.example .env   (fill in Supabase keys)
    python seed_backend_users.py

Idempotent: safe to re-run; existing users are skipped.
All demo passwords: CoralSwift#2026  (CHANGE IN PRODUCTION)
"""
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from supabase import ClientOptions, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY or "your-project" in SUPABASE_URL:
    sys.exit("✗ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")

sb = create_client(
    SUPABASE_URL,
    SERVICE_KEY,
    ClientOptions(auto_refresh_token=False, persist_session=False),
)
PASSWORD = "CoralSwift#2026"

USERS = [
    {"email": "admin@coralswift.com", "full_name": "Ada Admin", "role": "admin"},
    {"email": "hr@coralswift.com", "full_name": "Helen HR", "role": "hr"},
    {"email": "sales@coralswift.com", "full_name": "Sam Sales", "role": "sales"},
    {"email": "manager@coralswift.com", "full_name": "Mira Manager", "role": "manager"},
    {"email": "employee@coralswift.com", "full_name": "Evan Employee", "role": "employee"},
    {"email": "client@clientco.com", "full_name": "Clara Client", "role": "client"},
]


def upsert_user(u: dict) -> str:
    existing = sb.auth.admin.list_users()
    for known in existing or []:
        if getattr(known, "email", None) == u["email"]:
            user_id = known.id
            print(f"  = {u['email']} exists ({u['role']})")
            break
    else:
        created = sb.auth.admin.create_user({
            "email": u["email"], "password": PASSWORD, "email_confirm": True,
            "user_metadata": {"full_name": u["full_name"], "role": u["role"]},
        })
        user_id = created.user.id
        print(f"  + {u['email']} created ({u['role']})")

    sb.table("profiles").upsert({
        "id": user_id, "email": u["email"], "full_name": u["full_name"], "role": u["role"],
    }, on_conflict="id").execute()
    return user_id


def _write_then_id(table: str, payload: dict, mode: str, match: dict) -> str:
    """Insert/upsert without chained .select() (unsupported in this postgrest
    version), then read the row id back with a plain query."""
    q = sb.table(table)
    if mode == "upsert":
        q.upsert(payload).execute()
    else:
        q.insert(payload).execute()
    row = sb.table(table).select("id")
    for col, val in match.items():
        row = row.eq(col, val)
    res = row.limit(1).execute()
    return res.data[0]["id"]


def main() -> None:
    print("Seeding CoralSwift backend demo data…\n[users]")
    ids = {u["role"]: upsert_user(u) for u in USERS}

    print("\n[departments]")
    dept_id = _write_then_id(
        "departments",
        {"name": "Engineering", "head_of_department": ids["manager"]},
        "upsert", {"name": "Engineering"},
    )
    print("  + Engineering")

    print("\n[employees]")
    mgr_id = _write_then_id(
        "employees",
        {
            "profile_id": ids["manager"], "employee_code": "EMP-001",
            "designation": "Delivery Manager", "department_id": dept_id, "status": "active",
        },
        "upsert", {"employee_code": "EMP-001"},
    )
    print("  + EMP-001 Mira Manager (manager)")

    emp_id = _write_then_id(
        "employees",
        {
            "profile_id": ids["employee"], "employee_code": "EMP-002",
            "designation": "Software Engineer", "department_id": dept_id,
            "manager_id": mgr_id, "status": "active",
        },
        "upsert", {"employee_code": "EMP-002"},
    )
    print("  + EMP-002 Evan Employee (reports to EMP-001)")

    print("\n[client organization]")
    # client_organizations has no UNIQUE(name) — do a manual find-or-create.
    existing_org = (
        sb.table("client_organizations").select("id")
        .eq("name", "ClientCo Industries").maybe_single().execute()
    )
    if existing_org.data:
        org_id = existing_org.data["id"]
    else:
        org_id = _write_then_id(
            "client_organizations",
            {"name": "ClientCo Industries", "industry": "Fintech", "status": "active",
             "account_owner_id": ids["sales"]},
            "insert", {"name": "ClientCo Industries"},
        )
    sb.table("client_contacts").upsert({
        "organization_id": org_id, "profile_id": ids["client"],
        "name": "Clara Client", "email": "client@clientco.com", "is_primary": True,
    }, on_conflict="profile_id").execute()
    print("  + ClientCo Industries (contact: client@clientco.com)")

    print("\n[project]")
    proj_id = _write_then_id(
        "projects",
        {
            "name": "ClientCo Payments Platform", "code": "CCP-01",
            "organization_id": org_id, "manager_id": mgr_id,
            "status": "active", "health": "on_track",
        },
        "upsert", {"code": "CCP-01"},
    )
    print("  + CCP-01 ClientCo Payments Platform")

    sb.table("project_members").upsert({
        "project_id": proj_id, "employee_id": emp_id,
        "allocation_percent": 100, "role_on_project": "Engineer",
    }, on_conflict="project_id,employee_id").execute()

    existing_ms = sb.table("milestones").select("id").eq("project_id", proj_id).limit(1).execute()
    if not existing_ms.data:
        sb.table("milestones").insert([
            {"project_id": proj.data["id"], "title": "Architecture Sign-off", "status": "completed", "sort_order": 0, "completed_at": "2026-09-01T00:00:00Z"},
            {"project_id": proj.data["id"], "title": "Core Payment Rails", "status": "in_progress", "sort_order": 1},
            {"project_id": proj.data["id"], "title": "Compliance Review", "status": "pending", "sort_order": 2},
        ])
        print("  + 3 milestones")

    print(f"\n✓ Seed complete.\n  All demo passwords: {PASSWORD}\n  Full table: see docs/CREDENTIALS.md")


if __name__ == "__main__":
    main()
