-- ==============================================================================
-- CORALSWIFT — PROJECT TRACKING (QA ROLE) + ANNOUNCEMENTS
-- Migration: 20260930100000_tracking_qa_announcements.sql
-- Run AFTER 20260929120000_workflow_extension.sql
--
-- 1. New "qa" role (profiles.role CHECK widened)
-- 2. projects.qa_employee_id — assigned QA reviewer per project
-- 3. project_updates extended: author_role, visibility, thread columns
-- 4. announcements — admin/HR broadcast posts with per-role targeting
-- ==============================================================================

-- ==============================================================================
-- 1. QA ROLE
-- ==============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','hr','sales','manager','employee','client','qa'));

-- Staff helper learns about qa (client stays outside staff)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','hr','sales','manager','employee','qa'));
$$;

-- ==============================================================================
-- 2. PROJECTS — assigned QA reviewer
-- ==============================================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS qa_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_qa ON public.projects (qa_employee_id);

-- ==============================================================================
-- 3. PROJECT UPDATES — multi-party tracking workflow
--    employee → manager · QA → manager · QA → employee · manager → client
--    admin sees every row. project_updates already exists from
--    20260929120000_workflow_extension.sql; extend it in place.
-- ==============================================================================
ALTER TABLE public.project_updates
  ADD COLUMN IF NOT EXISTS author_role VARCHAR(20),
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'manager'
    CHECK (visibility IN ('public','manager','employee')),
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(20)
    CHECK (review_status IN ('open','acknowledged','resolved','blocked')),
  ADD COLUMN IF NOT EXISTS thread_root_id UUID REFERENCES public.project_updates(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manager_note TEXT;

CREATE INDEX IF NOT EXISTS idx_project_updates_visibility ON public.project_updates (project_id, visibility, created_at);

-- Default the author_role for rows written before this migration.
UPDATE public.project_updates u
SET author_role = COALESCE((SELECT role FROM public.profiles WHERE id = u.author_id), 'manager')
WHERE author_role IS NULL;

-- ==============================================================================
-- 4. ANNOUNCEMENTS — admin/HR broadcasts with per-role targeting
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    audience VARCHAR(50) NOT NULL DEFAULT 'all'
        CHECK (audience IN ('all','staff','admin','hr','sales','manager','employee','qa','client')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low','normal','high')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_announcements_feed ON public.announcements (audience, created_at);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements staff client read" ON public.announcements;
CREATE POLICY "announcements staff client read" ON public.announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Writes go through the service-role API routes only (admin/HR).
