import { 
  initialServices, 
  initialJobs, 
  initialCaseStudies, 
  initialEnquiries, 
  initialApplications, 
  initialSiteSettings, 
  initialAuditLogs 
} from './mock-data';
import { 
  Service, 
  Job, 
  CaseStudy, 
  Enquiry, 
  Application, 
  SiteSettings, 
  AuditLog, 
  AdminStats 
} from './types';
import { createClient } from './supabase/client';
import { apiUrl, authHeaders } from './api-base';

// Local In-Memory Fallback State (Synchronized with mutations in local dev/runtime)
let memoryServices = [...initialServices];
let memoryJobs = [...initialJobs];
let memoryCaseStudies = [...initialCaseStudies];
let memoryEnquiries = [...initialEnquiries];
let memoryApplications = [...initialApplications];
let memorySettings: SiteSettings = { ...initialSiteSettings };
let memoryAuditLogs = [...initialAuditLogs];
let deletedServiceIds = new Set<string>();
let deletedCaseStudyIds = new Set<string>();

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ==============================================================================
// 1. SERVICES API
// ==============================================================================
export async function getServices(status?: 'published' | 'draft' | 'archived', adminMode?: boolean): Promise<Service[]> {
  if (typeof window !== 'undefined') {
    if (adminMode) {
      const res = await fetch(apiUrl('/api/services?mode=admin'), { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch services' }));
        throw new Error(err.error || 'Failed to fetch services');
      }
      return await res.json();
    }
    try {
      const url = apiUrl(status ? `/api/services?status=${status}` : '/api/services');
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Client getServices API fetch error:', e);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('services').select('*').order('created_at', { ascending: true });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (!error && data !== null) {
        let items = data as Service[];
        return items.filter(s => !deletedServiceIds.has(s.id) && !deletedServiceIds.has(s.slug));
      }
    } catch (e) {
      console.warn('Supabase getServices notice:', e);
    }
  }

  let items = memoryServices.filter(s => !deletedServiceIds.has(s.id) && !deletedServiceIds.has(s.slug));
  if (status) {
    return items.filter(s => s.status === status);
  }
  return items;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (deletedServiceIds.has(slug)) return null;

  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) {
        if (deletedServiceIds.has(data.id) || deletedServiceIds.has(data.slug)) return null;
        return data as Service;
      }
    } catch (e) {
      console.warn('Supabase getServiceBySlug notice:', e);
    }
  }

  return memoryServices.find(s => s.slug === slug && !deletedServiceIds.has(s.id) && !deletedServiceIds.has(s.slug)) || null;
}

export async function saveService(service: Partial<Service>, supabaseClient?: any, ip?: string | null): Promise<Service> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/services'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(service)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save service' }));
      throw new Error(err.error || 'Failed to save service');
    }
    return await res.json();
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const dbPayload: any = {
    title: service.title || 'Untitled Service',
    slug: service.slug || 'service-' + Date.now(),
    category: service.category || 'Engineering',
    short_description: service.short_description || '',
    overview: service.overview || '',
    capabilities: service.capabilities || [],
    deliverables: service.deliverables || [],
    cta_text: service.cta_text || 'Discuss Your Architecture',
    icon: service.icon || 'Cpu',
    status: service.status || 'published',
    updated_at: now,
  };

  if (service.id && isValidUUID(service.id)) {
    const { data, error } = await supabase
      .from('services').update(dbPayload).eq('id', service.id).select().maybeSingle();
    if (error) throw new Error(error.message || 'Failed to update service');
    if (data) {
      logAuditAction('SAVE_SERVICE', 'services', data.id, { title: data.title }, supabaseClient, ip);
      return data as Service;
    }
  }

  if (service.slug) {
    const { data: existing } = await supabase
      .from('services').select('id').eq('slug', service.slug).maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('services').update(dbPayload).eq('id', existing.id).select().maybeSingle();
      if (error) throw new Error(error.message || 'Failed to update service');
      if (data) {
        logAuditAction('SAVE_SERVICE', 'services', data.id, { title: data.title }, supabaseClient, ip);
        return data as Service;
      }
    }
  }

  const { data, error } = await supabase
    .from('services').insert({ ...dbPayload, created_at: now }).select().single();
  if (error) throw new Error(error.message || 'Failed to insert service');
  logAuditAction('SAVE_SERVICE', 'services', data.id, { title: data.title }, supabaseClient, ip);
  return data as Service;
}

