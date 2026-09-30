import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const SHEET_SELECT = `
  id, work_date, hours, notes, status, review_notes, reviewed_at,
  project:projects (id, name, code),
  task:tasks (id, title)
`;

async function myEmployeeId(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/employee/timesheets — own entries.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const status = searchParams.get('status');

  let query = guard.supabase.from('timesheets').select(SHEET_SELECT).eq('employee_id', myId);
  if (from) query = query.gte('work_date', from);
  if (to) query = query.lte('work_date', to);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('work_date', { ascending: false }).limit(500);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/employee/timesheets — log hours on a project/task for a date.
 * Body: { workDate, hours, projectId?, taskId?, notes? }
 * Rejects duplicates for the same date+task.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    workDate: string;
    hours: number;
    projectId?: string;
    taskId?: string;
    notes?: string;
  }>(request, ['workDate', 'hours']);
  if (isRejected(body)) return body;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return jsonError('No employee record; contact HR', 400);

  const hours = Number(body.hours);
  if (!(hours > 0 && hours <= 24)) {
    return jsonError('hours must be between 0 (exclusive) and 24', 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.workDate)) {
    return jsonError('workDate must be YYYY-MM-DD', 400);
  }

  // Reject exact duplicate (same date + task)
  if (body.taskId) {
    const { data: dup } = await guard.supabase
      .from('timesheets')
      .select('id')
      .eq('employee_id', myId)
      .eq('work_date', body.workDate)
      .eq('task_id', body.taskId)
      .maybeSingle();
    if (dup) return jsonError('Hours already logged for this task and date; edit the existing entry', 409);
  }

  const { data, error } = await guard.supabase
    .from('timesheets')
    .insert({
      employee_id: myId,
      work_date: body.workDate,
      hours,
      project_id: body.projectId || null,
      task_id: body.taskId || null,
      notes: body.notes || null,
      status: 'pending', // goes straight to the manager's approvals inbox
    })
    .select(SHEET_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  await audit('LOG_TIME', 'timesheets', data.id, guard, { date: body.workDate, hours }, request.headers.get('x-real-ip'));
  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/employee/timesheets — edit own entry while not yet approved.
 * Body: { id, hours?, notes?, taskId?, projectId?, cancel? }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    hours?: number;
    notes?: string;
    taskId?: string;
    projectId?: string;
    cancel?: boolean;
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return jsonError('No employee record', 400);

  // Own + not-approved scope enforced in the update itself
  if (body.cancel) {
    const { error } = await guard.supabase
      .from('timesheets')
      .update({ status: 'draft' })
      .eq('id', body.id)
      .eq('employee_id', myId)
      .eq('status', 'pending');
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ success: true, cancelled: true });
  }

  const updates: Record<string, unknown> = {};
  if (body.hours !== undefined) {
    const hours = Number(body.hours);
    if (!(hours > 0 && hours <= 24)) return jsonError('hours must be between 0 and 24', 400);
    updates.hours = hours;
  }
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.taskId !== undefined) updates.task_id = body.taskId || null;
  if (body.projectId !== undefined) updates.project_id = body.projectId || null;
  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await guard.supabase
    .from('timesheets')
    .update(updates)
    .eq('id', body.id)
    .eq('employee_id', myId)
    .in('status', ['draft', 'pending', 'rejected']) // cannot touch approved entries
    .select(SHEET_SELECT)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Entry not found or already approved', 404);

  await audit('EDIT_TIME', 'timesheets', body.id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json(data);
}
