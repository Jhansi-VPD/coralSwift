"""CoralSwift FastAPI backend — application entrypoint.

Swagger UI:  /docs      (interactive, try-it-out)
ReDoc:       /redoc
OpenAPI JSON: /openapi.json
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="CoralSwift Backend API",
    description=(
        "Complete backend for the CoralSwift enterprise platform.\n\n"
        "Roles: **admin · hr · sales · manager · employee · client**\n\n"
        "### Authentication\n"
        "Send `Authorization: Bearer <token>` on every request. Obtain a token via\n"
        "`POST /api/auth/login` (Supabase Auth per-user accounts; legacy admin env\n"
        "credentials supported).\n\n"
        "### Modules\n"
        "- **auth** — unified login, session resolution, refresh\n"
        "- **admin** — org-wide KPIs, enquiries, applications, audit logs, settings\n"
        "- **hr** — users, employees, departments, leave, attendance\n"
        "- **sales** — leads, clients, proposals, contracts, analytics\n"
        "- **manager** — projects, tasks, approvals, team, reviews\n"
        "- **employee** — tasks, timesheets, leave, attendance, documents, profile\n"
        "- **client** — org overview, project review, tickets, documents\n"
        "- **public** — website enquiry + job application intake\n"
        "- **content** — services, jobs, case studies (marketing site)\n\n"
        "### Conventions\n"
        "Errors return `{ \"detail\": \"...\" }` with proper status codes\n"
        "(400/401/403/404/409/413/415/422/429/500)."
    ),
    version="2.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Authentication & session (all roles)"},
        {"name": "admin", "description": "Organization-wide administration (admin)"},
        {"name": "hr", "description": "People operations (hr, admin)"},
        {"name": "sales", "description": "Revenue pipeline (sales, admin)"},
        {"name": "manager", "description": "Delivery & approvals (manager, admin)"},
        {"name": "employee", "description": "Self-service workspace (employee+ staff roles)"},
        {"name": "client", "description": "Client portal (client — org-scoped)"},
        {"name": "public", "description": "Public website intake (no auth, rate-limited)"},
        {"name": "content", "description": "Marketing site content APIs"},
        {"name": "health", "description": "Service health"},
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers define their own /api/<module> prefix — mount without an extra one.
from app.routers import auth, admin, hr, sales, manager, employee, client, public, content  # noqa: E402

for router in (
    auth.router,
    admin.router,
    hr.router,
    sales.router,
    manager.router,
    employee.router,
    client.router,
    public.router,
    content.router,
):
    app.include_router(router)


@app.get("/", tags=["health"], include_in_schema=False)
def root():
    return {"service": "coralswift-backend", "docs": "/docs", "version": "2.0.0"}


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "supabase_configured": settings.supabase_configured,
        "service_role_configured": settings.service_role_configured,
    }
