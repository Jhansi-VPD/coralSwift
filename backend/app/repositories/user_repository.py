"""profiles + Supabase Auth admin operations."""
from postgrest.exceptions import APIError
from supabase import Client

from app.core.exceptions import AppError
from app.repositories.base import Repository


class UserRepository(Repository):
    table = "profiles"

    # ---- profiles -----------------------------------------------------------
    def find_by_email(self, columns: str = "*", email: str = "") -> dict | None:
        return self.fetch_one(columns, email=email)

    def page(self, columns: str, offset: int, limit: int):
        q = self.sb.table(self.table).select(columns, count="exact").order("created_at", desc=True).range(offset, offset + limit - 1)
        res = q.execute()
        total = getattr(res, "count", None)
        return res.data or [], (total if total is not None else len(res.data or []))

    # ---- Supabase Auth admin -------------------------------------------------
    def auth_create_user(self, email: str, password: str, full_name: str, role: str) -> str:
        """Create an auth user + matching profile row. Returns the new user id."""
        try:
            created = self.sb.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name, "role": role},
            })
        except APIError as e:
            raise AppError(f"Account provisioning failed: {e.message}", error_code="AUTH_ADMIN_ERROR") from e
        except Exception as e:
            raise AppError("Account provisioning failed", error_code="AUTH_ADMIN_ERROR") from e
        user_id = created.user.id
        self.upsert_one(
            {"id": user_id, "email": email, "full_name": full_name, "role": role},
            on_conflict="id",
        )
        return user_id

    def auth_list_emails(self) -> set[str]:
        try:
            users = self.sb.auth.admin.list_users() or []
        except Exception:
            return set()
        return {getattr(u, "email", None) for u in users if getattr(u, "email", None)}

    def auth_find_id_by_email(self, email: str) -> str | None:
        try:
            users = self.sb.auth.admin.list_users() or []
        except Exception:
            return None
        for u in users:
            if getattr(u, "email", None) == email:
                return u.id
        return None
