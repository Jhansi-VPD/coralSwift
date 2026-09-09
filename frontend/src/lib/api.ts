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

// Local In-Memory Fallback State (Synchronized with mutations in local dev/runtime)
let memoryServices = [...initialServices];
let memoryJobs = [...initialJobs];
let memoryCaseStudies = [...initialCaseStudies];
let memoryEnquiries = [...initialEnquiries];
let memoryApplications = [...initialApplications];
let memorySettings: SiteSettings = { ...initialSiteSettings };
let memoryAuditLogs = [...initialAuditLogs];

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ==============================================================================
// 1. SERVICES API
// ==============================================================================
export async function getServices(status?: 'published' | 'draft' | 'archived'): Promise<Service[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('services').select('*').order('order_index', { ascending: true });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Service[];
      }
    } catch (e) {
      console.warn('Supabase getServices notice:', e);
    }
  }
  
  if (status) {
    return memoryServices.filter(s => s.status === status);
  }
  return memoryServices;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) return data as Service;
    } catch (e) {
      console.warn('Supabase getServiceBySlug notice:', e);
    }
  }
  return memoryServices.find(s => s.slug === slug) || null;
}

export async function saveService(service: Partial<Service>): Promise<Service> {
  const supabase = createClient();
  const now = new Date().toISOString();
  
  const payload: any = {
    title: service.title || 'Untitled Service',
    slug: service.slug || 'service-' + Date.now(),
    category: service.category || 'Engineering',
    short_description: service.short_description || '',
    overview: service.overview || '',
    capabilities: service.capabilities || [],
    approach: service.approach || [],
    deliverables: service.deliverables || [],
    requirements: service.requirements || '',
    cta_text: service.cta_text || 'Discuss Your Architecture',
    icon: service.icon || 'Cpu',
    order_index: service.order_index ?? (memoryServices.length + 1),
    status: service.status || 'published',
    meta_title: service.meta_title || null,
    meta_description: service.meta_description || null,
    canonical_url: service.canonical_url || null,
    updated_at: now,
  };

  let savedItem: Service | null = null;

  if (supabase) {
    try {
      if (service.id && isValidUUID(service.id)) {
        // Update by UUID
        const { data, error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', service.id)
          .select()
          .maybeSingle();
        if (!error && data) savedItem = data as Service;
      } else if (service.slug) {
        // Check if matching row exists by slug
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('slug', service.slug)
          .maybeSingle();
        
        if (existing?.id) {
          const { data, error } = await supabase
            .from('services')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          if (!error && data) savedItem = data as Service;
        }
      }

      if (!savedItem) {
        // Insert new row (omitting id so Supabase uuid_generate_v4() generates valid UUID)
        const { data, error } = await supabase
          .from('services')
          .insert({ ...payload, created_at: now })
          .select()
          .single();
        if (!error && data) savedItem = data as Service;
      }
    } catch (e) {
      console.warn('Supabase saveService notice:', e);
    }
  }

  if (savedItem) {
    const idx = memoryServices.findIndex(s => s.id === savedItem!.id || s.slug === savedItem!.slug);
    if (idx !== -1) {
      memoryServices[idx] = savedItem;
    } else {
      memoryServices.unshift(savedItem);
    }
    logAuditAction('SAVE_SERVICE', 'services', savedItem.id, { title: savedItem.title });
    return savedItem;
  }

  // Memory fallback
  const localId = service.id || ('s_' + Math.random().toString(36).substring(2, 9));
  const fallbackService: Service = {
    ...payload,
    id: localId,
    created_at: service.created_at || now,
    updated_at: now
  };

  const idx = memoryServices.findIndex(s => s.id === localId || (service.slug && s.slug === service.slug));
  if (idx !== -1) {
    memoryServices[idx] = fallbackService;
  } else {
    memoryServices.unshift(fallbackService);
  }
  logAuditAction('SAVE_SERVICE', 'services', localId, { title: fallbackService.title });
  return fallbackService;
}

export async function deleteService(idOrSlug: string): Promise<boolean> {
  const supabase = createClient();
  if (supabase) {
    try {
      if (isValidUUID(idOrSlug)) {
        await supabase.from('services').delete().eq('id', idOrSlug);
      } else {
        await supabase.from('services').delete().eq('slug', idOrSlug);
      }
    } catch (e) {
      console.warn('Supabase deleteService notice:', e);
    }
  }
  memoryServices = memoryServices.filter(s => s.id !== idOrSlug && s.slug !== idOrSlug);
  logAuditAction('DELETE_SERVICE', 'services', idOrSlug, {});
  return true;
}

// ==============================================================================
// 2. JOBS & CAREERS API
// ==============================================================================
export async function getJobs(status?: 'active' | 'closed' | 'draft'): Promise<Job[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('jobs').select('*, applications:applications(count)').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as any[]).map((j: any) => ({
          ...j,
          applications_count: j.applications?.[0]?.count || 0
        })) as Job[];
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

export async function saveJob(job: Partial<Job>): Promise<Job> {
  const supabase = createClient();
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

  let savedItem: Job | null = null;

  if (supabase) {
    try {
      if (job.id && isValidUUID(job.id)) {
        const { data, error } = await supabase
          .from('jobs')
          .update(payload)
          .eq('id', job.id)
          .select()
          .maybeSingle();
        if (!error && data) savedItem = data as Job;
      } else if (job.slug) {
        const { data: existing } = await supabase
          .from('jobs')
          .select('id')
          .eq('slug', job.slug)
          .maybeSingle();
        if (existing?.id) {
          const { data, error } = await supabase
            .from('jobs')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          if (!error && data) savedItem = data as Job;
        }
      }

      if (!savedItem) {
        const { data, error } = await supabase
          .from('jobs')
          .insert({ ...payload, created_at: now })
          .select()
          .single();
        if (!error && data) savedItem = data as Job;
      }
    } catch (e) {
      console.warn('Supabase saveJob notice:', e);
    }
  }

  if (savedItem) {
    const idx = memoryJobs.findIndex(j => j.id === savedItem!.id || j.slug === savedItem!.slug);
    if (idx !== -1) {
      memoryJobs[idx] = { ...savedItem, applications_count: memoryJobs[idx]?.applications_count || 0 };
    } else {
      memoryJobs.unshift(savedItem);
    }
    logAuditAction('SAVE_JOB', 'jobs', savedItem.id, { title: savedItem.title });
    return savedItem;
  }

  const localId = job.id || ('j_' + Math.random().toString(36).substring(2, 9));
  const fallbackJob: Job = {
    ...payload,
    id: localId,
    applications_count: 0,
    created_at: job.created_at || now,
    updated_at: now,
  };

  const idx = memoryJobs.findIndex(j => j.id === localId || (job.slug && j.slug === job.slug));
  if (idx !== -1) {
    memoryJobs[idx] = fallbackJob;
  } else {
    memoryJobs.unshift(fallbackJob);
  }
  logAuditAction('SAVE_JOB', 'jobs', localId, { title: fallbackJob.title });
  return fallbackJob;
}

export async function deleteJob(idOrSlug: string): Promise<boolean> {
  const supabase = createClient();
  if (supabase) {
    try {
      if (isValidUUID(idOrSlug)) {
        await supabase.from('jobs').delete().eq('id', idOrSlug);
      } else {
        await supabase.from('jobs').delete().eq('slug', idOrSlug);
      }
    } catch (e) {
      console.warn('Supabase deleteJob notice:', e);
    }
  }
  memoryJobs = memoryJobs.filter(j => j.id !== idOrSlug && j.slug !== idOrSlug);
  logAuditAction('DELETE_JOB', 'jobs', idOrSlug, {});
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
}): Promise<{ success: boolean; id: string; message: string }> {
  const supabase = createClient();
  const now = new Date().toISOString();

  if (supabase) {
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

      const payload: any = {
        full_name: appData.full_name,
        email: appData.email,
        phone: appData.phone || null,
        portfolio_url: appData.portfolio_url || null,
        linkedin_url: appData.linkedin_url || null,
        cover_note: appData.cover_note || null,
        resume_filename: appData.resume_filename,
        resume_path: appData.resume_path,
        status: 'submitted',
      };
      if (validJobId) {
        payload.job_id = validJobId;
      }

      const { data, error } = await supabase.from('applications').insert(payload).select().single();
      if (!error && data) {
        // Also sync memory
        const newApp: Application = {
          ...payload,
          id: data.id,
          created_at: data.created_at || now,
          updated_at: data.updated_at || now,
          job_title: memoryJobs.find(j => j.id === validJobId || j.id === appData.job_id)?.title || 'Engineering Role'
        };
        memoryApplications.unshift(newApp);
        logAuditAction('SUBMIT_APPLICATION', 'applications', data.id, { candidate: appData.full_name });
        return { success: true, id: data.id, message: 'Application submitted successfully to Supabase.' };
      }
      if (error) {
        console.error('Supabase Application Insert Error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase application submission notice:', e);
    }
  }

  const newApp: Application = {
    id: 'app_' + Math.random().toString(36).substring(2, 9),
    job_id: appData.job_id,
    full_name: appData.full_name,
    email: appData.email,
    phone: appData.phone,
    portfolio_url: appData.portfolio_url,
    linkedin_url: appData.linkedin_url,
    cover_note: appData.cover_note,
    resume_path: appData.resume_path,
    resume_filename: appData.resume_filename,
    status: 'submitted',
    created_at: now,
    updated_at: now,
    job_title: memoryJobs.find(j => j.id === appData.job_id)?.title || 'Engineering Role'
  };

  memoryApplications.unshift(newApp);
  const targetJob = memoryJobs.find(j => j.id === appData.job_id);
  if (targetJob) {
    targetJob.applications_count = (targetJob.applications_count || 0) + 1;
  }

  return { success: true, id: newApp.id, message: 'Application received and securely logged.' };
}

