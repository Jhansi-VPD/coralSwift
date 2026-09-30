import { NextResponse } from 'next/server';
import { getAuthContext, createServiceClient } from '@backend/lib/auth-server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@backend/lib/auth';
import { ROLE_PERMISSIONS } from '@backend/lib/rbac';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me — resolves the current session for dashboards.
 * Checks Supabase Auth first, then the legacy admin HMAC cookie.
 * This is the endpoint every portal layout must call to gate rendering.
 */
export async function GET(request: NextRequest) {
  // Path 1: Supabase Auth session
  const ctx = await getAuthContext();
  if (ctx) {
    return NextResponse.json({
      authenticated: true,
      source: 'supabase',
      user: ctx.user,
      permissions: ROLE_PERMISSIONS[ctx.user.role],
    });
  }

  // Path 2: legacy admin HMAC cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session.valid && session.email) {
      return NextResponse.json({
        authenticated: true,
        source: 'legacy_admin',
        user: {
          id: null,
          email: session.email,
          role: 'admin',
          fullName: 'Administrator',
          isActive: true,
        },
        permissions: ROLE_PERMISSIONS.admin,
      });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

/**
 * POST /api/auth/me — service-only provisioning check helper.
 * Returns whether the backend is fully configured (no secrets revealed).
 */
export async function POST() {
  const service = createServiceClient();
  return NextResponse.json({
    backendConfigured: Boolean(service),
    authProvider: 'supabase',
  });
}
