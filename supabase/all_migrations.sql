
-- ============================================================
-- FILE: 20260908000000_coralswift_schema.sql
-- ============================================================
-- CORALSWIFT ENTERPRISE DATABASE SCHEMA
-- PostgreSQL schema for Supabase
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Services Catalogue Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    short_description TEXT NOT NULL,
    overview TEXT NOT NULL,
    capabilities JSONB DEFAULT '[]'::jsonb,
    approach JSONB DEFAULT '[]'::jsonb,
    requirements TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    cta_text VARCHAR(255) DEFAULT 'Discuss Your Architecture',
    icon VARCHAR(100) DEFAULT 'Cpu',
    order_index INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'published',
    meta_title VARCHAR(255),
    meta_description TEXT,
    canonical_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for services
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services (slug);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services (status);
CREATE INDEX IF NOT EXISTS idx_services_order ON public.services (order_index);

-- 2. Careers / Job Openings Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    location VARCHAR(255) NOT NULL DEFAULT 'San Francisco, CA / Remote',
    work_model VARCHAR(50) NOT NULL DEFAULT 'Hybrid',
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
    experience_level VARCHAR(100) NOT NULL DEFAULT 'Senior (5+ yrs)',
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    salary_range VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs (slug);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);

-- 3. Job Candidate Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    portfolio_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    cover_note TEXT,
    resume_path VARCHAR(500) NOT NULL,
    resume_filename VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for applications
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications (email);

