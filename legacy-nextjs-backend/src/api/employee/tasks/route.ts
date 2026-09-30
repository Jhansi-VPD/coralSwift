import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const MY_TASK_SELECT = `
  id, title, description, priority, status, estimated_hours, due_date, created_at, updated_at,
  project:projects (id, name, code, organization:client_organizations (name)),
  milestone:milestones (id, title)
`;

async function myEmployeeId(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/employee/tasks — tasks assigned to the signed-in employee.
 * Query: ?status=todo|in_progress|...
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return NextResponse.json([]);

  const status = new URL(request.url).searchParams.get('status');
  let query = guard.supabase.from('tasks').select(MY_TASK_SELECT).eq('assignee_id', myId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * PATCH /api/employee/tasks — update OWN task (status transitions + notes).
 * Body: { id, status?, description? }
 * Allowed statuses: todo, in_progress, in_review, blocked, done.
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string; status?: string; description?: string }>(request, ['id']);
  if (isRejected(body)) return body;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return jsonError('No employee record', 400);

  if (body.status && !['todo', 'in_progress', 'in_review', 'blocked', 'done'].includes(body.status)) {
    return jsonError('invalid status', 400);
  }

  // Strictly own tasks
  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.description !== undefined) updates.description = body.description;
  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await guard.supabase
    .from('tasks')
    .update(updates)
    .eq('id', body.id)
    .eq('assignee_id', myId)
    .select('id, title, status')
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Task not found among your assignments', 404);

  await audit('EMPLOYEE_TASK_UPDATE', 'tasks', body.id, guard, { status: updates.status }, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true, task: data });
}
