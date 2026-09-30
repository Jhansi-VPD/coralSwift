/**
 * PORTAL API CLIENT
 *
 * Typed fetch wrapper for all role dashboards. Centralizes:
 *   - backend origin resolution (FastAPI; NEXT_PUBLIC_API_URL)
 *   - Bearer token injection (localStorage `coralswift_admin_auth`)
 *   - error extraction (FastAPI `{ detail }` shapes)
 *   - HTTP status handling (401 → re-auth, 403 → forbidden state, etc.)
 *   - JSON parsing
 *
 * UI → hook/service → portalClient → FastAPI → Supabase
 */
import { apiUrl, authHeaders, authFormHeaders, clearToken } from './api-base';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      credentials: 'omit',
      ...init,
      // headers after ...init so the auth headers always win
      headers: isForm ? authFormHeaders() : authHeaders(),
    });
  } catch {
    throw new ApiError('Network error — check your connection', 0);
  }

  if (res.status === 401) {
    clearToken();
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = (body as { detail?: unknown }).detail;
    throw new ApiError(
      (typeof detail === 'string' ? detail : undefined)
        || (body as { error?: string }).error
        || `Request failed (${res.status})`,
      res.status,
      (body as { code?: string }).code
    );
  }
  return body as T;
}

export const portalClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- Shared types (mirror backend responses) ----

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SessionUser {
  id: string | null;
  email: string;
  role: 'admin' | 'hr' | 'sales' | 'manager' | 'employee' | 'client';
  fullName: string;
  isActive: boolean;
}

export interface AdminStats {
  business: { totalEnquiries: number; newEnquiries: number; activeClients: number; activeProjects: number; completedProjects: number };
  sales: { byStage: Record<string, number>; openLeads: number; wonLeads: number; wonValue: number; pipelineValue: number };
  projects: { byStatus: Record<string, number>; byHealth: Record<string, number>; awaitingReview: number; changesRequested: number; avgProgress: number };
  employees: { total: number; active: number; byStatus: Record<string, number>; attendanceToday: Record<string, number>; onLeaveToday: number };
  finance: { invoiceCount: number; byStatus: Record<string, number>; invoiced: number; paid: number; outstanding: number };
  support: Record<string, number>;
  leavePending: number;
  recentActivity: { id: string; action: string; entity_type: string | null; user_email: string | null; created_at: string }[];
}

export interface EnquiryRecord {
  id: string;
  full_name: string;
  email: string;
  company: string;
  phone: string | null;
  service_interest: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_at: string | null;
  follow_up_at: string | null;
  meeting_at: string | null;
  assignee: { id: string; full_name: string; email: string; role: string } | null;
}

export interface ProjectRecord {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  health: string;
  progress_percent: number;
  client_review_status: string;
  client_feedback?: string | null;
  client_feedback_at?: string | null;
  submitted_for_review_at?: string | null;
  expected_completion_date: string | null;
  start_date: string | null;
  target_end_date: string | null;
  organization: { id: string; name: string } | null;
  manager: { id: string; employee_code: string; profile: { full_name: string } } | null;
  milestones: { id: string; title: string; description: string | null; due_date: string | null; status: string; sort_order: number; completed_at: string | null }[];
  updates?: { id: string; title: string; body: string | null; is_client_visible?: boolean; created_at: string; author: { full_name: string } | null }[];
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  estimated_hours: number | null;
  due_date: string | null;
  project: { id: string; name: string; code: string | null };
  milestone: { id: string; title: string } | null;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string | null;
  category: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function formatMoney(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}