export async function deleteService(idOrSlug: string, supabaseClient?: any, ip?: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl(`/api/services/${encodeURIComponent(idOrSlug)}`), { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete service' }));
      throw new Error(err.error || 'Failed to delete service');
    }
    const data = await res.json();
    return data.success;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  if (isValidUUID(idOrSlug)) {
    const { error } = await supabase.from('services').delete().eq('id', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete service');
  } else {
    const { error } = await supabase.from('services').delete().eq('slug', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete service');
  }
  logAuditAction('DELETE_SERVICE', 'services', idOrSlug, undefined, supabaseClient, ip);
  return true;
}

// ==============================================================================
// 2. JOBS & CAREERS API
// ==============================================================================
export async function getJobs(status?: 'active' | 'closed' | 'draft', adminMode?: boolean): Promise<Job[]> {
  if (typeof window !== 'undefined') {
    if (adminMode) {
      const res = await fetch(apiUrl('/api/jobs?mode=admin'), { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch jobs' }));
        throw new Error(err.error || 'Failed to fetch jobs');
      }
      return await res.json();
    }
    try {
      const url = apiUrl(status ? `/api/jobs?status=${status}` : '/api/jobs');
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Client getJobs API fetch error:', e);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('jobs').select('*, applications:applications(count)').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (!error && data !== null) {
        const items = (data as any[]).map((j: any) => ({
          ...j,
          applications_count: j.applications?.[0]?.count || 0
        })) as Job[];
        
        // Sync memory
        items.forEach(item => {
          const idx = memoryJobs.findIndex(m => m.id === item.id || m.slug === item.slug);
          if (idx !== -1) {
            memoryJobs[idx] = item;
          } else {
            memoryJobs.unshift(item);
          }
        });

        return items;
      }
    } catch (e) {
      console.warn('Supabase getJobs notice:', e);
    }
  }

  if (status) {
    return memoryJobs.filter(j => j.status === status);
  }
  return memoryJobs;
}

export async function getJobByIdOrSlug(identifier: string): Promise<Job | null> {
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('jobs').select('*');
      if (isValidUUID(identifier)) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) return data as Job;
    } catch (e) {
      console.warn('Supabase getJobByIdOrSlug notice:', e);
    }
  }
  return memoryJobs.find(j => j.id === identifier || j.slug === identifier) || null;
}

