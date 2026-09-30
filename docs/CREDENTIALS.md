# CoralSwift — Demo Credentials

> ⚠️ **Demo/testing only.** These accounts are created by `backend/seed_backend_users.py`
> for local development and QA. Before any production deployment: rotate every password,
> or delete the demo rows, and disable the quick-fill panel in the login page.

## Application Login

All roles sign in at one place: **`/admin/login`** (unified login — the app routes each role to its own dashboard automatically).

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@coralswift.com` | `CoralSwift#2026` |
| HR | `hr@coralswift.com` | `CoralSwift#2026` |
| Sales | `sales@coralswift.com` | `CoralSwift#2026` |
| Manager | `manager@coralswift.com` | `CoralSwift#2026` |
| Employee | `employee@coralswift.com` | `CoralSwift#2026` |
| Client | `client@clientco.com` | `CoralSwift#2026` |

The login page also shows one-click quick-fill buttons for every role **except admin** (HR, Sales, Manager, Employee, Client).

## Where each role lands

| Role | Dashboard route | Portal |
|------|----------------|--------|
| Admin | `/admin` | Administration Suite (existing) |
| HR | `/hr` | People Operations |
| Sales | `/sales` | Revenue Suite |
| Manager | `/manager` | Delivery Command |
| Employee | `/employee` | My Workspace |
| Client | `/client` | Client Portal |

## Seeded relationships (for realistic demos)

| Relationship | Detail |
|--------------|--------|
| Manager → Employee | Evan Employee (`employee@coralswift.com`) reports to Mira Manager (`manager@coralswift.com`) |
| Department | Both belong to **Engineering** |
| Client org | Clara Client belongs to **ClientCo Industries** (owner: Sam Sales) |
| Project | **CCP-01 — ClientCo Payments Platform**, managed by Mira, with Evan as member and 3 milestones |

## Quick demo flow to try

1. Sign in as **Employee** → Check in → Log time on CCP-01 → Apply for leave
2. Sign in as **Manager** → Approve the timesheet + leave in *Approvals* → Open *CCP-01* → Submit for Client Review
3. Sign in as **Client** → Open *ClientCo Payments Platform* → **Accept Delivery** (or Request Changes)
4. Sign in as **Sales** → See pipeline/analytics; as **HR** → see attendance and leave records
5. Sign in as **Admin** → `/admin` shows live org-wide KPIs

## Environment variables referenced by logins

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` (frontend) | FastAPI backend origin (`http://localhost:8000` in dev) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (backend/.env) | Supabase project (all demo users live in Supabase Auth) |
| `SUPABASE_SERVICE_ROLE_KEY` (backend/.env) | User provisioning + privileged server reads |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` (backend/.env) | Legacy admin fallback (optional; Supabase admin takes precedence) |
| `ADMIN_SESSION_SECRET` (backend/.env) | Legacy HMAC token signing |

## Re-seeding

```bash
cd backend
.venv\Scripts\python seed_backend_users.py   # Windows (`.venv/bin/python` on macOS/Linux)
# idempotent — safe to re-run; skips existing users
```
