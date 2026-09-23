import { NextRequest, NextResponse } from 'next/server';

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

/**
 * Routes that require authentication.
 * Public read (GET) and the login endpoint are excluded.
 */
function isProtectedRoute(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Login endpoint is always public
  if (pathname === '/api/admin/login') return false;

  // All /api/admin/* routes require auth (except login above)
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

  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Also check Authorization header for Bearer token
  let token = cookieToken;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const valid = await verifySessionToken(token);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/services/:path*',
    '/api/jobs/:path*',
    '/api/case-studies/:path*',
  ],
};
