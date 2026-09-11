import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
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

    // 2. Fallback / Direct Admin Authentication (Zero-config support for Vercel & Local)
    if (!authenticatedEmail) {
      const configuredEmail = process.env.ADMIN_EMAIL || 'admin@coralswift.com';
      const configuredPassword = process.env.ADMIN_PASSWORD || 'CoralAdmin2026!';

      const isEmailMatch = email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
      const isPasswordMatch = password === configuredPassword;

      if (isEmailMatch && isPasswordMatch) {
        authenticatedEmail = configuredEmail;
      }
    }

    if (authenticatedEmail) {
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
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
