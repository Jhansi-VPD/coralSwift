/**
 * FASTAPI API BASE
 *
 * The Next.js app no longer hosts /api routes — all data comes from the
 * standalone FastAPI backend (see backend/app/main.py). This module is the
 * single source of truth for:
 *   - the backend origin (NEXT_PUBLIC_API_URL, default http://localhost:8000)
 *   - bearer-token persistence (localStorage `coralswift_admin_auth`)
 *   - authenticated fetch headers
 */

const TOKEN_KEY = 'coralswift_admin_auth';

export function getApiBaseUrl(): string {
  // NEXT_PUBLIC_API_URL=http://localhost:8000 in dev; set to the deployed
  // FastAPI service in production (no trailing slash).
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  if (
    typeof window !== 'undefined' &&
    !process.env.NEXT_PUBLIC_API_URL &&
    process.env.NODE_ENV === 'development'
  ) {
    // One-time dev hint: a missing .env.local silently targets port 8000,
    // which may be another service entirely (or nothing at all).
    console.warn(
      '[coralswift] NEXT_PUBLIC_API_URL is not set — defaulting to http://localhost:8000. ' +
        'Create frontend/.env.local (e.g. NEXT_PUBLIC_API_URL=http://localhost:8001) and restart `npm run dev`.'
    );
  }
  return raw.replace(/\/+$/, '');
}

/** Resolve a relative API path against the backend origin. */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode) — session lives for the tab only
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem('coralswift_admin_email');
    window.localStorage.removeItem('coralswift_admin_role');
  } catch {
    // ignore
  }
}

/** Headers for JSON calls; merges in the Authorization header when a token exists. */
export function authHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Headers for FormData calls (browser sets the multipart boundary). */
export function authFormHeaders(): Record<string, string> {
  return authHeaders(false);
}