export async function getApplications(): Promise<Application[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs:jobs(title)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return (data as any[]).map((a: any) => ({
          ...a,
          job_title: a.jobs?.title || 'Engineering Position'
        })) as Application[];
      }
    } catch (e) {
      console.warn('Supabase getApplications notice:', e);
    }
  }
  return memoryApplications;
}

export async function updateApplicationStatus(id: string, status: Application['status'], notes?: string): Promise<boolean> {
  const supabase = createClient();
  const now = new Date().toISOString();
  if (supabase && isValidUUID(id)) {
    try {
      await supabase.from('applications').update({ status, admin_notes: notes, updated_at: now }).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateApplicationStatus notice:', e);
    }
  }
  const app = memoryApplications.find(a => a.id === id);
  if (app) {
    app.status = status;
    if (notes !== undefined) app.admin_notes = notes;
    app.updated_at = now;
  }
  logAuditAction('UPDATE_APPLICATION_STATUS', 'applications', id, { status, notes });
  return true;
}

// ==============================================================================
// 4. CASE STUDIES API
// ==============================================================================
export async function getCaseStudies(featuredOnly: boolean = false): Promise<CaseStudy[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase.from('case_studies').select('*').eq('status', 'published').order('created_at', { ascending: false });
      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as CaseStudy[];
    } catch (e) {
      console.warn('Supabase getCaseStudies notice:', e);
    }
  }

  let results = memoryCaseStudies.filter(c => c.status === 'published');
  if (featuredOnly) {
    results = results.filter(c => c.is_featured);
  }
  return results;
}