-- 4. Case Studies / Portfolio Table
CREATE TABLE IF NOT EXISTS public.case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    project_context TEXT NOT NULL,
    challenge TEXT NOT NULL,
    solution TEXT NOT NULL,
    implementation TEXT NOT NULL,
    outcome_metrics JSONB DEFAULT '[]'::jsonb,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    related_service_slug VARCHAR(255),
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'published',
    hero_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for case studies
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON public.case_studies (slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_status ON public.case_studies (status);
CREATE INDEX IF NOT EXISTS idx_case_studies_featured ON public.case_studies (is_featured);

-- 5. Contact Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_interest VARCHAR(255),
    message TEXT NOT NULL,
    consent BOOLEAN DEFAULT true NOT NULL,
    source_page VARCHAR(255) DEFAULT '/contact',
    status VARCHAR(50) DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON public.enquiries (email);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries (created_at DESC);

-- 6. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read on published services" ON public.services 
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public read on active jobs" ON public.jobs 
    FOR SELECT USING (status = 'active');

CREATE POLICY "Allow public read on published case studies" ON public.case_studies 
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow public read on site settings" ON public.site_settings 
    FOR SELECT USING (true);

-- Public Insert Policies (Contact form & Job Application submission)
CREATE POLICY "Allow public insert on enquiries" ON public.enquiries 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on applications" ON public.applications 
    FOR INSERT WITH CHECK (true);

-- Admin Full Access Policies (authenticated users)
CREATE POLICY "Admin full access on services" ON public.services 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on jobs" ON public.jobs 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on applications" ON public.applications 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on case studies" ON public.case_studies 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on enquiries" ON public.enquiries 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on site settings" ON public.site_settings 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on audit logs" ON public.audit_logs 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STORAGE BUCKETS CONFIGURATION (SQL helper)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false), ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FILE: 20260917000000_secure_rls_policies.sql
-- ============================================================
-- ==============================================================================
-- CORALSWIFT ENTERPRISE - SECURE ROW LEVEL SECURITY POLICIES
-- Replaces the permissive enable_admin_access.sql
-- Run this INSTEAD OF enable_admin_access.sql
-- ==============================================================================
--
-- ARCHITECTURE NOTE:
-- This application uses a custom HMAC session (coralswift_admin_session cookie)
-- for admin authentication. Admin CRUD operations use the Supabase service-role
-- key (createAdminClient()), which bypasses RLS entirely.
--
-- Admin mutation authorization is handled by Next.js middleware at the HTTP
-- level, not by RLS. RLS serves as database-level defense-in-depth against
-- anonymous modification of admin-managed content.
--
-- After applying this migration:
--   - Anonymous users can read published/active content (public SELECT)
--   - Anonymous users can submit enquiries and applications (public INSERT)
--   - Anonymous users CANNOT mutate admin-managed content (no anon mutation policies)
--   - Admin CRUD uses service-role key (createAdminClient) which bypasses RLS
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('services','jobs','applications','case_studies','enquiries','site_settings','audit_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- PUBLIC READ POLICIES (anon can read published/active content)
-- ==============================================================================

CREATE POLICY "Public read published services"
  ON public.services FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read active jobs"
  ON public.jobs FOR SELECT
  USING (status = 'active');

CREATE POLICY "Public read published case studies"
  ON public.case_studies FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- ==============================================================================
-- PUBLIC INSERT POLICIES (contact form + job applications)
-- ==============================================================================

CREATE POLICY "Public insert enquiries"
  ON public.enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

-- ==============================================================================
-- NO ANONYMOUS MUTATION POLICIES
--
-- The anon role has NO INSERT/UPDATE/DELETE policies on admin-managed content.
-- This means:
--   - Direct anonymous Supabase requests CANNOT mutate services, jobs,
--     case_studies, applications, enquiries, site_settings, or audit_logs
--   - Admin CRUD uses createAdminClient() (service-role key) which bypasses RLS
--   - RLS provides defense-in-depth against anonymous modification
--
-- This is intentional: RLS provides database-level defense against anonymous
-- modification. Admin authorization is handled by Next.js middleware.
-- ==============================================================================

-- ==============================================================================
-- SERVICE ROLE BYPASS
--
-- The service_role key bypasses RLS entirely in Supabase. No explicit policies
-- are needed for service_role — it already has full access to all tables.
-- Admin CRUD should use createAdminClient() (service-role key) for mutations.
-- ==============================================================================

-- ============================================================
-- FILE: 20260929000000_org_backend_schema.sql
-- ============================================================
-- ==============================================================================
-- CORALSWIFT ERP BACKEND — ORGANIZATION SCHEMA
-- Migration: 20260929000000_org_backend_schema.sql
-- Adds per-user auth, HR, Sales, Manager, Employee, Client domain tables.
-- Run AFTER 20260908000000_coralswift_schema.sql and 20260917000000_secure_rls_policies.sql
-- ==============================================================================

-- ==============================================================================
-- 1. PROFILES — one row per auth user, carries the RBAC role
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(50) NOT NULL DEFAULT 'employee'
        CHECK (role IN ('admin','hr','sales','manager','employee','client')),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ==============================================================================
-- 2. HR DOMAIN
-- ==============================================================================

-- 2a. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    head_of_department UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2b. Employee records (1:1 with profiles for staff roles)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    manager_id UUID REFERENCES public.employees(id),
    designation VARCHAR(150) NOT NULL DEFAULT '',
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-time'
        CHECK (employment_type IN ('Full-time','Part-time','Contract','Intern')),
    work_model VARCHAR(50) NOT NULL DEFAULT 'Hybrid'
        CHECK (work_model IN ('Remote','Hybrid','Onsite')),
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (status IN ('onboarding','active','on_leave','notice_period','exited')),
    annual_leave_balance INTEGER NOT NULL DEFAULT 20,
    salary_band VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees (manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees (department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees (status);

-- 2c. Leave requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'annual'
        CHECK (leave_type IN ('annual','sick','unpaid','maternity','paternity')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','cancelled')),
    reviewer_id UUID REFERENCES public.employees(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_employee ON public.leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests (status);

-- 2d. Attendance (daily check-in records)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'present'
        CHECK (status IN ('present','remote','absent','leave','holiday')),
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (work_date);

-- ==============================================================================
-- 3. SALES DOMAIN
-- ==============================================================================

-- 3a. Client organizations
CREATE TABLE IF NOT EXISTS public.client_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(150),
    website VARCHAR(255),
    address VARCHAR(500),
    account_owner_id UUID REFERENCES public.profiles(id), -- sales user
    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (status IN ('prospect','active','churned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3b. Client contacts (client-portal users belong to an organization)
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_org ON public.client_contacts (organization_id);

-- 3c. Leads — grown from the marketing enquiries pipeline
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    service_interest VARCHAR(255),
    source VARCHAR(100) DEFAULT 'website',
    estimated_value NUMERIC(14,2),
    stage VARCHAR(50) NOT NULL DEFAULT 'new'
        CHECK (stage IN ('new','contacted','qualified','proposal_sent','won','lost')),
    loss_reason VARCHAR(255),
    owner_id UUID REFERENCES public.profiles(id), -- sales user
    converted_client_org_id UUID REFERENCES public.client_organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads (owner_id);

-- 3d. Lead activity notes
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities (lead_id);

-- 3e. Proposals
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.client_organizations(id),
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    valid_until DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','sent','accepted','declined','expired')),
    sent_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals (status);

-- 3f. Proposal line items
CREATE TABLE IF NOT EXISTS public.proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal ON public.proposal_items (proposal_id);

-- 3g. Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id),
    title VARCHAR(255) NOT NULL,
    engagement_type VARCHAR(50) NOT NULL DEFAULT 'project'
        CHECK (engagement_type IN ('project','retainer','staff_augmentation','support')),
    start_date DATE,
    end_date DATE,
    contract_value NUMERIC(14,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft','active','expired','terminated')),
    document_path VARCHAR(500),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contracts_org ON public.contracts (organization_id);

-- ==============================================================================
-- 4. DELIVERY DOMAIN (Manager + Employee + Client shared)
-- ==============================================================================

-- 4a. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    organization_id UUID REFERENCES public.client_organizations(id),
    contract_id UUID REFERENCES public.contracts(id),
    manager_id UUID REFERENCES public.employees(id),
    status VARCHAR(50) NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
    health VARCHAR(50) NOT NULL DEFAULT 'on_track'
        CHECK (health IN ('on_track','at_risk','critical')),
    start_date DATE,
    target_end_date DATE,
    budget NUMERIC(14,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects (organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects (manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);

-- 4b. Project membership (which employees work on which projects)
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    allocation_percent INTEGER NOT NULL DEFAULT 100
        CHECK (allocation_percent BETWEEN 0 AND 100),
    role_on_project VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (project_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_employee ON public.project_members (employee_id);

-- 4c. Milestones (client-visible)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','in_progress','completed','at_risk')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones (project_id);

-- 4d. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES public.employees(id),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low','medium','high','urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo','in_progress','in_review','blocked','done')),
    estimated_hours NUMERIC(6,2),
    due_date DATE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);

-- 4e. Timesheets (weekly sheet with daily hour entries)
CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    notes VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('draft','pending','approved','rejected')),
    reviewer_id UUID REFERENCES public.employees(id),
    reviewed_at TIMESTAMPTZ,
    review_notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_timesheets_employee ON public.timesheets (employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON public.timesheets (status);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON public.timesheets (work_date);

-- ==============================================================================
-- 5. FINANCE DOMAIN (Client-visible invoices)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id),
    contract_id UUID REFERENCES public.contracts(id),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices (organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);

-- ==============================================================================
-- 6. CLIENT SUPPORT DOMAIN
-- ==============================================================================

-- 6a. Support tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id),
    raised_by UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low','medium','high','urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','in_progress','resolved','closed')),
    assigned_employee_id UUID REFERENCES public.employees(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tickets_org ON public.tickets (organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);

-- 6b. Ticket messages (threaded conversation)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- internal notes hidden from clients
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages (ticket_id);

-- ==============================================================================
-- 7. DOCUMENTS (client-visible deliverables + internal HR docs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'deliverable'
        CHECK (category IN ('deliverable','contract','report','hr_record','agreement')),
    organization_id UUID REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(150),
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents (organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON public.documents (employee_id);

-- ==============================================================================
-- 8. PERFORMANCE REVIEWS (Manager)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.employees(id),
    cycle_name VARCHAR(150) NOT NULL, -- e.g. 'H1 2026'
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    strengths TEXT,
    improvements TEXT,
    goals TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','shared','acknowledged')),
    employee_comment TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_employee ON public.performance_reviews (employee_id);

-- ==============================================================================
-- 9. NOTIFICATIONS (cross-role inbox)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (category IN ('general','task','timesheet','leave','ticket','invoice','review','project')),
    link VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read);

-- ==============================================================================
-- 10. TRIGGERS — keep updated_at fresh; sync emails from auth.users
-- ==============================================================================

-- updated_at touch trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_touch ON public.profiles;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_employees_touch ON public.employees;
CREATE TRIGGER trg_employees_touch BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_projects_touch ON public.projects;
CREATE TRIGGER trg_projects_touch BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_leads_touch ON public.leads;
CREATE TRIGGER trg_leads_touch BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_proposals_touch ON public.proposals;
CREATE TRIGGER trg_proposals_touch BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_contracts_touch ON public.contracts;
CREATE TRIGGER trg_contracts_touch BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_touch ON public.invoices;
CREATE TRIGGER trg_invoices_touch BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_touch ON public.tickets;
CREATE TRIGGER trg_tickets_touch BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_touch ON public.tasks;
CREATE TRIGGER trg_tasks_touch BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_timesheets_touch ON public.timesheets;
CREATE TRIGGER trg_timesheets_touch BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create a profile row whenever a Supabase Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 11. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('documents', 'documents', false),
  ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FILE: 20260929010000_org_rbac_rls_policies.sql
-- ============================================================
-- ==============================================================================
-- CORALSWIFT ERP BACKEND — ROLE-BASED RLS POLICIES
-- Migration: 20260929010000_org_rbac_rls_policies.sql
-- Defense-in-depth: database-level authorization per role.
-- (API routes enforce the same rules; RLS is the second line of defense.)
-- ==============================================================================

-- ==============================================================================
-- 1. ROLE HELPER FUNCTIONS (SECURITY DEFINER, STABLE, no leaking)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS VARCHAR LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr','sales','manager','employee'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr'));
$$;

CREATE OR REPLACE FUNCTION public.is_sales_or_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','sales'));
$$;

CREATE OR REPLACE FUNCTION public.my_employee_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.employees WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_organization_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.client_contacts WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.manages_employee(target_employee UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employees me ON me.id = e.manager_id
    WHERE e.id = target_employee AND me.profile_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 2. PROFILES
--    - staff can see other staff profiles (directory), clients see none
--    - users can always read/update their own profile
--    - only admin/HR can change role or is_active
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles staff directory read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles hr admin manage" ON public.profiles;

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR is_staff());

CREATE POLICY "profiles staff directory read" ON public.profiles
  FOR SELECT USING (is_staff());

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())  -- cannot self-escalate
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles hr admin manage" ON public.profiles
  FOR ALL USING (is_hr_or_admin()) WITH CHECK (is_hr_or_admin());

-- ==============================================================================
-- 3. HR DOMAIN
-- ==============================================================================

-- Departments: staff read; HR/admin manage
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments staff read" ON public.departments;
DROP POLICY IF EXISTS "departments hr admin write" ON public.departments;
CREATE POLICY "departments staff read" ON public.departments
  FOR SELECT USING (is_staff());
CREATE POLICY "departments hr admin write" ON public.departments
  FOR ALL USING (is_hr_or_admin()) WITH CHECK (is_hr_or_admin());

-- Employees: staff read directory; HR/admin manage; employee sees own row
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees staff read" ON public.employees;
DROP POLICY IF EXISTS "employees hr admin write" ON public.employees;
CREATE POLICY "employees staff read" ON public.employees
  FOR SELECT USING (is_staff());
CREATE POLICY "employees hr admin write" ON public.employees
  FOR ALL USING (is_hr_or_admin()) WITH CHECK (is_hr_or_admin());

-- Leave requests: employee sees own; manager sees their reports'; HR/admin all
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave own read" ON public.leave_requests;
DROP POLICY IF EXISTS "leave manager read" ON public.leave_requests;
DROP POLICY IF EXISTS "leave employee insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave own update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave approvers update" ON public.leave_requests;
CREATE POLICY "leave own read" ON public.leave_requests
  FOR SELECT USING (employee_id = my_employee_id() OR is_hr_or_admin());
CREATE POLICY "leave manager read" ON public.leave_requests
  FOR SELECT USING (manages_employee(employee_id));
CREATE POLICY "leave employee insert" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = my_employee_id());
CREATE POLICY "leave own update" ON public.leave_requests
  FOR UPDATE USING (employee_id = my_employee_id() AND status = 'pending')
  WITH CHECK (employee_id = my_employee_id());  -- employee may only cancel own pending
CREATE POLICY "leave approvers update" ON public.leave_requests
  FOR UPDATE USING (is_hr_or_admin() OR manages_employee(employee_id))
  WITH CHECK (is_hr_or_admin() OR manages_employee(employee_id));

-- Attendance: own read/insert; HR/admin full
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance own read" ON public.attendance;
DROP POLICY IF EXISTS "attendance own insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance hr admin" ON public.attendance;
CREATE POLICY "attendance own read" ON public.attendance
  FOR SELECT USING (employee_id = my_employee_id() OR is_hr_or_admin() OR manages_employee(employee_id));
CREATE POLICY "attendance own insert" ON public.attendance
  FOR INSERT WITH CHECK (employee_id = my_employee_id());
CREATE POLICY "attendance hr admin" ON public.attendance
  FOR ALL USING (is_hr_or_admin()) WITH CHECK (is_hr_or_admin());

-- ==============================================================================
-- 4. SALES DOMAIN
-- ==============================================================================

-- Client organizations: staff read; sales/admin manage
ALTER TABLE public.client_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgs staff read" ON public.client_organizations;
DROP POLICY IF EXISTS "orgs sales admin write" ON public.client_organizations;
CREATE POLICY "orgs staff read" ON public.client_organizations
  FOR SELECT USING (is_staff());
CREATE POLICY "orgs sales admin write" ON public.client_organizations
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- Client contacts: staff read; sales/admin manage; client sees own org's contacts
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts staff read" ON public.client_contacts;
DROP POLICY IF EXISTS "contacts sales admin write" ON public.client_contacts;
DROP POLICY IF EXISTS "contacts same org read" ON public.client_contacts;
CREATE POLICY "contacts staff read" ON public.client_contacts
  FOR SELECT USING (is_staff() OR (organization_id = my_organization_id()));
CREATE POLICY "contacts sales admin write" ON public.client_contacts
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());
CREATE POLICY "contacts same org read" ON public.client_contacts
  FOR SELECT USING (organization_id = my_organization_id());

-- Leads: sales/admin full
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads sales admin" ON public.leads;
CREATE POLICY "leads sales admin" ON public.leads
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- Lead activities: sales/admin full
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead activities sales admin" ON public.lead_activities;
CREATE POLICY "lead activities sales admin" ON public.lead_activities
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- Proposals: sales/admin full
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals sales admin" ON public.proposals;
CREATE POLICY "proposals sales admin" ON public.proposals
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- Proposal items: sales/admin full
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposal items sales admin" ON public.proposal_items;
CREATE POLICY "proposal items sales admin" ON public.proposal_items
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- Contracts: sales/admin full; staff read
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts staff read" ON public.contracts;
DROP POLICY IF EXISTS "contracts sales admin write" ON public.contracts;
CREATE POLICY "contracts staff read" ON public.contracts
  FOR SELECT USING (is_staff() OR organization_id = my_organization_id());
CREATE POLICY "contracts sales admin write" ON public.contracts
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- ==============================================================================
-- 5. DELIVERY DOMAIN (projects / members / milestones / tasks / timesheets)
-- ==============================================================================

-- Projects: staff read; manager/admin manage; client reads own org's projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects staff read" ON public.projects;
DROP POLICY IF EXISTS "projects manager write" ON public.projects;
DROP POLICY IF EXISTS "projects client read" ON public.projects;
CREATE POLICY "projects staff read" ON public.projects
  FOR SELECT USING (
    is_staff() OR organization_id = my_organization_id()
  );
CREATE POLICY "projects manager write" ON public.projects
  FOR ALL USING (is_admin() OR manager_id = my_employee_id()) 
  WITH CHECK (is_admin() OR manager_id = my_employee_id());
CREATE POLICY "projects client read" ON public.projects
  FOR SELECT USING (organization_id = my_organization_id());

-- Project members: staff read; manager/admin manage
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members staff read" ON public.project_members;
DROP POLICY IF EXISTS "members manager write" ON public.project_members;
CREATE POLICY "members staff read" ON public.project_members
  FOR SELECT USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = my_organization_id()
    )
  );
CREATE POLICY "members manager write" ON public.project_members
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  ) WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  );

