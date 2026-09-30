# @coralswift/backend

The complete CoralSwift backend, isolated in its own package.

```
backend/
├── src/
│   ├── api/                  # ALL route handlers (the source of truth)
│   │   ├── auth/             #   unified login/logout/me
│   │   ├── hr/               #   employees, departments, leave, attendance, users
│   │   ├── sales/            #   leads, clients, proposals, contracts, analytics
│   │   ├── manager/          #   projects, tasks, approvals, team, reviews
│   │   ├── employee/         #   tasks, timesheets, leave, profile, notifications
│   │   ├── client/           #   overview, tickets, documents
│   │   ├── admin/            #   legacy admin CRUD
│   │   ├── applications/     #   public job application intake (resume upload)
│   │   ├── enquiries/        #   public contact/consultation intake
│   │   ├── services|jobs|case-studies/  # legacy content APIs
│   │   └── ...
│   ├── lib/                  # server-only libraries
│   │   ├── rbac.ts           #   roles + permission matrix (single source of truth)
│   │   ├── auth-server.ts    #   session resolution, user provisioning
│   │   ├── api-helpers.ts    #   requireRole/requirePermission/audit/notify
│   │   ├── auth.ts           #   legacy HMAC session tokens
│   │   ├── rate-limit.ts     #   Upstash-backed limiters
│   │   └── supabase/         #   client.ts / server.ts / admin.ts clients
│   └── middleware.ts         # edge auth guard (synced into frontend)
├── supabase/                 # database
│   ├── migrations/           #   schema + RLS policies (4 migrations)
│   ├── seed.sql              #   marketing-site baseline data
│   └── README.md             #   DB setup guide
└── scripts/
    ├── sync-routes.mjs       #   syncs src/api → frontend route shims
    ├── seed_backend_users.js #   creates the 6 demo role users
    └── seed_supabase.js      #   legacy marketing data seeder
```

## How route serving works

Next.js can only serve route handlers from `frontend/src/app/api/**/route.ts`.
The handlers above are the **source of truth**; running `npm run sync`
generates one-line re-export shims into the frontend:

```ts
// frontend/src/app/api/hr/employees/route.ts  (generated — do not edit)
export { POST, GET, PATCH, DELETE, dynamic } from '@backend/api/hr/employees/route';
```

After changing any handler: `cd backend && npm run sync`, then restart the
frontend dev server.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run sync` | regenerate frontend route shims |
| `npm run typecheck` | typecheck the backend package |
| `npm run seed` | provision the 6 demo users + org data |
| `npm run seed:supabase` | seed marketing-site baseline data |

## Environment variables (frontend/.env.local)

See ../frontend/.env.example. Key additions for this package:
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional, prod rate limiting).
