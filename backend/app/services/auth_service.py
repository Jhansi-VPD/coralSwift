"""Authentication business logic (Supabase Auth + legacy admin fallback)."""
import hmac
import time

from fastapi import HTTPException

from app.core.clients import anon_client
from app.core.config import settings
from app.core.logging import get_logger
from app.core.permissions import ROLE_PERMISSIONS
from app.core.rate_limit import login_limiter
from app.core.rbac import ROLE_HOME
from app.core.security import (
    SessionUser,
    create_legacy_admin_token,
    resolve_supabase_user,
    verify_legacy_admin_token,
)
from app.schemas.auth import AuthUser, LoginResponse

logger = get_logger("coralswift.auth")


class AuthService:
    async def login(self, email: str, password: str, ip: str) -> LoginResponse:
        """Unified login for all six roles. Rate limited per IP (5 / 15 min)."""
        login_limiter.check(ip)

        # Path 1 — Supabase Auth (per-user accounts, role from profiles)
        client = anon_client()
        if client:
            try:
                resp = client.auth.sign_in_with_password({"email": email, "password": password})
            except Exception:
                resp = None
            if resp and resp.session and resp.user:
                user = await resolve_supabase_user(resp.session.access_token)
                if user is None:
                    raise HTTPException(status_code=403, detail="Account is not provisioned or is deactivated. Contact your administrator.")
                from app.services.audit_service import audit
                audit("USER_LOGIN", "auth", user.id, user, {"method": "supabase_auth"}, ip)
                return LoginResponse(
                    success=True,
                    user=AuthUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
                    accessToken=resp.session.access_token,
                    expiresIn=resp.session.expires_in,
                    redirectTo=ROLE_HOME.get(user.role, "/"),
                )

        # Path 2 — legacy admin env credentials (HMAC token, 7-day TTL)
        if (
            settings.admin_email and settings.admin_password and settings.admin_session_secret
            and hmac.compare_digest(email.lower(), settings.admin_email.strip().lower())
            and hmac.compare_digest(password, settings.admin_password)
        ):
            token = create_legacy_admin_token(settings.admin_email, settings.admin_session_secret)
            from app.services.audit_service import audit
            audit("USER_LOGIN", "auth", None, None, {"method": "legacy_env"}, ip)
            return LoginResponse(
                success=True,
                user=AuthUser(id="usr_admin", email=settings.admin_email, role="admin", fullName="Administrator"),
                accessToken=token,
                expiresIn=7 * 24 * 3600,
                redirectTo=ROLE_HOME["admin"],
            )

        logger.info("failed login email=%s ip=%s", email, ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    def me(self, user: SessionUser) -> dict:
        return {
            "authenticated": True,
            "source": "legacy_admin" if user.id == "usr_admin" else "supabase",
            "user": AuthUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
            "permissions": ROLE_PERMISSIONS.get(user.role, []),
        }

    async def refresh(self, refresh_token: str) -> LoginResponse:
        client = anon_client()
        if not client:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        try:
            resp = client.auth.refresh_session({"refresh_token": refresh_token})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        if not resp or not resp.session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = await resolve_supabase_user(resp.session.access_token)
        if not user:
            raise HTTPException(status_code=403, detail="Account unavailable")
        return LoginResponse(
            success=True,
            user=AuthUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
            accessToken=resp.session.access_token,
            expiresIn=resp.session.expires_in,
            redirectTo=ROLE_HOME.get(user.role, "/"),
        )

    async def logout(self, token: str | None, ip: str) -> None:
        if not token:
            return
        resolved = await resolve_supabase_user(token)
        if resolved:
            from app.services.audit_service import audit
            audit("USER_LOGOUT", "auth", resolved.id, resolved, ip=ip)


auth_service = AuthService()