-- Milestones: staff read; client reads own org's; manager/admin manage
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "milestones staff read" ON public.milestones;
DROP POLICY IF EXISTS "milestones client read" ON public.milestones;
DROP POLICY IF EXISTS "milestones manager write" ON public.milestones;
CREATE POLICY "milestones staff read" ON public.milestones
  FOR SELECT USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = my_organization_id()
    )
  );
CREATE POLICY "milestones client read" ON public.milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = my_organization_id()
    )
  );
CREATE POLICY "milestones manager write" ON public.milestones
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  ) WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  );

-- Tasks: staff read; assignee can update own status; manager/admin manage
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks staff read" ON public.tasks;
DROP POLICY IF EXISTS "tasks assignee update" ON public.tasks;
DROP POLICY IF EXISTS "tasks manager write" ON public.tasks;
CREATE POLICY "tasks staff read" ON public.tasks
  FOR SELECT USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = my_organization_id()
    )
  );
CREATE POLICY "tasks assignee update" ON public.tasks
  FOR UPDATE USING (assignee_id = my_employee_id())
  WITH CHECK (assignee_id = my_employee_id());
CREATE POLICY "tasks manager write" ON public.tasks
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  ) WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.manager_id = my_employee_id()
    )
  );

-- Timesheets: employee CRUD own (non-approved states); manager approves team's
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timesheets own read" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets own insert" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets own update" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets manager read" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets manager approve" ON public.timesheets;
CREATE POLICY "timesheets own read" ON public.timesheets
  FOR SELECT USING (employee_id = my_employee_id() OR is_hr_or_admin());
