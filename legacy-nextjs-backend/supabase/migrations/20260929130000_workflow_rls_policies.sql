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
