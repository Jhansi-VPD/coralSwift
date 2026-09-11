# CoralSwift | Enterprise Software Services Web Application

**Stack**: Next.js 14 (App Router, TypeScript, Tailwind CSS, Lucide Icons) & Supabase (PostgreSQL, Supabase Auth, Row Level Security, Storage).

---

## 1. Architectural Highlights

- **Pure Next.js + Supabase Backend**: Fully integrated with Supabase PostgreSQL tables (`services`, `jobs`, `applications`, `case_studies`, `enquiries`, `site_settings`, `audit_logs`) and Row Level Security (RLS) policies.
- **Enterprise Modules**:
  - **Home**: Hero with animated system highlights, Core Software Services Grid, The CoralSwift Standard / Why CoralSwift, Verified Case Studies Showcase, and Enterprise Call to Action.
  - **About Us**: Mission, Vision, Core Values, Engineering Milestones, and Verified Leadership Principles.
  - **Services Catalogue & Dynamic Detail Pages (`/services/[slug]`)**: Complete architectural overview, specific capabilities checklist, 4-stage phased delivery framework, tangible deliverables, and prerequisite requirements.
  - **Careers & Job Board (`/careers/[id]`)**: Filterable job board, comprehensive role breakdown, compensation, and interactive candidate application modal with drag-and-drop resume attachment.
  - **Case Studies Showcase (`/case-studies/[slug]`)**: Client context, Challenge, Engineered Solution, Implementation details, and Verified Production Outcome Metrics (e.g. 42,000+ TPS, 99.999% uptime, <30s RTO).
  - **Contact Us (`/contact`)**: Multi-field enterprise consultation form with server-side validation, anti-abuse controls, consent capturing, and status pipeline tracking.
  - **Administration Portal (`/admin`)**:
    - Protected session authentication (Configurable via server environment variables).
    - Executive overview dashboard with live KPIs.
    - Services CRUD manager.
    - Careers & Candidate Applications review pipeline with resume tracking.
    - Case Studies & Portfolio manager.
    - Inbound Enquiries triage pipeline.
    - Site settings and public trust metrics manager.
    - Immutable security audit logs viewer.
  - **SEO & Compliance**: Dynamic XML sitemap (`/sitemap.xml`), robots.txt (`/robots.txt`), Privacy Policy, and Terms of Service.

---

## 2. Quick Start & Local Development

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password
```

> **Note**: The application includes a zero-config fallback layer pre-seeded with all baseline enterprise data, allowing immediate local development and verification even before Supabase keys are provided.

### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Supabase Database Setup

1. Open your project on [supabase.com](https://supabase.com).
2. Go to **SQL Editor** -> Create New Query.
3. Run `supabase/migrations/20260908000000_coralswift_schema.sql` to create all PostgreSQL tables, indexes, and RLS policies.
4. Run `supabase/seed.sql` to populate the initial baseline enterprise dataset.
5. Create storage buckets `resumes` (private) and `media` (public) under Supabase Storage.

---

## 4. Production Build Verification

```bash
npm run build
npm run start
```