CREATE POLICY "timesheets own insert" ON public.timesheets
  FOR INSERT WITH CHECK (employee_id = my_employee_id());
CREATE POLICY "timesheets own update" ON public.timesheets
  FOR UPDATE USING (employee_id = my_employee_id() AND status IN ('draft','pending','rejected'))
  WITH CHECK (employee_id = my_employee_id());
CREATE POLICY "timesheets manager read" ON public.timesheets
  FOR SELECT USING (manages_employee(employee_id));
CREATE POLICY "timesheets manager approve" ON public.timesheets
  FOR UPDATE USING (manages_employee(employee_id) OR is_hr_or_admin())
  WITH CHECK (manages_employee(employee_id) OR is_hr_or_admin());

-- ==============================================================================
-- 6. FINANCE — invoices
--    Client-portal writes go through service-role API routes only.
-- ==============================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices staff read" ON public.invoices;
DROP POLICY IF EXISTS "invoices client read" ON public.invoices;
DROP POLICY IF EXISTS "invoices sales admin write" ON public.invoices;
CREATE POLICY "invoices staff read" ON public.invoices
  FOR SELECT USING (is_staff());
CREATE POLICY "invoices client read" ON public.invoices
  FOR SELECT USING (organization_id = my_organization_id());
CREATE POLICY "invoices sales admin write" ON public.invoices
  FOR ALL USING (is_sales_or_admin()) WITH CHECK (is_sales_or_admin());

