# CoralSwift Backend — FastAPI + Supabase (production architecture)

Standalone Python API for the CoralSwift enterprise platform. Swagger UI at **`/docs`**.

```
backend/
├── app/
│   ├── main.py                  # app creation, middleware, handlers, router (thin)
│   ├── api/
│   │   ├── router.py            # central router: /api + /api/v1 mounts
│   │   └── v1/                  # auth (service-backed), health, notifications, dashboard
│   ├── core/
│   │   ├── config.py            # pydantic-settings (.env)
│   │   ├── security.py          # Bearer auth, legacy admin HMAC, require_role
│   │   ├── permissions.py       # permission catalog + role matrix (RBAC source of truth)
│   │   ├── exceptions.py        # AppError hierarchy + global handlers (error envelope)
│   │   ├── logging.py           # structured logs + request middleware
│   │   ├── rate_limit.py        # sliding-window limiter (login, public forms)
│   │   ├── constants.py         # domain enums mirroring DB CHECK constraints
│   │   ├── clients.py           # Supabase anon/service clients (ClientOptions)
│   │   └── helpers.py           # legacy re-exports (audit/notify → services)
│   ├── routers/                 # domain controllers (thin; mounted at /api AND /api/v1)
│   ├── schemas/                 # pydantic request/response models
│   ├── services/                # business logic (auth, audit, notifications, employee ctx)
│   ├── repositories/            # table access; postgrest-2.31 write semantics live here
│   ├── dependencies/            # pagination + auth re-exports
│   └── middleware/              # CORS, security headers, request logging
├── scripts/
│   ├── seed.py                  # demo data (idempotent)
│   └── create_admin.py          # create/promote an admin
├── tests/                       # pytest: api/ + unit/ (offline, dependency-overridden)
├── supabase/                    # SQL migrations + all_migrations.sql (single paste)
├── requirements.txt             # pinned
├── Dockerfile · docker-compose.yml
└── .env.example
```

**Layering:** `API (thin) → Service → Repository → Supabase`.
Legacy `routers/` keep their validated business logic (rewritten where the
postgrest 2.31 write semantics required it) and are exposed at both
`/api/...` and `/api/v1/...` — the frontend contract is untouched.

## Run (Windows)

```bat
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env          :: fill SUPABASE_URL / keys
.venv\Scripts\python scripts\seed.py     (or root seed_backend_users.py)
.venv\Scripts\python -m uvicorn app.main:app --reload
```

- App: http://localhost:8000 · Swagger: http://localhost:8000/docs · ReDoc: /redoc
- Health: `/health` (liveness) · `/health/db` (readiness, verifies Supabase)
- Port busy? `set PORT=8001` then match `NEXT_PUBLIC_API_URL=http://localhost:8001` in the frontend.

## API versions

| Base | Purpose |
|------|---------|
| `/api/...` | original paths — the live frontend consumes these |
| `/api/v1/...` | same controllers, versioned; plus `/api/v1/notifications`, `/api/v1/dashboard/me`, `/api/v1/health/db` |

Errors always return `{ "success": false, "message": "...", "error_code": "..." }`.

## Auth & RBAC

- `POST /api/auth/login` → `{ success, user, accessToken, tokenType, expiresIn, redirectTo }` (rate-limited 5/15min/IP)
- `Authorization: Bearer <token>` on every protected call; `GET /api/auth/me` returns session + permissions
- Roles: admin · hr · sales · manager · employee · client — matrix in `app/core/permissions.py`
- Coarse gates: `Depends(require_role("manager", ...))`; fine-grained: `Depends(require_permission("employees.write"))`

## Tests

```bat
.venv\Scripts\python -m pytest tests -q
```

24 tests: health/docs, error envelope, auth (validation, invalid credentials,
token-gating, v1 parity), RBAC matrix (allowed/denied per role, admin
superuser, 403 envelope), rate limiter units, permission invariants.
All offline — no test touches the real database.

## Docker

```bash
docker compose up --build
```

Non-root container, pinned deps, `/health` healthcheck, env from `.env`.
Never bake secrets into the image.

## Database

Migrations in `supabase/migrations/` (apply in order) or paste the combined
`supabase/all_migrations.sql` into the Supabase SQL Editor. The 22-table schema
is unchanged by this refactor; `Alembic` is deferred until a direct-Postgres
connection (`DATABASE_URL`) is actually introduced.