export async function saveJob(job: Partial<Job>, supabaseClient?: any, ip?: string | null): Promise<Job> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/jobs'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(job)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save job' }));
      throw new Error(err.error || 'Failed to save job');
    }
    return await res.json();
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const payload: any = {
    title: job.title || 'Untitled Opening',
    slug: job.slug || 'job-' + Date.now(),
    department: job.department || 'Engineering',
    location: job.location || 'San Francisco, CA / Remote',
    work_model: job.work_model || 'Hybrid',
    employment_type: job.employment_type || 'Full-time',
    experience_level: job.experience_level || 'Senior (5+ yrs)',
    short_description: job.short_description || '',
    description: job.description || '',
    responsibilities: job.responsibilities || [],
    requirements: job.requirements || [],
    benefits: job.benefits || [],
    salary_range: job.salary_range || null,
    status: job.status || 'active',
    updated_at: now,
  };

  if (job.id && isValidUUID(job.id)) {
    const { data, error } = await supabase
      .from('jobs').update(payload).eq('id', job.id).select().maybeSingle();
    if (error) throw new Error(error.message || 'Failed to update job');
    if (data) {
      logAuditAction('SAVE_JOB', 'jobs', data.id, { title: data.title }, supabaseClient, ip);
      return data as Job;
    }
  } else if (job.slug) {
    const { data: existing } = await supabase
      .from('jobs').select('id').eq('slug', job.slug).maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('jobs').update(payload).eq('id', existing.id).select().maybeSingle();
      if (error) throw new Error(error.message || 'Failed to update job');
      if (data) {
        logAuditAction('SAVE_JOB', 'jobs', data.id, { title: data.title }, supabaseClient, ip);
        return data as Job;
      }
    }
  }

  const { data, error } = await supabase
    .from('jobs').insert({ ...payload, created_at: now }).select().single();
  if (error) throw new Error(error.message || 'Failed to insert job');
  logAuditAction('SAVE_JOB', 'jobs', data.id, { title: data.title }, supabaseClient, ip);
  return data as Job;
}

export async function deleteJob(idOrSlug: string, supabaseClient?: any, ip?: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl(`/api/jobs/${encodeURIComponent(idOrSlug)}`), { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete job' }));
      throw new Error(err.error || 'Failed to delete job');
    }
    const data = await res.json();
    return data.success;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  if (isValidUUID(idOrSlug)) {
    const { error } = await supabase.from('jobs').delete().eq('id', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete job');
  } else {
    const { error } = await supabase.from('jobs').delete().eq('slug', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete job');
  }
  logAuditAction('DELETE_JOB', 'jobs', idOrSlug, {}, supabaseClient, ip);
  return true;
}

// ==============================================================================
// 3. CANDIDATE APPLICATIONS API
// ==============================================================================
export async function submitApplication(appData: {
  job_id: string;
  full_name: string;
  email: string;
  phone?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  cover_note?: string;
  resume_filename: string;
  resume_path: string;
  resume_url?: string;
  resume_file?: File;
}): Promise<{ success: boolean; id: string; message: string }> {
  const supabase = createClient();

  if (!supabase) {
    throw new Error('Service temporarily unavailable. Please try again later.');
  }

  try {
    let validJobId: string | null = null;
    if (isValidUUID(appData.job_id)) {
      const { data: checkJob } = await supabase.from('jobs').select('id').eq('id', appData.job_id).maybeSingle();
      if (checkJob) validJobId = checkJob.id;
    }
    
    if (!validJobId && appData.job_id) {
      const { data: foundJob } = await supabase
        .from('jobs')
        .select('id')
        .or(`slug.eq.${appData.job_id},title.ilike.%${appData.job_id}%`)
        .maybeSingle();
      if (foundJob) validJobId = foundJob.id;
    }

    const cleanFilename = (appData.resume_filename || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    let finalResumePath = appData.resume_path;

    if (!finalResumePath || finalResumePath.startsWith('data:')) {
      finalResumePath = `/uploads/resumes/${Date.now()}_${cleanFilename}`;
    }

    if (appData.resume_file) {
      try {
        const storagePath = `resumes/${Date.now()}_${cleanFilename}`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('resumes')
          .upload(storagePath, appData.resume_file, { upsert: true });

        if (!storageErr && storageData?.path) {
          finalResumePath = storageData.path;
        }
      } catch (stErr) {
        console.warn('Supabase storage upload notice:', stErr);
      }
    }

    const payload: any = {
      full_name: appData.full_name.slice(0, 255),
      email: appData.email.slice(0, 255),
      phone: appData.phone ? appData.phone.slice(0, 50) : null,
      portfolio_url: appData.portfolio_url ? appData.portfolio_url.slice(0, 255) : null,
      linkedin_url: appData.linkedin_url ? appData.linkedin_url.slice(0, 255) : null,
      cover_note: appData.cover_note || null,
      resume_filename: cleanFilename.slice(0, 255),
      resume_path: finalResumePath.slice(0, 500),
      status: 'submitted',
    };
    if (validJobId) {
      payload.job_id = validJobId;
    }

    const { data, error } = await supabase.from('applications').insert(payload).select().single();
    if (error) {
      throw new Error(error.message || 'Failed to save application to database');
    }
    if (data) {
      logAuditAction('SUBMIT_APPLICATION', 'applications', data.id, { candidate: appData.full_name });
      return { success: true, id: data.id, message: 'Application submitted successfully.' };
    }
  } catch (e) {
    throw e;
  }

  throw new Error('Failed to submit application.');
}

export async function getApplications(): Promise<Application[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/applications'), { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch applications' }));
      throw new Error(err.error || 'Failed to fetch applications');
    }
    return await res.json();
  }

  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs:jobs(title)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as any[]).map((a: any) => {
          let resumeUrl = a.resume_url || a.resume_path || '';
          if (supabase && a.resume_path && !a.resume_path.startsWith('http') && !a.resume_path.startsWith('data:') && !a.resume_path.startsWith('/uploads/')) {
            try {
              const { data: pubData } = supabase.storage.from('resumes').getPublicUrl(a.resume_path);
              if (pubData?.publicUrl) resumeUrl = pubData.publicUrl;
            } catch (err) {
              // fallback
            }
          }
          return {
            ...a,
            resume_url: resumeUrl || a.resume_path,
            job_title: a.jobs?.title || 'Engineering Position'
          };
        }) as Application[];
      }
    } catch (e) {
      console.warn('Supabase getApplications notice:', e);
    }
  }
  return memoryApplications;
}

