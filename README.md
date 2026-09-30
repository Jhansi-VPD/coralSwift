# CoralSwift - Enterprise Software Architecture & Engineering Platform

Officially Partnered by **VPD Technologies**.

## Project Structure

```
coralswift/
├── frontend/             # Next.js 14 Web Application & Executive Admin Portal
│   ├── src/
│   │   ├── app/          # App Router (Pages, Layouts, Admin Portal)
│   │   ├── components/   # UI Components, Sections, Modals
│   │   ├── lib/          # API & Supabase Client Integration
│   │   └── types/        # TypeScript Interfaces & Models
│   ├── public/           # Static Assets & Logos
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── supabase/             # Database Architecture & Infrastructure
    ├── migrations/       # PostgreSQL Migrations & RLS Policies
    └── seed.sql          # Enterprise Baseline Dataset
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend application runs on `http://localhost:3000` (or next available port like `3001`).

### Portal Logins
Every role has its own login page (same password for demo accounts — see `docs/CREDENTIALS.md`):
- Admin: `http://localhost:3000/admin/login`
- HR: `http://localhost:3000/hr/login`
- Sales: `http://localhost:3000/sales/login`
- Manager: `http://localhost:3000/manager/login`
- Employee: `http://localhost:3000/employee/login`
- Client: `http://localhost:3000/client/login`

### Database & Supabase
- Migrations: `supabase/migrations/`
- Seed data: `supabase/seed.sql`

### Documentation
- [`docs/BACKEND.md`](docs/BACKEND.md) — FastAPI backend architecture, API surface, and setup
- [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md) — demo account credentials (dev/testing only)
- [`docs/ISSUES_REPORT.md`](docs/ISSUES_REPORT.md) — known issues and findings
- [`backend/README.md`](backend/README.md) · [`frontend/README.md`](frontend/README.md) · [`supabase/README.md`](supabase/README.md)