# CoralSwift — Demo Credentials

> ⚠️ **Demo/testing only.** These accounts are created by `backend/seed_backend_users.py`
> for local development and QA. Before any production deployment: rotate every password,
> or delete the demo rows.

## Application Login

Every role has its own login page. Sign in at the portal for your role:

| Role | Login URL |
|------|-----------|
| Admin | `/admin/login` |
| HR | `/hr/login` |
| Sales | `/sales/login` |
| Manager | `/manager/login` |
| Employee | `/employee/login` |
| QA | `/qa/login` |
| Client | `/client/login` |

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@coralswift.com` | `CoralSwift#2026` |
| HR | `hr@coralswift.com` | `CoralSwift#2026` |
| Sales | `sales@coralswift.com` | `CoralSwift#2026` |
| Manager | `manager@coralswift.com` | `CoralSwift#2026` |
| Employee | `employee@coralswift.com` | `CoralSwift#2026` |
| QA | `qa@coralswift.com` | `CoralSwift#2026` |
| Client | `client@clientco.com` | `CoralSwift#2026` |

Visiting a portal URL while signed out redirects to that portal's login page. There is no demo quick-fill — credentials must be entered manually.

## Where each role lands

| Role | Dashboard route | Portal |
|------|----------------|--------|
| Admin | `/admin` | Administration Suite (existing) |
| HR | `/hr` | People Operations |
| Sales | `/sales` | Revenue Suite |
| Manager | `/manager` | Delivery Command |
| Employee | `/employee` | My Workspace |
| QA | `/qa` | Quality Assurance |
| Client | `/client` | Client Portal |

## Seeded relationships (for realistic demos)

| Relationship | Detail |
|--------------|--------|
| Manager → Employee | Evan Employee (`employee@coralswift.com`) reports to Mira Manager (`manager@coralswift.com`) |
| Department | Both belong to **Engineering** |
| Client org | Clara Client belongs to **ClientCo Industries** (owner: Sam Sales) |
| Project | **CCP-01 — ClientCo Payments Platform**, managed by Mira, with Evan (member), Quinn QA (`qa@coralswift.com`, EMP-003, project QA), and 3 milestones |

## Quick demo flow to try

1. Sign in as **Employee** → Check in → Log time on CCP-01 → Apply for leave → post a progress update in *Tracking*
2. Sign in as **QA** → Open *QA Reviews* → post a review note to the manager or directly to Evan
3. Sign in as **Manager** → Approve timesheet + leave in *Approvals* → review team updates in *Tracking Inbox* → publish a client update from the project
4. Sign in as **Client** → Open *ClientCo Payments Platform* → read the manager's updates → **Accept Delivery** (or Request Changes)
5. Sign in as **Sales** → drag leads across the *Pipeline* board → *Calendar* → Export .ics / Google Calendar links
6. Sign in as **HR** → approve leave (employee gets in-app + email when SMTP configured) → CSV exports on Attendance/Leave/Employees
7. Sign in as **Admin** → `/admin` charts + `/admin/tracking` full workflow audit + `/admin/announcements` broadcast composer

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
