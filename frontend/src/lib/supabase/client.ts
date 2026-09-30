import { createClient as createSupabaseBrowserClient } from '@supabase/supabase-js';

let cachedClient: any = null;

/**
 * Browser-side Supabase client (anon key, RLS applies).
 *
 * After the FastAPI migration this is used only for non-authoritative reads
 * (marketing content on the marketing pages, header identity display).
 * All portal/admin data flows through the FastAPI backend via
 * `portalClient` / `api.ts` with a Bearer token — see api-base.ts.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
}