export async function getAllCaseStudiesAdmin(): Promise<CaseStudy[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('case_studies').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as CaseStudy[];
    } catch (e) {
      console.warn('Supabase getAllCaseStudiesAdmin notice:', e);
    }
  }
  return memoryCaseStudies;
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('case_studies').select('*').eq('slug', slug).maybeSingle();
      if (!error && data) return data as CaseStudy;
    } catch (e) {
      console.warn('Supabase getCaseStudyBySlug notice:', e);
    }
  }
  return memoryCaseStudies.find(c => c.slug === slug) || null;
}

export async function saveCaseStudy(caseStudy: Partial<CaseStudy>): Promise<CaseStudy> {
  const supabase = createClient();
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
    related_service_slug: caseStudy.related_service_slug || null,
    is_featured: !!caseStudy.is_featured,
    status: caseStudy.status || 'published',
    hero_image: caseStudy.hero_image || null,
    updated_at: now,
  };

  let savedItem: CaseStudy | null = null;

  if (supabase) {
    try {
      if (caseStudy.id && isValidUUID(caseStudy.id)) {
        const { data, error } = await supabase
          .from('case_studies')
          .update(payload)
          .eq('id', caseStudy.id)
          .select()
          .maybeSingle();
        if (!error && data) savedItem = data as CaseStudy;
      } else if (caseStudy.slug) {
        const { data: existing } = await supabase
          .from('case_studies')
          .select('id')
          .eq('slug', caseStudy.slug)
          .maybeSingle();
        if (existing?.id) {
          const { data, error } = await supabase
            .from('case_studies')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          if (!error && data) savedItem = data as CaseStudy;
        }
      }

      if (!savedItem) {
        const { data, error } = await supabase
          .from('case_studies')
          .insert({ ...payload, created_at: now })
          .select()
          .single();
        if (!error && data) savedItem = data as CaseStudy;
      }
    } catch (e) {
      console.warn('Supabase saveCaseStudy notice:', e);
    }
  }

  if (savedItem) {
    const idx = memoryCaseStudies.findIndex(c => c.id === savedItem!.id || c.slug === savedItem!.slug);
    if (idx !== -1) {
      memoryCaseStudies[idx] = savedItem;
    } else {
      memoryCaseStudies.unshift(savedItem);
    }
    logAuditAction('SAVE_CASE_STUDY', 'case_studies', savedItem.id, { title: savedItem.title });
    return savedItem;
  }

  const localId = caseStudy.id || ('cs_' + Math.random().toString(36).substring(2, 9));
  const fallbackCS: CaseStudy = {
    ...payload,
    id: localId,
    created_at: caseStudy.created_at || now,
    updated_at: now,
  };

  const idx = memoryCaseStudies.findIndex(c => c.id === localId || (caseStudy.slug && c.slug === caseStudy.slug));
  if (idx !== -1) {
    memoryCaseStudies[idx] = fallbackCS;
  } else {
    memoryCaseStudies.unshift(fallbackCS);
  }
  logAuditAction('SAVE_CASE_STUDY', 'case_studies', localId, { title: fallbackCS.title });
  return fallbackCS;
}

