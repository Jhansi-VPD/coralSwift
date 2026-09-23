import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Try Supabase Auth user session first
    const supabase = createClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          return NextResponse.json({
            authenticated: true,
            email: user.email,
            role: user.user_metadata?.role || 'admin',
          });
        }
      } catch (err) {
        console.warn('Supabase auth getUser notice:', err);
      }
    }

    // 2. Fallback to session cookie token (coralswift_admin_session)
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session.valid && session.email) {
        return NextResponse.json({
          authenticated: true,
          email: session.email,
          role: 'admin',
        });
      }
    }

    return NextResponse.json(
      { authenticated: false, error: 'Not authenticated' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
