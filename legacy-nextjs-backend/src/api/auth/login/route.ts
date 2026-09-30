import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, getAuthContext } from '@backend/lib/auth-server';
import { jsonError, audit } from '@backend/lib/api-helpers';
import { checkLoginRateLimit, resetLoginRateLimit } from '@backend/lib/rate-limit';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@backend/lib/auth';
import { createServiceClient } from '@backend/lib/auth-server';
import { ROLE_ROUTE_PREFIXES, type Role } from '@backend/lib/rbac';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return 'unknown';
}

/**
 * Unified login for all six roles.
 * 1. Supabase Auth (per-user accounts) — primary path.
 * 2. Legacy admin env-credential fallback (backwards compatibility).
 * Returns the user's role + which dashboard to navigate to.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(retryAfter, 900)) } }
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return jsonError('Email and password are required', 400);
    }

    // ---------- Path 1: Supabase Auth per-user accounts ----------
    const supabase = createAuthClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        // Resolve role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.auth.signOut();
          return jsonError('Account is not provisioned. Contact your administrator.', 403);
        }
        if (!profile.is_active) {
          await supabase.auth.signOut();
          return jsonError('Account is deactivated. Contact your administrator.', 403);
        }

        await resetLoginRateLimit(ip);
        const role = profile.role as Role;

        // Server-side audit (service client bypasses RLS; Issue #4 fix)
        await audit('USER_LOGIN', 'auth', profile.id, null, {
          email,
          role,
          method: 'supabase_auth',
        }, ip);

        return NextResponse.json({
          success: true,
          user: {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            role,
          },
          redirectTo: ROLE_ROUTE_PREFIXES[role] || '/',
        });
      }
    }

    // ---------- Path 2: legacy admin env credentials ----------
    const configuredEmail = process.env.ADMIN_EMAIL;
    const configuredPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.ADMIN_SESSION_SECRET;

    if (configuredEmail && configuredPassword && sessionSecret) {
      const isEmailMatch = email.toLowerCase() === configuredEmail.trim().toLowerCase();
      const isPasswordMatch = password === configuredPassword; // timing-safe version applied in admin login route

      if (isEmailMatch && isPasswordMatch) {
        const { createSessionToken } = await import('@backend/lib/auth');
        await resetLoginRateLimit(ip);
        const token = await createSessionToken(configuredEmail);
        const isProd = process.env.NODE_ENV === 'production';

        await audit('USER_LOGIN', 'auth', null, null, {
          email,
          role: 'admin',
          method: 'legacy_env',
        }, ip);

        const response = NextResponse.json({
          success: true,
          user: { email: configuredEmail, role: 'admin' as Role },
          redirectTo: ROLE_ROUTE_PREFIXES.admin,
        });
        response.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });
        return response;
      }
    }

    return jsonError('Invalid email or password', 401);
  } catch (error) {
    console.error('Login handler error:', error);
    return jsonError('Authentication error', 500);
  }
}

/** GET /api/auth/login is not valid — point devs at POST */
export async function GET() {
  return jsonError('Use POST to authenticate', 405);
}

/** Sign out — clears the Supabase session (and legacy cookie). */
export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (ctx) {
    await audit('USER_LOGOUT', 'auth', ctx.user.id, ctx, undefined, getClientIp(request));
    await ctx.supabase.auth.signOut();
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
