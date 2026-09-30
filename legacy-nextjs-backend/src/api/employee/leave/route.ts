import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const MY_LEAVE_SELECT = `
  id, leave_type, start_date, end_date, reason, status, review_notes, reviewed_at, created_at,
  reviewer:employees (id, profile:profiles (full_name))
`;

async function myEmployeeRow(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string) {
  const { data } = await supabase
    .from('employees')
    .select('id, annual_leave_balance, status')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data;
}

/**
 * GET /api/employee/leave — own leave history + current balance.
 */
export async function GET() {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const me = await myEmployeeRow(guard.supabase, guard.user.id);
  if (!me) return NextResponse.json({ balance: null, requests: [] });

  const { data, error } = await guard.supabase
    .from('leave_requests')
    .select(MY_LEAVE_SELECT)
    .eq('employee_id', me.id)
    .order('created_at', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ balance: me.annual_leave_balance, requests: data });
}

/**
 * POST /api/employee/leave — submit a leave request.
 * Body: { leaveType, startDate, endDate, reason? }
 * Validates: no overlapping pending/approved leave, sufficient annual balance for annual type.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }>(request, ['leaveType', 'startDate', 'endDate']);
  if (isRejected(body)) return body;

  const me = await myEmployeeRow(guard.supabase, guard.user.id);
  if (!me) return jsonError('No employee record; contact HR', 400);
  if (me.status === 'exited') return jsonError('Inactive employees cannot request leave', 403);

  const TYPES = ['annual', 'sick', 'unpaid', 'maternity', 'paternity'];
  if (!TYPES.includes(body.leaveType)) return jsonError(`leaveType must be one of: ${TYPES.join(', ')}`, 400);

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return jsonError('Invalid dates; use YYYY-MM-DD', 400);
  }
  if (end < start) return jsonError('endDate cannot be before startDate', 400);

  // Overlap check against pending/approved leave
  const { data: overlapping } = await guard.supabase
    .from('leave_requests')
    .select('id')
    .eq('employee_id', me.id)
    .in('status', ['pending', 'approved'])
    .lte('start_date', body.endDate)
    .gte('end_date', body.startDate)
    .limit(1);

  if (overlapping && overlapping.length > 0) {
    return jsonError('You already have a pending or approved leave overlapping these dates', 409);
  }

  // Annual balance check
  if (body.leaveType === 'annual') {
    const msPerDay = 86_400_000;
    const calendarDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    if (calendarDays > (me.annual_leave_balance ?? 0)) {
      return jsonError(
        `Insufficient balance: requesting ${calendarDays} day(s) but only ${me.annual_leave_balance} remain`,
        409
      );
    }
  }

  const { data, error } = await guard.supabase
    .from('leave_requests')
    .insert({
      employee_id: me.id,
      leave_type: body.leaveType,
      start_date: body.startDate,
      end_date: body.endDate,
      reason: body.reason || null,
      status: 'pending',
    })
    .select(MY_LEAVE_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  await audit('REQUEST_LEAVE', 'leave_requests', data.id, guard, { type: body.leaveType }, request.headers.get('x-real-ip'));
  return NextResponse.json({ ...data, balance: me.annual_leave_balance }, { status: 201 });
}

/** DELETE /api/employee/leave?id= — cancel own pending request. */
export async function DELETE(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('Missing id', 400);

  const me = await myEmployeeRow(guard.supabase, guard.user.id);
  if (!me) return jsonError('No employee record', 400);

  const { data, error } = await guard.supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('employee_id', me.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Request not found or no longer cancellable', 404);

  await audit('CANCEL_LEAVE', 'leave_requests', id, guard);
  return NextResponse.json({ success: true });
}