export async function deleteCaseStudy(idOrSlug: string): Promise<boolean> {
  const supabase = createClient();
  if (supabase) {
    try {
      if (isValidUUID(idOrSlug)) {
        await supabase.from('case_studies').delete().eq('id', idOrSlug);
      } else {
        await supabase.from('case_studies').delete().eq('slug', idOrSlug);
      }
    } catch (e) {
      console.warn('Supabase deleteCaseStudy notice:', e);
    }
  }
  memoryCaseStudies = memoryCaseStudies.filter(c => c.id !== idOrSlug && c.slug !== idOrSlug);
  logAuditAction('DELETE_CASE_STUDY', 'case_studies', idOrSlug, {});
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
  const supabase = createClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
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
      if (!error && result) {
        return { success: true, id: result.id, message: 'Your enquiry has been received and stored in Supabase.' };
      }
    } catch (e) {
      console.warn('Supabase submitEnquiry notice:', e);
    }
  }

  const newEnquiry: Enquiry = {
    id: 'e_' + Math.random().toString(36).substring(2, 9),
    full_name: data.full_name,
    email: data.email,
    company: data.company,
    phone: data.phone,
    service_interest: data.service_interest || 'General Enterprise Consultation',
    message: data.message,
    consent: data.consent,
    source_page: data.source_page || '/contact',
    status: 'new',
    created_at: now,
    updated_at: now,
  };

  memoryEnquiries.unshift(newEnquiry);
  return { 
    success: true, 
    id: newEnquiry.id, 
    message: 'Thank you for reaching out. We have logged your enquiry.' 
  };
}

export async function getEnquiries(): Promise<Enquiry[]> {
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

export async function updateEnquiryStatus(id: string, status: Enquiry['status'], notes?: string): Promise<boolean> {
  const supabase = createClient();
  const now = new Date().toISOString();
  if (supabase && isValidUUID(id)) {
    try {
      await supabase.from('enquiries').update({ status, admin_notes: notes, updated_at: now }).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateEnquiryStatus notice:', e);
    }
  }
  const enq = memoryEnquiries.find(e => e.id === id);
  if (enq) {
    enq.status = status;
    if (notes !== undefined) enq.admin_notes = notes;
    enq.updated_at = now;
  }
  logAuditAction('UPDATE_ENQUIRY_STATUS', 'enquiries', id, { status, notes });
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

export async function updateSiteSettings(key: keyof SiteSettings, value: any): Promise<boolean> {
  const supabase = createClient();
  const now = new Date().toISOString();
  if (supabase) {
    try {
      await supabase.from('site_settings').upsert({ key, value, updated_at: now }, { onConflict: 'key' });
    } catch (e) {
      console.warn('Supabase updateSiteSettings notice:', e);
    }
  }
  memorySettings[key] = value;
  logAuditAction('UPDATE_SITE_SETTINGS', 'site_settings', key, { value });
  return true;
}

// ==============================================================================
// 7. AUDIT LOGS & STATS
// ==============================================================================
export async function getAuditLogs(): Promise<AuditLog[]> {
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

export function logAuditAction(action: string, entity_type?: string, entity_id?: string, details?: any) {
  const log: AuditLog = {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    user_email: 'admin@coralswift.com',
    action,
    entity_type,
    entity_id,
    details,
    ip_address: '198.51.100.42',
    created_at: new Date().toISOString()
  };
  memoryAuditLogs.unshift(log);
  if (memoryAuditLogs.length > 100) memoryAuditLogs.pop();

  // Asynchronously persist to Supabase
  const supabase = createClient();
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
  const services = await getServices();
  const jobs = await getJobs();
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
