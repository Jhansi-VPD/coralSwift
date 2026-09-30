"""Authentication & RBAC dependencies.

Every protected endpoint declares `user: SessionUser = Depends(require_role("hr", ...))`.
Resolution order:
  1. Supabase Auth JWT (per-user accounts; role from profiles table)
  2. Legacy admin HMAC JWT (issued from env credentials at /api/auth/login)
"""
import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt as jose_jwt, JWTError

from app.core.clients import anon_client
from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

ROLES = ("admin", "hr", "sales", "manager", "employee", "client", "qa")


@dataclass
class SessionUser:
    id: str
    email: str
    role: str
    full_name: str
    is_active: bool = True

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


# ---------------------------------------------------------------------------
# Supabase JWT verification (HS256 with the project's anon-key secret is not
# usable locally; we verify against Supabase by fetching the user with the
# token, which also gives us the authoritative session state.)
# ---------------------------------------------------------------------------

async def resolve_supabase_user(token: str) -> SessionUser | None:
    client = anon_client()
    if not client:
        return None
    try:
        resp = client.auth.get_user(token)
        user = resp.user if resp else None
    except Exception:
        return None
    if not user or not getattr(user, "email", None):
        return None

    # Role lives in profiles (authoritative for RBAC). Look it up with the
    # SERVICE client: RLS blocks the bare anon client from reading profiles
    # ("profiles self read" requires auth.uid()), and role resolution is a
    # privileged server-side operation — mirrors the TS backend's admin client.
    from app.core.clients import service_client
    lookup = service_client() or client
    try:
        row = (
            lookup.table("profiles")
            .select("id, email, full_name, role, is_active")
            .eq("id", user.id)
            .maybe_single()
            .execute()
        )
        profile = row.data if row else None
    except Exception:
        profile = None

    if not profile or not profile.get("is_active", False):
        return None

    return SessionUser(
        id=profile["id"],
        email=profile.get("email") or user.email,
        role=profile.get("role", "employee"),
        full_name=profile.get("full_name") or "",
    )


# ---------------------------------------------------------------------------
# Legacy admin HMAC JWT (mirrors lib/auth.ts: base64url(payload).base64url(sig))
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def create_legacy_admin_token(email: str, secret: str) -> str:
    payload = json.dumps({"email": email, "timestamp": int(time.time() * 1000)})
    payload_b64 = _b64url_encode(payload.encode())
    sig = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64url_encode(sig)}"


def verify_legacy_admin_token(token: str, secret: str) -> dict | None:
    try:
        payload_b64, sig_b64 = token.split(".")
        expected = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64url_decode(sig_b64)):
            return None
        data = json.loads(_b64url_decode(payload_b64))
        if (time.time() * 1000) - data.get("timestamp", 0) > 7 * 24 * 3600 * 1000:
            return None
        return data
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

async def get_session_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> SessionUser:
    """Resolve the caller. Raises 401 when no valid session exists."""
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = await resolve_supabase_user(token)
    if user:
        return user

    if settings.admin_session_secret:
        legacy = verify_legacy_admin_token(token, settings.admin_session_secret)
        if legacy:
            return SessionUser(
                id="usr_admin",
                email=legacy.get("email", "admin"),
                role="admin",
                full_name="Administrator",
            )

    raise HTTPException(status_code=401, detail="Invalid or expired session")


def require_role(*roles: str):
    """Endpoint dependency factory: allow only these roles (admin always allowed)."""
    allowed = set(roles) | {"admin"}

    async def dependency(user: SessionUser = Depends(get_session_user)) -> SessionUser:
        if user.role not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: requires role {' or '.join(sorted(roles))}",
            )
        return user

    return dependency


def require_permission(permission: str):
    """Coarse permission check mirroring the RBAC matrix (legacy admin bypasses)."""
    from app.core.rbac import ROLE_PERMISSIONS

    async def dependency(user: SessionUser = Depends(get_session_user)) -> SessionUser:
        if user.is_admin or permission in ROLE_PERMISSIONS.get(user.role, []):
            return user
        raise HTTPException(status_code=403, detail=f"Forbidden: missing '{permission}' permission")

    return dependency


def client_ip(request: Request) -> str:
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