export async function updateApplicationStatus(id: string, status: Application['status'], notes?: string, supabaseClient?: any): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/applications'), {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, status, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update application' }));
      throw new Error(err.error || 'Failed to update application');
    }
    return true;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const { error } = await supabase.from('applications').update({ status, admin_notes: notes, updated_at: now }).eq('id', id);
  if (error) throw new Error(error.message || 'Failed to update application');
  logAuditAction('UPDATE_APPLICATION_STATUS', 'applications', id, { status, notes }, supabaseClient);
  return true;
}

export async function deleteApplication(id: string, supabaseClient?: any): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl(`/api/admin/applications/${encodeURIComponent(id)}`), { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete application' }));
      throw new Error(err.error || 'Failed to delete application');
    }
    return true;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete application');
  logAuditAction('DELETE_APPLICATION', 'applications', id, { id }, supabaseClient);
  return true;
}

// ==============================================================================
// 4. CASE STUDIES API
// ==============================================================================
export async function getCaseStudies(featuredOnly: boolean = false): Promise<CaseStudy[]> {
  if (typeof window !== 'undefined') {
    try {
      const url = apiUrl(`/api/case-studies${featuredOnly ? '?featured=true' : ''}`);
      const res = await fetch(url);
      if (res.ok) {
        const data: CaseStudy[] = await res.json();
        return data.filter(c => c.status === 'published');
      }
    } catch (e) {
      console.warn('Client getCaseStudies API fetch error:', e);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase
        .from('case_studies')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        return (data as CaseStudy[]).filter(
          c => !deletedCaseStudyIds.has(c.id) && !deletedCaseStudyIds.has(c.slug)
        );
      }
    } catch (e) {
      console.warn('Supabase getCaseStudies notice:', e);
    }
  }

  let items = memoryCaseStudies.filter(
    c => !deletedCaseStudyIds.has(c.id) && !deletedCaseStudyIds.has(c.slug) && c.status === 'published'
  );
  if (featuredOnly) {
    return items.filter(c => c.is_featured);
  }
  return items;
}

