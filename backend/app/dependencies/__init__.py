"""Reusable FastAPI dependencies (auth, permissions, pagination)."""
from app.core.security import get_session_user, require_permission, require_role  # noqa: F401
