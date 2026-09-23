import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initialAuditLogs } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data, error } = await adminClient
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data && data.length > 0) {
          return NextResponse.json(data);
        }
      } catch (e) {
        console.warn('Supabase admin audit-logs query fallback:', e);
      }
    }
    return NextResponse.json(initialAuditLogs);
  } catch (error: any) {
    return NextResponse.json(initialAuditLogs);
  }
}