export async function getAllCaseStudiesAdmin(): Promise<CaseStudy[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(apiUrl('/api/case-studies?mode=admin'), { headers: authHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Client getAllCaseStudiesAdmin API fetch error:', e);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as CaseStudy[]).filter(
          c => !deletedCaseStudyIds.has(c.id) && !deletedCaseStudyIds.has(c.slug)
        );
      }
    } catch (e) {
      console.warn('Supabase getAllCaseStudiesAdmin notice:', e);
    }
  }

  return memoryCaseStudies.filter(
    c => !deletedCaseStudyIds.has(c.id) && !deletedCaseStudyIds.has(c.slug)
  );
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  if (deletedCaseStudyIds.has(slug)) return null;
  const all = await getAllCaseStudiesAdmin();
  return all.find(c => c.slug === slug) || null;
}

export async function saveCaseStudy(caseStudy: Partial<CaseStudy>, supabaseClient?: any, ip?: string | null): Promise<CaseStudy> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/case-studies'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(caseStudy)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save case study' }));
      throw new Error(err.error || 'Failed to save case study');
    }
    return await res.json();
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const payload: any = {
    title: caseStudy.title || 'Untitled Case Study',
    slug: caseStudy.slug || 'case-study-' + Date.now(),
    client_name: caseStudy.client_name || 'Enterprise Client',
    industry: caseStudy.industry || 'Technology',
    project_context: caseStudy.project_context || '',
    challenge: caseStudy.challenge || '',
    solution: caseStudy.solution || '',
    implementation: caseStudy.implementation || '',
    outcome_metrics: caseStudy.outcome_metrics || [],
    tech_stack: caseStudy.tech_stack || [],
    is_featured: !!caseStudy.is_featured,
    status: caseStudy.status || 'published',
    updated_at: now,
  };

  if (caseStudy.id && isValidUUID(caseStudy.id)) {
    const { data, error } = await supabase
      .from('case_studies').update(payload).eq('id', caseStudy.id).select().maybeSingle();
    if (error) throw new Error(error.message || 'Failed to update case study');
    if (data) {
      logAuditAction('SAVE_CASE_STUDY', 'case_studies', data.id, { title: data.title }, supabaseClient, ip);
      return data as CaseStudy;
    }
  } else if (caseStudy.slug) {
    const { data: existing } = await supabase
      .from('case_studies').select('id').eq('slug', caseStudy.slug).maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase
        .from('case_studies').update(payload).eq('id', existing.id).select().maybeSingle();
      if (error) throw new Error(error.message || 'Failed to update case study');
      if (data) {
        logAuditAction('SAVE_CASE_STUDY', 'case_studies', data.id, { title: data.title }, supabaseClient, ip);
        return data as CaseStudy;
      }
    }
  }

  const { data, error } = await supabase
    .from('case_studies').insert({ ...payload, created_at: now }).select().single();
  if (error) throw new Error(error.message || 'Failed to insert case study');
  logAuditAction('SAVE_CASE_STUDY', 'case_studies', data.id, { title: data.title }, supabaseClient, ip);
  return data as CaseStudy;
}

export async function deleteCaseStudy(idOrSlug: string, supabaseClient?: any, ip?: string | null): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl(`/api/case-studies/${encodeURIComponent(idOrSlug)}`), { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete case study' }));
      throw new Error(err.error || 'Failed to delete case study');
    }
    const data = await res.json();
    return data.success;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  if (isValidUUID(idOrSlug)) {
    const { error } = await supabase.from('case_studies').delete().eq('id', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete case study');
  } else {
    const { error } = await supabase.from('case_studies').delete().eq('slug', idOrSlug);
    if (error) throw new Error(error.message || 'Failed to delete case study');
  }
  logAuditAction('DELETE_CASE_STUDY', 'case_studies', idOrSlug, {}, supabaseClient, ip);
  return true;
}

