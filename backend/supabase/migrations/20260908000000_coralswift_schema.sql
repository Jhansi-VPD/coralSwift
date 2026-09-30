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
