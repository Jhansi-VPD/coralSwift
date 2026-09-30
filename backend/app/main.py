"""CoralSwift FastAPI backend — application entrypoint.

main.py stays minimal: app creation, middleware, exception handlers,
the central API router, and root-level health. Business logic lives in
services; table access lives in repositories.

Interactive docs: /docs (Swagger) · /redoc · /openapi.json
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger

DESCRIPTION = """Complete backend for the CoralSwift enterprise platform.

Roles: **admin · hr · sales · manager · employee · client**

### Authentication
Send `Authorization: Bearer <token>` on every request. Obtain a token via
`POST /api/auth/login` (Supabase Auth per-user accounts; legacy admin env
credentials supported).

### API versions
- `/api/...` — original paths (fully supported; the frontend uses these)
- `/api/v1/...` — same controllers, versioned prefix (preferred for new clients)

### Modules
- **auth** — unified login, session resolution, refresh
- **admin** — org-wide KPIs, enquiries, applications, audit logs, settings
- **hr** — users, employees, departments, leave, attendance
- **sales** — leads, clients, proposals, contracts, analytics
- **manager** — projects, tasks, approvals, team, reviews
- **employee** — tasks, timesheets, leave, attendance, documents, profile
- **client** — org overview, project review, tickets, documents
- **public** — website enquiry + job application intake
- **content** — services, jobs, case studies (marketing site)
- **notifications / dashboard** — shared v1 modules

### Conventions
Errors return `{ "success": false, "message": "...", "error_code": "..." }`
with proper status codes (400/401/403/404/409/413/415/422/429/500).
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = get_logger("coralswift.main")
    logger.info("startup environment=%s docs=/docs", settings.environment)
    yield
    logger.info("shutdown")


app = FastAPI(
    title="CoralSwift Backend API",
    description=DESCRIPTION,
    version="2.1.0",
    openapi_tags=[
        {"name": "auth", "description": "Authentication & session (all roles)"},
        {"name": "admin", "description": "Organization-wide administration (admin)"},
        {"name": "hr", "description": "People operations (hr, admin)"},
        {"name": "sales", "description": "Revenue pipeline (sales, admin)"},
        {"name": "manager", "description": "Delivery & approvals (manager, admin)"},
        {"name": "employee", "description": "Self-service workspace (staff roles)"},
        {"name": "client", "description": "Client portal (client — org-scoped)"},
        {"name": "public", "description": "Public website intake (no auth, rate-limited)"},
        {"name": "content", "description": "Marketing site content APIs"},
        {"name": "notifications", "description": "Shared notification inbox (v1)"},
        {"name": "dashboard", "description": "Shell bootstrap aggregate (v1)"},
        {"name": "health", "description": "Service health"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

configure_logging(debug=settings.debug)
register_exception_handlers(app)

from app.middleware.setup import register_middleware  # noqa: E402

register_middleware(app)
app.include_router(api_router)


@app.get("/", include_in_schema=False)
def root():
    return {"service": settings.app_name, "docs": "/docs", "version": app.version}


@app.get("/health", tags=["health"], summary="Liveness")
def root_health():
    from app.api.v1.health import health
    return health()


@app.get("/health/db", tags=["health"], summary="Readiness — Supabase connectivity")
def root_health_db():
    from app.api.v1.health import health_db
    return health_db()
