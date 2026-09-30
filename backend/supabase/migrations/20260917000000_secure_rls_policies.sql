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
