import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let cachedClient: any = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
}
