"""Create or promote an admin account.

Usage:
    python scripts/create_admin.py                     # prompts for email/password
    ADMIN_EMAIL=... ADMIN_PASSWORD=... python scripts/create_admin.py
"""
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from app.core.clients import service_client  # noqa: E402
from supabase import ClientOptions, create_client  # noqa: E402


def main() -> None:
    email = (os.getenv("ADMIN_EMAIL") or input("Admin email: ")).strip().lower()
    password = os.getenv("ADMIN_PASSWORD") or getpass.getpass("Password (min 8 chars): ")
    full_name = os.getenv("ADMIN_FULL_NAME") or "Administrator"
    if len(password) < 8:
        sys.exit("✗ Password must be at least 8 characters.")

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or "your-project" in url:
        sys.exit("✗ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")

    sb = create_client(url, key, ClientOptions(auto_refresh_token=False, persist_session=False))

    existing_id = None
    for u in (sb.auth.admin.list_users() or []):
        if getattr(u, "email", None) == email:
            existing_id = u.id
            break

    if existing_id:
        sb.auth.admin.update_user_by_id(existing_id, {"password": password})
        print(f"= auth user exists, password reset: {email}")
    else:
        created = sb.auth.admin.create_user({
            "email": email, "password": password, "email_confirm": True,
            "user_metadata": {"full_name": full_name, "role": "admin"},
        })
        existing_id = created.user.id
        print(f"+ auth user created: {email}")

    sb.table("profiles").upsert(
        {"id": existing_id, "email": email, "full_name": full_name, "role": "admin", "is_active": True},
        on_conflict="id",
    ).execute()
    print(f"✓ {email} is an active admin.")


if __name__ == "__main__":
    main()