-- ==============================================================================
-- 7. SUPPORT — tickets & messages
-- ==============================================================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets staff read" ON public.tickets;
DROP POLICY IF EXISTS "tickets client read" ON public.tickets;
DROP POLICY IF EXISTS "tickets client create" ON public.tickets;
DROP POLICY IF EXISTS "tickets staff write" ON public.tickets;
CREATE POLICY "tickets staff read" ON public.tickets
  FOR SELECT USING (is_staff());
CREATE POLICY "tickets client read" ON public.tickets
  FOR SELECT USING (organization_id = my_organization_id());
CREATE POLICY "tickets client create" ON public.tickets
  FOR INSERT WITH CHECK (
    organization_id = my_organization_id() AND raised_by = auth.uid()
  );
CREATE POLICY "tickets staff write" ON public.tickets
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket messages read" ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket messages author insert" ON public.ticket_messages;
CREATE POLICY "ticket messages read" ON public.ticket_messages
  FOR SELECT USING (
    is_staff()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.organization_id = my_organization_id()
    )
  );
CREATE POLICY "ticket messages author insert" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    -- staff may post anything; clients may post non-internal replies on own org's tickets
    is_staff()
    OR (
      is_internal = false
      AND EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id AND t.organization_id = my_organization_id()
      )
    )
  );

