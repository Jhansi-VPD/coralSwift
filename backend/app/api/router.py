"""Central API router.

Compatibility strategy (frontend keeps working — spec rule #32):
  - legacy routers declare versionless prefixes (e.g. /auth, /admin) and are
    mounted at BOTH /api and /api/v1, so /api/auth/login and
    /api/v1/auth/login hit the same controller.
  - v1-native modules (health, notifications, dashboard) exist only on v1.
"""
from fastapi import APIRouter

from app.api.v1 import auth as v1_auth
from app.api.v1 import dashboard as v1_dashboard
from app.api.v1 import health as v1_health
from app.api.v1 import notifications as v1_notifications
from app.routers import admin, announcements, auth, client, content, employee, exports, hr, manager, project_updates, public, sales

LEGACY_MODULES = (auth, admin, announcements, client, content, employee, exports, hr, manager, project_updates, public, sales)

api_router = APIRouter()

# ---- original /api paths (byte-for-byte compatible with the live frontend) ----
legacy = APIRouter()
for module in LEGACY_MODULES:
    legacy.include_router(module.router)
api_router.include_router(legacy, prefix="/api")

# ---- versioned /api/v1 paths (same controllers + v1-only modules) -------------
v1 = APIRouter()
v1.include_router(v1_auth.router)          # /auth (controller parity with legacy auth)
v1.include_router(v1_health.router)        # /health, /health/db
v1.include_router(v1_notifications.router) # /notifications
v1.include_router(v1_dashboard.router)     # /dashboard


def _v1_id_factory(module_name: str):
    return lambda route: f"v1_{module_name}_{route.name}"


for module in LEGACY_MODULES:
    v1.include_router(module.router, generate_unique_id_function=_v1_id_factory(module.__name__))
api_router.include_router(v1, prefix="/api/v1")
