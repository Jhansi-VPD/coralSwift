# CoralSwift — FastAPI Backend

The complete backend is a **standalone Python service** (FastAPI + Supabase) with interactive **Swagger UI**. The Next.js app under `frontend/` is a pure UI client — it hosts no API routes and talks to the FastAPI service over HTTP with `Authorization: Bearer <token>`.

## Layout

```
CoralSwift/
├── backend/                      # ← FastAPI service (Python)
│   ├── app/
│   │   ├── main.py               # FastAPI app: /docs, /redoc, /openapi.json, /health
│   │   ├── core/
│   │   │   ├── config.py         # pydantic-settings (.env)
│   │   │   ├── clients.py        # Supabase anon + service-role clients
│   │   │   ├── security.py       # Bearer auth, legacy admin HMAC, require_role
│   │   │   ├── rbac.py           # role → permission matrix + role home routes
│   │   │   └── helpers.py        # audit, notify, db error mapping
│   │   └── routers/              # auth, admin, hr, sales, manager, employee,
│   │                             # client, public, content
│   ├── requirements.txt
│   ├── run.py                    # uvicorn launcher (host/port from .env)
│   ├── seed_backend_users.py     # idempotent demo-data seeder
│   └── .env.example
├── supabase/                     # SQL migrations + all_migrations.sql (single paste)
└── frontend/                     # Next.js UI — no /api routes
```

## Architecture

```
Browser (Next.js UI, portal-client.ts / api.ts)
  └─ fetch(NEXT_PUBLIC_API_URL + /api/..., Authorization: Bearer <accessToken>)
       └─ FastAPI (uvicorn)
            ├─ require_role(...) dependency  → 401/403 enforcement per endpoint
            ├─ Supabase (service role server-side; anon for public reads)
            ├─ RLS (defense-in-depth, unchanged migrations)
            └─ audit_logs + notifications writes
```

## Interactive docs

| URL | Purpose |
|-----|---------|
| `/docs` | Swagger UI — try every endpoint in-browser (Authorize button top-right) |
| `/redoc` | ReDoc reference |
| `/openapi.json` | Machine-readable OpenAPI 3.1 spec |
| `/health` | Liveness + Supabase config status |

## Roles & Portals

| Role | Portal route | API namespace | Scope |
|------|-------------|---------------|-------|
| admin | `/admin` | `/api/admin`, `/api/content`, all | everything |
| hr | `/hr` | `/api/hr` | users, employees, departments, leave, attendance |
| sales | `/sales` | `/api/sales` | leads, clients, proposals, contracts, analytics |
| manager | `/manager` | `/api/manager` | projects, tasks, approvals (team), team, reviews |
| employee | `/employee` | `/api/employee` | own tasks, timesheets, leave, attendance, documents, profile |
| client | `/client` | `/api/client` | own org's projects, review, tickets, invoices, documents |

## Auth

- **Primary**: Supabase Auth. `POST /api/auth/login` → `{ success, user, accessToken, tokenType, expiresIn, redirectTo }`.
- The frontend stores `accessToken` in `localStorage['coralswift_admin_auth']` and sends `Authorization: Bearer` on every call ([api-base.ts](../frontend/src/lib/api-base.ts)).
- **Session check**: `GET /api/auth/me` → `{ authenticated, source, user, permissions }`. Every portal layout gates rendering on this.
- **Refresh**: `POST /api/auth/refresh` with `x-refresh-token` header.
- **Logout**: `POST /api/auth/logout` (audited; client discards token).
- **Legacy admin**: env credentials (`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`) still login via the same endpoint (HMAC token, 7-day TTL).
- Login is rate-limited 5 attempts / 15 min / IP; public forms 10 / 10 min / IP.

## Database

22 tables, migrations in [`supabase/migrations/`](../supabase/migrations/). People/HR/Sales/Delivery/Finance/Support/Shared groups plus `enquiry_status_history` and `project_updates`. Storage: `resumes` (applications) and `documents` (private, 10-minute signed URLs).

## API Surface (51 paths)

### Auth (`/api/auth`)
| Method | Path | Who | Purpose |
|--------|------|-----|---------|
| POST | `/login` | public | unified login → accessToken + redirectTo |
| GET | `/me` | any session | session + permissions |
| POST | `/refresh` | refresh token | new access token |
| POST | `/logout` | any session | audit + token discard |

### Admin (`/api/admin`, staff)
- `GET /stats` — org-wide KPIs
- `GET /enquiries` + `GET/PATCH/DELETE /enquiries/{id}` — assignment + state machine (accept auto-creates a qualified lead; history recorded)
- `GET /applications` + `PATCH /applications` + `DELETE /applications/{id}`
- `GET /audit-logs`
- `GET/PUT /settings` — site settings map
- `GET /me` — session echo

