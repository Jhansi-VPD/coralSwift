"""Health endpoints (no secrets exposed)."""
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "environment": settings.environment,
    }


@router.get("/health/db", summary="Readiness — verifies Supabase connectivity")
def health_db():
    sb = None
    if settings.service_role_configured:
        from app.core.clients import service_client
        sb = service_client()
    if sb is None and settings.supabase_configured:
        from app.core.clients import anon_client
        sb = anon_client()
    if sb is None:
        return {"status": "degraded", "database": "not_configured"}
    try:
        sb.table("profiles").select("id", count="exact").limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "degraded", "database": "unreachable"}
