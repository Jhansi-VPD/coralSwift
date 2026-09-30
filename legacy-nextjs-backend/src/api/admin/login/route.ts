import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@backend/lib/supabase/client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createSessionToken, SESSION_COOKIE_NAME } from '@backend/lib/auth';
import { checkLoginRateLimit, resetLoginRateLimit } from '@backend/lib/rate-limit';
import { timingSafeEqual } from 'crypto';

/**
 * FIX (ISSUES_REPORT #6): constant-time comparison so response timing
 * cannot leak the configured admin password character-by-character.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Compare against itself to burn equivalent time, then fail
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.max(retryAfter, 900)) },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let authenticatedEmail: string | null = null;

    // 1. Try Authenticating with Supabase Auth
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error && data?.user?.email) {
          authenticatedEmail = data.user.email;
        }
      } catch (authErr) {
        console.warn('Supabase Auth attempt notice:', authErr);
      }
    }

    // 2. Check Environment Variables (ADMIN_EMAIL & ADMIN_PASSWORD) - Server-side only
    if (!authenticatedEmail) {
      const configuredEmail = process.env.ADMIN_EMAIL;
      const configuredPassword = process.env.ADMIN_PASSWORD;

      if (configuredEmail && configuredPassword) {
        const isEmailMatch = email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
        const isPasswordMatch = safeEqual(password, configuredPassword);

        if (isEmailMatch && isPasswordMatch) {
          authenticatedEmail = configuredEmail;
        }
      }
    }

    if (authenticatedEmail) {
      await resetLoginRateLimit(ip);

      // FIX (ISSUES_REPORT #4): audit login server-side. The previous client-side
      // logAuditAction call was silently rejected by RLS (anon has no insert on
      // audit_logs). Written here with the service-role key so it always lands.
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-project')) {
          const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          await serviceClient.from('audit_logs').insert({
            user_email: authenticatedEmail,
            action: 'ADMIN_LOGIN_SUCCESS',
            entity_type: 'AUTH',
            entity_id: 'usr_admin',
            details: { method: 'env_credentials', ip },
            ip_address: ip,
          });
        }
      } catch (auditErr) {
        console.warn('Login audit write failed:', auditErr);
      }

      const token = await createSessionToken(authenticatedEmail);
      const isProd = process.env.NODE_ENV === 'production';

      const response = NextResponse.json({
        success: true,
        user: {
          email: authenticatedEmail,
          role: 'admin',
        },
      });

      // Set secure HttpOnly session cookie
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid email or password. Please try again.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Admin login handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
