export interface Service {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
  overview: string;
  capabilities: string[];
  approach: { step: string; phase: string; description: string }[];
  requirements?: string;
  deliverables: string[];
  cta_text: string;
  icon: string;
  order_index: number;
  status: 'published' | 'draft' | 'archived';
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  work_model: 'Remote' | 'Hybrid' | 'Onsite';
  employment_type: 'Full-time' | 'Contract' | 'Part-time';
  experience_level: string;
  short_description: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  salary_range?: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  cover_note?: string;
  resume_path: string;
  resume_filename: string;
  resume_url?: string;
  status: 'submitted' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  job_title?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  client_name: string;
  industry: string;
  project_context: string;
  challenge: string;
  solution: string;
  implementation: string;
  outcome_metrics: { metric: string; label: string }[];
  tech_stack: string[];
  related_service_slug?: string;
  is_featured: boolean;
  status: 'published' | 'draft' | 'archived';
  hero_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  full_name: string;
  email: string;
  company: string;
  phone?: string;
  service_interest?: string;
  message: string;
  consent: boolean;
  source_page: string;
  status: 'new' | 'in_review' | 'contacted' | 'qualified' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  general: {
    company_name: string;
    tagline: string;
    contact_email: string;
    support_email: string;
    phone: string;
    headquarters: string;
    established_year: string;
    social_links: {
      linkedin: string;
      github: string;
      twitter: string;
    };
  };
  metrics: {
    uptime_sla: string;
    tps_processed: string;
    enterprise_clients: string;
    client_satisfaction: string;
  };
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface AdminStats {
  total_services: number;
  published_services: number;
  active_jobs: number;
  total_applications: number;
  new_applications: number;
  total_case_studies: number;
  total_enquiries: number;
  new_enquiries: number;
}
