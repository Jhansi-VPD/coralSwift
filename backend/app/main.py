"""CoralSwift FastAPI backend — application entrypoint.

main.py stays minimal: app creation, middleware, exception handlers,
the central API router, and root-level health. Business logic lives in
services; table access lives in repositories.

Interactive docs: /docs (Swagger) · /redoc · /openapi.json
The root path ("/") serves a branded landing page (no JSON — browsers
opening http://localhost:PORT/ see the CoralSwift status page).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger

DESCRIPTION = """Complete backend for the CoralSwift enterprise platform.

Roles: **admin · hr · sales · manager · employee · qa · client**

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
- **tracking** — project tracking & updates workflow (employee/QA/manager → client)
- **announcements** — admin/HR broadcast posts with per-role targeting
- **exports** — CSV downloads for every table + .ics calendar / Google links
- **public** — website enquiry + job application intake
- **content** — services, jobs, case studies (marketing site)
- **notifications / dashboard** — shared v1 modules

### Conventions
Errors return `{ "success": false, "message": "...", "error_code": "..." }`
with proper status codes (400/401/403/404/409/413/415/422/429/500).
"""


_LANDING_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CoralSwift Backend — Running</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: #F8FAFC;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #0B1426;
    padding: 24px;
  }
  .glow {
    position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%);
    width: 620px; height: 360px; border-radius: 9999px;
    background: rgba(255, 107, 80, 0.10); filter: blur(130px); pointer-events: none;
  }
  .wrap { position: relative; width: 100%; max-width: 430px; }
  .brand { text-align: center; margin-bottom: 28px; }
  .wordmark { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
  .tagline {
    font-family: 'Consolas', monospace; font-size: 10px; font-weight: 700;
    letter-spacing: 0.3em; color: #64748B; margin-top: 4px;
  }
  .card {
    background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 24px;
    padding: 32px; box-shadow: 0 20px 50px -20px rgba(11, 20, 38, 0.18);
  }
  .status {
    display: flex; align-items: center; gap: 10px;
    background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D;
    border-radius: 14px; padding: 12px 14px; font-size: 13px; font-weight: 600;
  }
  .dot {
    width: 9px; height: 9px; border-radius: 9999px; background: #22C55E;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); animation: pulse 1.8s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
    70% { box-shadow: 0 0 0 9px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
  .meta {
    display: flex; justify-content: space-between; margin-top: 14px;
    font-family: 'Consolas', monospace; font-size: 11px; color: #64748B;
  }
  .meta b { color: #0B1426; font-weight: 700; }
  .actions { display: grid; gap: 10px; margin-top: 22px; }
  a.btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    text-decoration: none; font-size: 13.5px; font-weight: 700;
    padding: 13px 16px; border-radius: 14px; transition: transform .15s ease, box-shadow .15s ease;
  }
  a.btn:hover { transform: translateY(-1px); }
  .primary {
    background: linear-gradient(135deg, #FF6B50 0%, #9333EA 100%); color: #fff;
    box-shadow: 0 8px 20px -8px rgba(255, 107, 80, 0.65);
  }
  .secondary { background: #0B1426; color: #fff; }
  .ghost {
    background: #F8FAFC; color: #334155; border: 1px solid #E2E8F0; font-weight: 600;
  }
  .hint {
    margin-top: 18px; text-align: center; font-family: 'Consolas', monospace;
    font-size: 10.5px; color: #94A3B8; line-height: 1.7;
  }
  .hint code { background: #F1F5F9; padding: 1px 6px; border-radius: 6px; color: #475569; }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="wrap">
    <div class="brand">
      <svg width="84" height="64" viewBox="0 0 84 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CoralSwift mark">
        <defs>
          <linearGradient id="cg" x1="0" y1="64" x2="84" y2="0">
            <stop offset="0" stop-color="#FF6B50"/>
            <stop offset="1" stop-color="#E11D48"/>
          </linearGradient>
        </defs>
        <g stroke="url(#cg)" stroke-width="9" stroke-linecap="round" fill="none">
          <path d="M42 58 L42 22"/>
          <path d="M42 58 C 42 40, 28 34, 14 32"/>
          <path d="M42 58 C 42 40, 56 34, 70 32"/>
          <path d="M42 34 C 36 26, 30 22, 24 12"/>
          <path d="M42 34 C 48 26, 54 22, 60 12"/>
        </g>
      </svg>
      <div class="wordmark">CoralSwift</div>
      <div class="tagline">TECHNOLOGIES</div>
    </div>

    <div class="card">
      <div class="status"><span class="dot"></span> Backend is running</div>
      <div class="meta">
        <span>service <b>__APP_NAME__</b></span>
        <span>v<b>__VERSION__</b></span>
      </div>
      <div class="meta">
        <span>env <b>__ENVIRONMENT__</b></span>
        <span>port <b>__PORT__</b></span>
      </div>

      <div class="actions">
        <a class="btn primary" href="/docs">Open Swagger UI&nbsp;&rarr;</a>
        <a class="btn secondary" href="/redoc">ReDoc Documentation</a>
        <a class="btn ghost" href="/health/db">Database Health Check</a>
      </div>

      <div class="hint">
        Auth: <code>POST /api/auth/login</code> &middot; API base: <code>/api/v1</code><br/>
        Spec: <code>/openapi.json</code>
      </div>
    </div>
  </div>
</body>
</html>"""


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
        {"name": "tracking", "description": "Project tracking & updates workflow"},
        {"name": "announcements", "description": "Admin/HR broadcast announcements"},
        {"name": "exports", "description": "CSV exports + calendar sync"},
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
def root(request: Request):
    """Branded landing page: CoralSwift logo + running status + Swagger link."""
    # Show the port the browser actually reached (Host header), e.g. "localhost:8000".
    host_header = request.headers.get("host", "")
    port = host_header.rsplit(":", 1)[1] if ":" in host_header else str(settings.port or 8000)
    html = (
        _LANDING_TEMPLATE
        .replace("__APP_NAME__", settings.app_name)
        .replace("__VERSION__", app.version)
        .replace("__ENVIRONMENT__", settings.environment)
        .replace("__PORT__", port)
    )
    return HTMLResponse(content=html)


@app.get("/health", tags=["health"], summary="Liveness")
def root_health():
    from app.api.v1.health import health
    return health()


@app.get("/health/db", tags=["health"], summary="Readiness — Supabase connectivity")
def root_health_db():
    from app.api.v1.health import health_db
    return health_db()
