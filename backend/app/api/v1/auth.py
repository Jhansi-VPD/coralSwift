"""Auth endpoints — thin controllers over AuthService (wire format unchanged)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import SessionUser, client_ip, get_session_user
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


@router.post("/login", response_model=LoginResponse, summary="Unified login (all roles)")
async def login(body: LoginRequest, request: Request):
    return await auth_service.login(body.email, body.password, client_ip(request))


@router.get("/me", response_model=MeResponse, summary="Current session & permissions")
def me(user: SessionUser = Depends(get_session_user)):
    return auth_service.me(user)


@router.post("/refresh", response_model=LoginResponse, summary="Refresh Supabase session")
async def refresh(request: Request):
    token = request.headers.get("x-refresh-token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing x-refresh-token header")
    return await auth_service.refresh(token)


@router.post("/logout", summary="Logout (audit + client-side token discard)")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    await auth_service.logout(credentials.credentials if credentials else None, client_ip(request))
    return {"success": True}