-- ==============================================================================
-- 8. DOCUMENTS
-- ==============================================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents staff read" ON public.documents;
DROP POLICY IF EXISTS "documents client read" ON public.documents;
DROP POLICY IF EXISTS "documents own employee read" ON public.documents;
DROP POLICY IF EXISTS "documents staff write" ON public.documents;
CREATE POLICY "documents staff read" ON public.documents
  FOR SELECT USING (is_staff());
CREATE POLICY "documents client read" ON public.documents
  FOR SELECT USING (
    category IN ('deliverable','contract','report','agreement')
    AND organization_id = my_organization_id()
  );
CREATE POLICY "documents own employee read" ON public.documents
  FOR SELECT USING (employee_id = my_employee_id() OR is_hr_or_admin());
CREATE POLICY "documents staff write" ON public.documents
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- ==============================================================================
-- 9. PERFORMANCE REVIEWS — employee sees own; manager of the employee full
-- ==============================================================================
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews own read" ON public.performance_reviews;
DROP POLICY IF EXISTS "reviews manager all" ON public.performance_reviews;
CREATE POLICY "reviews own read" ON public.performance_reviews
  FOR SELECT USING (employee_id = my_employee_id());
CREATE POLICY "reviews manager all" ON public.performance_reviews
  FOR ALL USING (manages_employee(employee_id) OR is_hr_or_admin())
  WITH CHECK (manages_employee(employee_id) OR is_hr_or_admin());