// ==============================================================================
// 5. CONTACT ENQUIRIES API
// ==============================================================================
export async function submitEnquiry(data: {
  full_name: string;
  email: string;
  company: string;
  phone?: string;
  service_interest?: string;
  message: string;
  consent: boolean;
  source_page?: string;
}): Promise<{ success: boolean; id: string; message: string }> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(apiUrl('/api/enquiries/submit'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit enquiry.');
      }
      return json;
    } catch (e: any) {
      if (e.message && (e.message.includes('exact corporate email') || e.message.includes('already been submitted'))) {
        throw e;
      }
    }
  }

  const supabase = createClient();

  if (!supabase) {
    throw new Error('Service temporarily unavailable. Please try again later.');
  }

  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanService = (data.service_interest || '').trim().toLowerCase();

    // Check Supabase DB for exact duplicate consultation booking
    if (cleanEmail && cleanService && data.message.includes('[Booked Consultation:')) {
      const { data: existing } = await supabase
        .from('enquiries')
        .select('id, message, service_interest')
        .ilike('email', cleanEmail);

      if (existing && existing.length > 0) {
        const exactMatch = existing.some((e: any) => {
          const s = (e.service_interest || '').trim().toLowerCase();
          const m = (e.message || '').trim();
          if (s !== cleanService) return false;
          const dateMatch = data.message.match(/Date:\s*([^,\]]+)/);
          const slotMatch = data.message.match(/Slot:\s*([^,\]]+)/);
          if (dateMatch && slotMatch) {
            return m.includes(`Date: ${dateMatch[1].trim()}`) && m.includes(`Slot: ${slotMatch[1].trim()}`);
          }
          return m === data.message.trim();
        });
        if (exactMatch) {
          throw new Error('A consultation request with this exact corporate email, service domain, date, and time slot has already been submitted.');
        }
      }
    }

    // Check memoryEnquiries for exact duplicate booking
    if (cleanEmail && cleanService && data.message.includes('[Booked Consultation:')) {
      const memoryMatch = memoryEnquiries.some(
        e => (e.email || '').toLowerCase() === cleanEmail &&
             (e.service_interest || '').toLowerCase() === cleanService &&
             (e.message || '').trim() === data.message.trim()
      );
      if (memoryMatch) {
        throw new Error('A consultation request with this exact corporate email, service domain, date, and time slot has already been submitted.');
      }
    }

    const payload = {
      full_name: data.full_name,
      email: data.email,
      company: data.company,
      phone: data.phone || null,
      service_interest: data.service_interest || 'General Enterprise Consultation',
      message: data.message,
      consent: data.consent ?? true,
      source_page: data.source_page || '/contact',
      status: 'new',
    };

    const { data: result, error } = await supabase.from('enquiries').insert(payload).select().single();
    if (error) {
      if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('enquiries_email_key')) {
        const fallbackId = 'enq_' + Date.now();
        memoryEnquiries.unshift({
          id: fallbackId,
          full_name: payload.full_name,
          email: payload.email,
          company: payload.company,
          phone: payload.phone || undefined,
          service_interest: payload.service_interest,
          message: payload.message,
          consent: payload.consent,
          source_page: payload.source_page,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return { success: true, id: fallbackId, message: 'Your consultation request has been received.' };
      }
      throw new Error(error.message || 'Failed to save enquiry to database');
    }
    if (result) {
      memoryEnquiries.unshift(result);
      return { success: true, id: result.id, message: 'Your enquiry has been received.' };
    }
  } catch (e) {
    throw e;
  }

  throw new Error('Failed to submit enquiry.');
}

export async function getEnquiries(): Promise<Enquiry[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/enquiries'), { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch enquiries' }));
      throw new Error(err.error || 'Failed to fetch enquiries');
    }
    return await res.json();
  }

  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as Enquiry[];
    } catch (e) {
      console.warn('Supabase getEnquiries notice:', e);
    }
  }
  return memoryEnquiries;
}

