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
