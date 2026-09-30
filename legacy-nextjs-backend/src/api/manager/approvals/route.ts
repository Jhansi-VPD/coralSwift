import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function employeeIdOf(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/manager/approvals — unified approvals inbox.
 * Returns pending timesheets AND pending leave for the manager's direct reports.
 */
export async function GET() {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  if (guard.user.role === 'admin') {
    // Admins see all pending
    const [ts, lv] = await Promise.all([
      guard.supabase
        .from('timesheets')
        .select(`id, work_date, hours, notes, created_at,
          employee:employees (id, employee_code, profile:profiles (full_name)),
          project:projects (name)`)
        .eq('status', 'pending')
        .order('work_date'),
      guard.supabase
        .from('leave_requests')
        .select(`id, leave_type, start_date, end_date, reason, created_at,
          employee:employees (id, employee_code, profile:profiles (full_name))`)
        .eq('status', 'pending')
        .order('start_date'),
    ]);
    if (ts.error) return jsonError(ts.error.message, 500);
    if (lv.error) return jsonError(lv.error.message, 500);
    return NextResponse.json({ timesheets: ts.data, leave: lv.data });
  }

  const myId = await employeeIdOf(guard.supabase, guard.user.id);
  if (!myId) return NextResponse.json({ timesheets: [], leave: [] });

  const [ts, lv] = await Promise.all([
    guard.supabase
      .from('timesheets')
      .select(`id, work_date, hours, notes, created_at,
        employee:employees!inner (id, employee_code, manager_id, profile:profiles (full_name)),
        project:projects (name)`)
      .eq('status', 'pending')
      .eq('employee.manager_id', myId)
      .order('work_date'),
    guard.supabase
      .from('leave_requests')
      .select(`id, leave_type, start_date, end_date, reason, created_at,
        employee:employees!inner (id, employee_code, manager_id, profile:profiles (full_name))`)
      .eq('status', 'pending')
      .eq('employee.manager_id', myId)
      .order('start_date'),
  ]);

  if (ts.error) return jsonError(ts.error.message, 500);
  if (lv.error) return jsonError(lv.error.message, 500);
  return NextResponse.json({ timesheets: ts.data, leave: lv.data });
}

/**
 * POST /api/manager/approvals — approve/reject a timesheet or leave request.
 * Body: { type: 'timesheet'|'leave', id, decision: 'approved'|'rejected', notes? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ type: string; id: string; decision: string; notes?: string }>(
    request, ['type', 'id', 'decision']
  );
  if (isRejected(body)) return body;

  if (!['timesheet', 'leave'].includes(body.type)) {
    return jsonError("type must be 'timesheet' or 'leave'", 400);
  }
  if (!['approved', 'rejected'].includes(body.decision)) {
    return jsonError("decision must be 'approved' or 'rejected'", 400);
  }

  const reviewerId = await employeeIdOf(guard.supabase, guard.user.id);
  const now = new Date().toISOString();

  if (body.type === 'timesheet') {
    // Scope: manager owns the employee
    if (guard.user.role === 'manager') {
      const { data: entry } = await guard.supabase
        .from('timesheets')
        .select('id, employee:employees!inner (manager_id)')
        .eq('id', body.id)
        .eq('employee.manager_id', reviewerId)
        .maybeSingle();
      if (!entry) return jsonError('Timesheet not found in your team', 404);
    }

    const { data: updated, error } = await guard.supabase
      .from('timesheets')
      .update({
        status: body.decision,
        reviewer_id: reviewerId,
        reviewed_at: now,
        review_notes: body.notes || null,
      })
      .eq('id', body.id)
      .select('id, status, employee_id')
      .single();

    if (error) return jsonError(error.message, 500);
    await audit(`TIMESHEET_${body.decision.toUpperCase()}`, 'timesheets', body.id, guard);

    const { data: emp } = await guard.supabase
      .from('employees').select('profile_id').eq('id', updated.employee_id).maybeSingle();
    if (emp?.profile_id) {
      await notify(emp.profile_id, `Timesheet ${body.decision}`, `Your timesheet entry was ${body.decision}.`, 'timesheet', '/employee/timesheets');
    }
    return NextResponse.json({ success: true });
  }

  // leave — same logic as HR but scoped to direct reports
  if (guard.user.role === 'manager') {
    const { data: req } = await guard.supabase
      .from('leave_requests')
      .select('id, employee:employees!inner (manager_id)')
      .eq('id', body.id)
      .eq('employee.manager_id', reviewerId)
      .maybeSingle();
    if (!req) return jsonError('Leave request not found in your team', 404);
  }

  const { data: leaveUpdated, error } = await guard.supabase
    .from('leave_requests')
    .update({
      status: body.decision,
      reviewer_id: reviewerId,
      review_notes: body.notes || null,
      reviewed_at: now,
    })
    .eq('id', body.id)
    .select('id, employee_id')
    .single();

  if (error) return jsonError(error.message, 500);
  await audit(`LEAVE_${body.decision.toUpperCase()}`, 'leave_requests', body.id, guard);

  const { data: emp } = await guard.supabase
    .from('employees').select('profile_id').eq('id', leaveUpdated.employee_id).maybeSingle();
  if (emp?.profile_id) {
    await notify(emp.profile_id, `Leave ${body.decision}`, `Your leave request was ${body.decision}.`, 'leave', '/employee/leave');
  }
  return NextResponse.json({ success: true });
}
