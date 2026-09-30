import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const ENQUIRY_SELECT = `
  id, full_name, email, company, phone, service_interest, message,
  source_page, status, admin_notes, created_at,
  assigned_to, assigned_at, follow_up_at, meeting_at,
  assignee:profiles!enquiries_assigned_to_fkey (id, full_name, email, role)
`;

/**
 * GET /api/enquiries — staff enquiry list with search/filter/pagination.
 *
 * Access:
 *   - admin: all enquiries
 *   - sales: only enquiries assigned to them (auto-scoped)
 *
 * Query: ?status=&assignee=&q=&followUps=true&page=1&pageSize=25
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'sales');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  const q = searchParams.get('q')?.trim();
  const followUpsOnly = searchParams.get('followUps') === 'true';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(5, Number(searchParams.get('pageSize') || 25)));

  let query = guard.supabase
    .from('enquiries')
    .select(ENQUIRY_SELECT, { count: 'exact' });

  // Auto-scope sales to their own pipeline
  if (guard.user.role === 'sales') {
    query = query.eq('assigned_to', guard.user.id);
  } else if (assignee) {
    query = query.eq('assigned_to', assignee);
  }

  if (status && status !== 'all') query = query.eq('status', status);
  if (followUpsOnly) {
    query = query.not('follow_up_at', 'is', null).gte('follow_up_at', new Date().toISOString());
  }
  if (q) {
    // Search across name/company/email/message
    query = query.or(
      `full_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%`
    );
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({
    items: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
}
