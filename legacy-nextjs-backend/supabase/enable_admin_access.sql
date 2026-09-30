-- ==============================================================================
-- CORALSWIFT ENTERPRISE - SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting restrictive policies if they exist
DROP POLICY IF EXISTS "Allow public read on published services" ON public.services;
DROP POLICY IF EXISTS "Allow public read on active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow public read on published case studies" ON public.case_studies;
DROP POLICY IF EXISTS "Allow public read on site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public insert on enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public insert on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow anon all on services" ON public.services;
DROP POLICY IF EXISTS "Allow anon all on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon all on case_studies" ON public.case_studies;
DROP POLICY IF EXISTS "Allow anon all on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anon all on enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow anon all on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow anon all on audit_logs" ON public.audit_logs;

-- 3. Grant full access policies for development & admin management
CREATE POLICY "Allow anon all on services" ON public.services 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on jobs" ON public.jobs 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on case_studies" ON public.case_studies 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on site_settings" ON public.site_settings 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on enquiries" ON public.enquiries 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on applications" ON public.applications 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all on audit_logs" ON public.audit_logs 
    FOR ALL USING (true) WITH CHECK (true);