-- ==============================================================================
-- 10. NOTIFICATIONS — user sees own; service-role writes via API
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications own read" ON public.notifications;
DROP POLICY IF EXISTS "notifications own update" ON public.notifications;
CREATE POLICY "notifications own read" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications own update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 11. AUDIT LOGS — authenticated staff read; writes via service-role only
-- ==============================================================================
DROP POLICY IF EXISTS "audit logs staff read" ON public.audit_logs;
CREATE POLICY "audit logs staff read" ON public.audit_logs
  FOR SELECT USING (is_staff());

-- ============================================================
-- FILE: 20260929120000_workflow_extension.sql
-- ============================================================
-- ==============================================================================
-- CORALSWIFT — WORKFLOW EXTENSION
-- Migration: 20260929120000_workflow_extension.sql
-- Extends the enquiry lifecycle (assignment to sales), adds client-review
-- states to projects, and safe defaults for existing rows.
-- Run AFTER 20260929010000_org_rbac_rls_policies.sql
-- ==============================================================================

-- ==============================================================================
-- 1. ENQUIRY WORKFLOW EXTENSIONS
--    existing status: new | in_review | contacted | qualified | closed
--    extended flow:   new → under_review → assigned_to_sales → sales_review
--                     → accepted | rejected
-- ==============================================================================

-- Widen the status values (no CHECK constraint existed on enquiries.status;
-- application-level enum only — extend the TS type accordingly).
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_to ON public.enquiries (assigned_to);
CREATE INDEX IF NOT EXISTS idx_enquiries_follow_up ON public.enquiries (follow_up_at) WHERE follow_up_at IS NOT NULL;

-- Enquiry status history (state machine trail)
CREATE TABLE IF NOT EXISTS public.enquiry_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_enquiry_history_enquiry ON public.enquiry_status_history (enquiry_id, created_at);

-- ==============================================================================
-- 2. PROJECT CLIENT-REVIEW WORKFLOW
--    existing status: planning | active | on_hold | completed | cancelled
--    health:          on_track | at_risk | critical
--    Add: client_review lifecycle + progress snapshot + internal updates
-- ==============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_review_status VARCHAR(50) NOT NULL DEFAULT 'not_submitted'
    CHECK (client_review_status IN ('not_submitted','submitted','changes_requested','approved')),
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_feedback TEXT,
  ADD COLUMN IF NOT EXISTS client_feedback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_feedback_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

