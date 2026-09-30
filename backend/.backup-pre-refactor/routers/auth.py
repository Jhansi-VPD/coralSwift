"""Auth router — unified login for all six roles, session resolution, refresh."""
import hmac
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.core.rbac import ROLE_HOME
from app.core.security import (
    SessionUser,
    create_legacy_admin_token,
    get_session_user,
    resolve_supabase_user,
    verify_legacy_admin_token,
    client_ip,
)
from app.core.helpers import audit

# Simple in-memory login rate limit (5 / 15 min per IP).
# Swap for a Redis-backed limiter in multi-instance deployments.
_LOGIN_LIMIT = 5
_LOGIN_WINDOW = 15 * 60
_login_attempts: dict[str, list[float]] = {}

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["hr@coralswift.com"])
    password: str = Field(min_length=1, examples=["CoralSwift#2026"])


class LoginUser(BaseModel):
    id: str | None = None
    email: str
    role: str
    fullName: str | None = None


class LoginResponse(BaseModel):
    success: bool
    user: LoginUser
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int | None = None
    redirectTo: str


class MeResponse(BaseModel):
    authenticated: bool
    source: str
    user: LoginUser
    permissions: list[str]


def _rate_limited(ip: str) -> tuple[bool, float]:
    now = time.time()
    stamps = [t for t in _login_attempts.get(ip, []) if now - t < _LOGIN_WINDOW]
    _login_attempts[ip] = stamps
    if len(stamps) >= _LOGIN_LIMIT:
        oldest = stamps[0]
        return True, max(0.0, oldest + _LOGIN_WINDOW - now)
    stamps.append(now)
    return False, 0.0


@router.post("/login", response_model=LoginResponse, summary="Unified login (all roles)")
def login(body: LoginRequest, request: Request, response: Response):
    """Authenticate any role. Returns a bearer access token + the dashboard route."""
    ip = client_ip(request)
    limited, retry = _rate_limited(ip)
    if limited:
        response.headers["Retry-After"] = str(max(1, int(retry)))
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")

    # --- Path 1: Supabase Auth ---
    from app.core.clients import anon_client

    client = anon_client()
    if client:
        try:
            resp = client.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password,
            })
        except Exception:
            resp = None

        if resp and resp.session and resp.user:
            user = resolve_supabase_user(resp.session.access_token)
            if user is None:
                raise HTTPException(status_code=403, detail="Account is not provisioned or is deactivated. Contact your administrator.")
            audit("USER_LOGIN", "auth", user.id, None, {"email": user.email, "role": user.role, "method": "supabase_auth"}, ip)
            return LoginResponse(
                success=True,
                user=LoginUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
                accessToken=resp.session.access_token,
                expiresIn=resp.session.expires_in,
                redirectTo=ROLE_HOME.get(user.role, "/"),
            )

    # --- Path 2: legacy admin env credentials ---
    if (
        settings.admin_email
        and settings.admin_password
        and settings.admin_session_secret
        and hmac.compare_digest(body.email.lower(), settings.admin_email.strip().lower())
        and hmac.compare_digest(body.password, settings.admin_password)
    ):
        token = create_legacy_admin_token(settings.admin_email, settings.admin_session_secret)
        audit("USER_LOGIN", "auth", None, None, {"email": body.email, "role": "admin", "method": "legacy_env"}, ip)
        return LoginResponse(
            success=True,
            user=LoginUser(id="usr_admin", email=settings.admin_email, role="admin", fullName="Administrator"),
            accessToken=token,
            expiresIn=7 * 24 * 3600,
            redirectTo=ROLE_HOME["admin"],
        )

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/me", response_model=MeResponse, summary="Current session & permissions")
def me(user: SessionUser = Depends(get_session_user)):
    from app.core.rbac import ROLE_PERMISSIONS

    return MeResponse(
        authenticated=True,
        source="legacy_admin" if user.id == "usr_admin" else "supabase",
        user=LoginUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
        permissions=ROLE_PERMISSIONS.get(user.role, []),
    )


@router.post("/refresh", response_model=LoginResponse, summary="Refresh Supabase session")
def refresh(request: Request):
    """Exchange a Supabase refresh token for a fresh access token."""
    body = request.headers.get("x-refresh-token")
    if not body:
        raise HTTPException(status_code=400, detail="Missing x-refresh-token header")
    from app.core.clients import anon_client

    client = anon_client()
    if not client:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        resp = client.auth.refresh_session({"refresh_token": body})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if not resp or not resp.session:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = resolve_supabase_user(resp.session.access_token)
    if not user:
        raise HTTPException(status_code=403, detail="Account unavailable")
    return LoginResponse(
        success=True,
        user=LoginUser(id=user.id, email=user.email, role=user.role, fullName=user.full_name),
        accessToken=resp.session.access_token,
        expiresIn=resp.session.expires_in,
        redirectTo=ROLE_HOME.get(user.role, "/"),
    )


@router.post("/logout", summary="Logout (audit + client-side token discard)")
def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    user: SessionUser | None = None,
):
    """Supabase tokens are stateless JWTs; the client discards them. We audit the event."""
    if credentials:
        resolved = user or resolve_supabase_user(credentials.credentials)
        audit("USER_LOGOUT", "auth", resolved.id if resolved else None, None, ip=client_ip(request))
    return {"success": True}
