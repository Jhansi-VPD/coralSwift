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
