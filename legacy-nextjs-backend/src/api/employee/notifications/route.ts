import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employee/notifications — own notification inbox (any signed-in role).
 * Query: ?unread=true
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'hr', 'sales', 'manager', 'employee', 'client');
  if (isRejected(guard)) return guard;

  const unreadOnly = new URL(request.url).searchParams.get('unread') === 'true';

  let query = guard.supabase
    .from('notifications')
    .select('id, title, body, category, link, is_read, created_at')
    .eq('user_id', guard.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/** PATCH /api/employee/notifications — mark one or all as read. Body: { id? } (omit id = mark all) */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('admin', 'hr', 'sales', 'manager', 'employee', 'client');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id?: string }>(request, []);
  if (isRejected(body)) return body;

  let query = guard.supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', guard.user.id);

  if (body.id) query = query.eq('id', body.id);

  const { error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
