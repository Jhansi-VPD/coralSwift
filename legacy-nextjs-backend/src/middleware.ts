import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SESSION_COOKIE_NAME = 'coralswift_admin_session';

/**
 * Verify HMAC session token using Web Crypto API (Edge-compatible).
 * Mirrors the logic in lib/auth.ts but uses only standard Web APIs.
 */
async function verifySessionToken(token: string): Promise<boolean> {
  const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
  if (!SESSION_SECRET) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    const keyData = encoder.encode(SESSION_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      encoder.encode(payloadB64)
    );

    if (!isValid) return false;

    // Check expiration (7 days)
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const { timestamp } = JSON.parse(payloadJson);
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// ROLE-BASED API PROTECTION (new backend)
// ---------------------------------------------------------------------------
const PROTECTED_API_PREFIXES = [
  '/api/hr',
  '/api/sales',
  '/api/manager',
  '/api/client',
  '/api/employee/notifications', // notifications are for signed-in users of any role
];

const STAFF_API_PREFIXES = [
  '/api/hr',
  '/api/sales',
  '/api/manager',
];

/**
 * Resolve the Supabase Auth user's role from their session cookie (Edge-safe).
 * Returns null when there is no valid Supabase session.
 */
async function getSupabaseUserRole(request: NextRequest): Promise<{ role: string | null; response: NextResponse }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey || url.includes('your-project')) {
    return { role: null, response: NextResponse.next() };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never)
        );
      },
    },
  });

  // IMPORTANT: getUser() (not getSession) — validates the JWT with the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { role: null, response };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) return { role: null, response };
  return { role: profile.role as string, response };
}

/**
 * Routes that require authentication.
 * Public read (GET) and the login endpoints are excluded.
 */
function isProtectedRoute(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Login endpoints are always public
  if (pathname === '/api/admin/login') return false;
  if (pathname === '/api/auth/login') return false;
  if (pathname === '/api/applications/submit') return false; // public form
  if (pathname === '/api/enquiries/submit') return false;    // public form

  // New role-scoped API namespaces always require a session
  if (PROTECTED_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;
  if (pathname.startsWith('/api/employee/')) return true;    // employee self-service
  if (pathname.startsWith('/api/auth/')) return pathname === '/api/auth/me' ? false : true;

  // All /api/admin/* routes require auth (legacy HMAC or Supabase admin)
  if (pathname.startsWith('/api/admin/')) return true;

  // Admin case-studies GET with mode=admin requires auth
  if (pathname === '/api/case-studies' && method === 'GET') {
    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'admin') return true;
  }

  // Admin-mode GETs on services/jobs require auth
  if ((pathname === '/api/services' || pathname === '/api/jobs') && method === 'GET') {
    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'admin') return true;
  }

  // All mutating API routes require auth
  if (pathname.startsWith('/api/')) {
    if (method === 'POST' || method === 'DELETE' || method === 'PUT' || method === 'PATCH') {
      return true;
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  if (!isProtectedRoute(request)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // ---- New role-scoped namespaces: require a Supabase session with an allowed role ----
  const isStaffNamespace = STAFF_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isRoleNamespace =
    isStaffNamespace ||
    pathname.startsWith('/api/employee/') ||
    pathname.startsWith('/api/client/');

  if (isRoleNamespace) {
    const { role, response } = await getSupabaseUserRole(request);

    if (!role) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Namespace ↔ role matrix (mirrors lib/rbac.ts)
    const allowed: Record<string, string[]> = {
      '/api/hr': ['admin', 'hr'],
      '/api/sales': ['admin', 'sales'],
      '/api/manager': ['admin', 'manager'],
      '/api/employee': ['admin', 'hr', 'sales', 'manager', 'employee'],
      '/api/client': ['admin', 'client'],
    };

    const namespace = Object.keys(allowed).find(p => pathname === p || pathname.startsWith(p + '/'));
    if (namespace && !allowed[namespace].includes(role)) {
      return NextResponse.json(
        { error: `Forbidden: role '${role}' cannot access ${namespace}` },
        { status: 403 }
      );
    }

    return response;
  }

  // ---- Legacy + admin routes: HMAC cookie, Supabase admin, or Bearer token ----
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let token: string | undefined = cookieToken;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Legacy HMAC path
  if (token && (await verifySessionToken(token))) {
    return NextResponse.next();
  }

  // Supabase admin path
  const { role, response } = await getSupabaseUserRole(request);
  if (role === 'admin') {
    return response;
  }

  if (!token && !role) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/services/:path*',
    '/api/jobs/:path*',
    '/api/case-studies/:path*',
    '/api/hr/:path*',
    '/api/sales/:path*',
    '/api/manager/:path*',
    '/api/employee/:path*',
    '/api/client/:path*',
    '/api/auth/:path*',
    '/api/applications/submit',
    '/api/enquiries/submit',
  ],
};