export async function updateEnquiryStatus(id: string, status: Enquiry['status'], notes?: string, supabaseClient?: any): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/enquiries'), {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, status, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update enquiry' }));
      throw new Error(err.error || 'Failed to update enquiry');
    }
    return true;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const { error } = await supabase.from('enquiries').update({ status, admin_notes: notes, updated_at: now }).eq('id', id);
  if (error) throw new Error(error.message || 'Failed to update enquiry');
  logAuditAction('UPDATE_ENQUIRY_STATUS', 'enquiries', id, { status, notes }, supabaseClient);
  return true;
}

export async function deleteEnquiry(id: string, supabaseClient?: any): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl(`/api/admin/enquiries/${encodeURIComponent(id)}`), { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete enquiry' }));
      throw new Error(err.error || 'Failed to delete enquiry');
    }
    return true;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete enquiry');
  logAuditAction('DELETE_ENQUIRY', 'enquiries', id, { id }, supabaseClient);
  return true;
}

// ==============================================================================
// 6. SITE SETTINGS API
// ==============================================================================
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (!error && data && data.length > 0) {
        const settingsMap: any = { ...memorySettings };
        (data as any[]).forEach((item: any) => {
          settingsMap[item.key] = item.value;
        });
        return settingsMap as SiteSettings;
      }
    } catch (e) {
      console.warn('Supabase getSiteSettings notice:', e);
    }
  }
  return memorySettings;
}

export async function updateSiteSettings(key: keyof SiteSettings, value: any, supabaseClient?: any): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/settings'), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
      throw new Error(err.error || 'Failed to update settings');
    }
    return true;
  }

  const supabase = supabaseClient || createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const now = new Date().toISOString();
  const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: now }, { onConflict: 'key' });
  if (error) throw new Error(error.message || 'Failed to update settings');
  logAuditAction('UPDATE_SITE_SETTINGS', 'site_settings', key, { value }, supabaseClient);
  return true;
}

// ==============================================================================
// 7. AUDIT LOGS & STATS
// ==============================================================================
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(apiUrl('/api/admin/audit-logs'), { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch audit logs' }));
      throw new Error(err.error || 'Failed to fetch audit logs');
    }
    return await res.json();
  }

  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data && data.length > 0) return data as AuditLog[];
    } catch (e) {
      console.warn('Supabase getAuditLogs notice:', e);
    }
  }
  return memoryAuditLogs;
}

export function logAuditAction(action: string, entity_type?: string, entity_id?: string, details?: any, supabaseClient?: any, ip?: string | null) {
  const log: AuditLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    user_email: 'admin@coralswift.com',
    action,
    entity_type,
    entity_id,
    details,
    ip_address: ip ?? null,
    created_at: new Date().toISOString()
  };
  memoryAuditLogs.unshift(log);
  if (memoryAuditLogs.length > 100) memoryAuditLogs.pop();

  const supabase = supabaseClient || createClient();
  if (supabase) {
    supabase.from('audit_logs').insert({
      user_email: log.user_email,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id ? String(log.entity_id) : null,
      details: log.details || null,
      ip_address: log.ip_address,
      created_at: log.created_at
    }).then(({ error }: { error?: { message?: string } | null }) => {
      if (error) {
        console.warn('Supabase logAuditAction notice:', error.message);
      }
    }).catch((err: unknown) => console.warn('Supabase logAuditAction error:', err));
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const services = await getServices(undefined, true);
  const jobs = await getJobs(undefined, true);
  const caseStudies = await getAllCaseStudiesAdmin();
  const enquiries = await getEnquiries();
  const applications = await getApplications();

  return {
    total_services: services.length,
    published_services: services.filter(s => s.status === 'published').length,
    active_jobs: jobs.filter(j => j.status === 'active').length,
    total_applications: applications.length,
    new_applications: applications.filter(a => a.status === 'submitted').length,
    total_case_studies: caseStudies.length,
    total_enquiries: enquiries.length,
    new_enquiries: enquiries.filter(e => e.status === 'new').length
  };
}