### HR (`/api/hr`)
- `GET/POST/PATCH /users`, `GET/POST/PATCH /employees`, `DELETE /employees/{id}` (soft exit)
- `GET/PATCH /leave` — approve/reject with balance deduction
- `GET /attendance`
- `GET/POST/PATCH /departments`, `DELETE /departments/{id}` (guarded)

### Sales (`/api/sales`)
- `GET/POST/PATCH/PUT /leads` — pipeline + lead→client-org conversion
- `GET/POST/PATCH /clients`, `GET/POST/PATCH /proposals`, `GET/POST/PATCH /contracts`
- `GET /analytics` — pipeline, win rate, proposal acceptance, revenue

### Manager (`/api/manager`)
- `GET/POST /projects`, `GET/PATCH /projects/{id}` — lifecycle incl. submit-for-review (notifies client contacts)
- `GET/POST/PATCH /tasks` — assign/notify
- `GET/POST /approvals` — unified timesheet + leave inbox
- `GET /team` — workload/capacity
- `GET/POST/PATCH /reviews` — share/acknowledge

### Employee (`/api/employee`)
- `GET/PATCH /tasks`, `GET/POST/PATCH /timesheets` (dup protection, approved immutable)
- `GET/POST /leave`, `DELETE /leave/{id}` (cancel pending)
- `GET/POST /attendance` (check-in/out, idempotent 409s)
- `GET/POST /documents` (3-scope visibility + signed URLs)
- `GET/PATCH /profile` (incl. `?view=directory`), `GET/PATCH /notifications`

### Client (`/api/client`)
- `GET /overview`, `GET/PATCH /projects/{id}` (accept / request changes with mandatory feedback)
- `GET/POST/PATCH /tickets` (internal staff notes never exposed)
- `GET/POST /documents`

### Public + Content
- `POST /api/enquiries/submit`, `POST /api/applications/submit` (multipart, type/size validated)
- `GET /api/services`, `GET /api/jobs`, `GET /api/case-studies` — public reads; `?mode=admin` requires a staff Bearer token and returns drafts too
- `POST/DELETE` variants under `/api/services|jobs|case-studies` (admin authored; deletes accept id **or** slug)

## Setup

```bash
# 1. Apply the database schema: open supabase/all_migrations.sql,
#    copy everything, paste into Supabase Dashboard → SQL Editor → Run.
#    (Individual ordered files: supabase/migrations/)

# 2. Environment
cd backend
cp .env.example .env          # fill SUPABASE_URL / keys / admin creds

# 3. Install (Windows)
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt

# 4. Seed demo users + baseline org data
.venv\Scripts\python seed_backend_users.py

# 5. Run
.venv\Scripts\python run.py   # http://localhost:8000 — Swagger at /docs
```

Frontend env ([frontend/.env.example](../frontend/.env.example)): set `NEXT_PUBLIC_API_URL=http://localhost:8000` (dev) or the deployed API origin (production).

Demo accounts (all password `CoralSwift#2026` — change immediately in production): see [CREDENTIALS.md](CREDENTIALS.md). The login page has one-click quick-fill for every role except admin.

## Security Model (3 layers)

1. **Endpoint dependencies** — `require_role()` on every protected route; `get_session_user` validates the Supabase JWT (via `auth.get_user`) or the legacy admin HMAC
2. **Row-level scoping in handlers** — manager project ownership, employee self-scoping, client org scoping before any mutation
3. **RLS** — database policies repeat every rule (migrations unchanged); service role used only server-side

## Workflow System (end-to-end)

```
Public form → enquiry (new)
  → admin assigns → assigned_to_sales (sales notified)
  → sales accepts (auto-creates qualified lead) / rejects (reason recorded)
  → manager plans project (milestones, tasks, members)
  → employees execute (tasks → timesheets → manager approval)
  → manager submits for client review (client contacts notified)
  → client accepts (completed) or requests changes (manager notified, resubmit loop)
  → admin dashboard finance visibility (invoiced / paid / outstanding)
```

Supporting flows: leave → manager/HR approval → balance deduction + notification; attendance check-in/out → HR visibility; reviews → employee acknowledgment. State trails: `enquiry_status_history`, `project_updates`, `projects.client_review_status`.

## Dashboards

All five role dashboards live in `frontend/src/app/{hr,sales,manager,employee,client}/` on the shared PortalShell design system, consuming the FastAPI endpoints through `portalClient`. The admin dashboard renders live data from `/api/admin/stats`.
