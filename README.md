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

### Admin Portal
- URL: `http://localhost:3000/admin/login`
- Email: `admin@coralswift.com`
- Password: `CoralAdmin2026!`

### Database & Supabase
- Migrations: `supabase/migrations/`
- Seed data: `supabase/seed.sql`