CREATE INDEX IF NOT EXISTS idx_projects_review_status ON public.projects (client_review_status);

-- Manager project updates (client-safe journal)
CREATE TABLE IF NOT EXISTS public.project_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    is_client_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON public.project_updates (project_id, created_at);

-- Employee documents / shared project documents live in `documents` (exists).

-- ==============================================================================
-- 3. EMPLOYEE DOCUMENTS SELF-SERVICE — documents.employee_id already covers it.
--    Add a category for policy docs shared with all staff:
-- ==============================================================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS is_shared_with_staff BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_documents_staff_shared ON public.documents (is_shared_with_staff) WHERE is_shared_with_staff;

-- ==============================================================================
-- 4. BACKFILL SAFETY DEFAULTS for pre-existing rows
-- ==============================================================================
UPDATE public.projects SET client_review_status = 'not_submitted' WHERE client_review_status IS NULL;
UPDATE public.projects SET progress_percent = 0 WHERE progress_percent IS NULL;
UPDATE public.enquiries SET status = 'new' WHERE status IS NULL;

-- ============================================================
-- FILE: 20260929130000_workflow_rls_policies.sql
-- ============================================================
-- ==============================================================================
-- CORALSWIFT — WORKFLOW EXTENSION RLS
-- Migration: 20260929130000_workflow_rls_policies.sql
-- Run AFTER 20260929120000_workflow_extension.sql
-- ==============================================================================

-- 1. ENQUIRY STATUS HISTORY — staff can read; writes via service-role only
ALTER TABLE public.enquiry_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enquiry history staff read" ON public.enquiry_status_history;
CREATE POLICY "enquiry history staff read" ON public.enquiry_status_history
  FOR SELECT USING (is_staff());

-- 2. PROJECT UPDATES — staff read; client reads client-visible updates for own org
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project updates staff read" ON public.project_updates;
DROP POLICY IF EXISTS "project updates client read" ON public.project_updates;
DROP POLICY IF EXISTS "project updates staff write" ON public.project_updates;
CREATE POLICY "project updates staff read" ON public.project_updates
  FOR SELECT USING (is_staff());
CREATE POLICY "project updates client read" ON public.project_updates
  FOR SELECT USING (
    is_client_visible = true
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = my_organization_id()
    )
  );
CREATE POLICY "project updates staff write" ON public.project_updates
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- 3. DOCUMENTS — staff-shared docs policy (HR policy docs visible to all staff)
DROP POLICY IF EXISTS "documents staff shared read" ON public.documents;
CREATE POLICY "documents staff shared read" ON public.documents
  FOR SELECT USING (is_shared_with_staff = true AND is_staff());

-- 4. PROJECTS — client can now also read review status (already via org policy).
--    Employees can read projects they are members of:
DROP POLICY IF EXISTS "projects member read" ON public.projects;
CREATE POLICY "projects member read" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = id AND pm.employee_id = my_employee_id()
    )
  );

-- 5. PROJECT_MEMBERS — members can read their own project's roster
DROP POLICY IF EXISTS "members own project read" ON public.project_members;
CREATE POLICY "members own project read" ON public.project_members
  FOR SELECT USING (employee_id = my_employee_id());

-- 6. MILESTONES / TASKS / TIMESHEETS — members read via project membership
DROP POLICY IF EXISTS "milestones member read" ON public.milestones;
CREATE POLICY "milestones member read" ON public.milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = project_id AND pm.employee_id = my_employee_id()
    )
  );

DROP POLICY IF EXISTS "tasks member read" ON public.tasks;
CREATE POLICY "tasks member read" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = project_id AND pm.employee_id = my_employee_id()
    )
  );

-- 6. TIMESHEETS: an employee sees own rows plus rows on member projects
DROP POLICY IF EXISTS "timesheets member read" ON public.timesheets;
CREATE POLICY "timesheets member read" ON public.timesheets
  FOR SELECT USING (
    employee_id = my_employee_id()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = timesheets.project_id AND pm.employee_id = my_employee_id()
    )
  );
