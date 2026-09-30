/**
 * SERVER-SIDE AUTH HELPERS
 *
 * Per-user sessions on Supabase Auth. The signed-in user's JWT lands in an
 * HttpOnly cookie managed by @supabase/ssr; every API handler resolves the
 * caller's identity + role through getUserProfile() and enforces permissions
 * with requireRole()/requirePermission() from api-helpers.ts.
 *
 * Legacy admin (env-credential + HMAC cookie) continues to work alongside.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Role, SessionUser } from './rbac';

/** Supabase client bound to the incoming request's cookies (reads the session JWT). */
export function createAuthClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a context where cookies are already sent (Server Component)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // As above
        }
      },
    },
  });
}

/** Unscoped client for admin operations (auth.admin.createUser etc.). */
export function createServiceClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AuthContext {
  user: SessionUser;
  supabase: SupabaseClient;
}

/**
 * Resolves the current session: Supabase Auth user + their profile row (role).
 * Returns null when not signed in, inactive, or the profile is missing.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = createAuthClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile || !profile.is_active) return null;

  return {
    supabase,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role as Role,
      fullName: profile.full_name || '',
      isActive: profile.is_active,
    },
  };
}

/** service-role user provisioning (admin/HR create accounts) */
export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
}

/**
 * Creates an auth user + profile row with the given role.
 * The DB trigger (handle_new_auth_user) also auto-creates the profile;
 * we upsert afterwards to guarantee name/phone overrides win.
 */
export async function provisionUser(data: CreateUserData): Promise<{ id: string; email: string }> {
  const serviceClient = createServiceClient();
  if (!serviceClient) throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing');

  const { data: created, error } = await serviceClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // skip invite flow in phase 1
    user_metadata: { full_name: data.fullName, role: data.role },
  });

  if (error) throw new Error(error.message || 'Failed to create user');

  const userId = created.user!.id;

  const { error: profileError } = await serviceClient
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        phone: data.phone || null,
      },
      { onConflict: 'id' }
    );

  if (profileError) throw new Error(profileError.message || 'Failed to create profile');

  return { id: userId, email: created.user!.email! };
}
