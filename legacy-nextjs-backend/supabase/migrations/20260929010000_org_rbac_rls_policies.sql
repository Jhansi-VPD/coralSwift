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
