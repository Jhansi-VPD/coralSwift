# CoralSwift Supabase Database & Backend Setup Guide

CoralSwift uses **Supabase** (PostgreSQL, Supabase Auth, Row Level Security, and Supabase Storage) to power all dynamic content, career applications, and contact enquiries.

---

## 1. Supabase Project Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/migrations/20260908000000_coralswift_schema.sql` and run the script to create:
   - `services` table
   - `jobs` table
   - `applications` table
   - `case_studies` table
   - `enquiries` table
   - `site_settings` table
   - `audit_logs` table
   - RLS security policies & Storage buckets (`resumes`, `media`).
4. Next, open `supabase/seed.sql` and run the script in SQL Editor to populate the initial baseline enterprise data.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials (found under Project Settings -> API in Supabase):

```env
# Public Supabase API (Client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Private Supabase Service Role Key (Server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Default Credentials for initial dashboard access
NEXT_PUBLIC_ADMIN_EMAIL=admin@coralswift.com
NEXT_PUBLIC_ADMIN_PASSWORD=CoralAdmin2026!
```

---

## 3. Storage Buckets

Under **Storage** in Supabase:
- `resumes`: Private bucket for candidate CV / resume documents.
- `media`: Public bucket for case study images and service graphics.

---

## 4. Immediate Local Development & Preview

The application includes an integrated **Zero-Config Fallback Layer**: if `NEXT_PUBLIC_SUPABASE_URL` is not yet configured, the app automatically serves all baseline enterprise services, case studies, jobs, and allows form submissions seamlessly in local memory with real-time UI responses!
