import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const LEAVE_SELECT = `
  id, leave_type, start_date, end_date, reason, status, review_notes, reviewed_at, created_at,
  employee:employees (id, employee_code, annual_leave_balance,
    profile:profiles (full_name, email)),
  reviewer:employees (id, profile:profiles (full_name))
`;

function businessDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  let days = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/**
 * GET /api/hr/leave — all leave requests, newest first (admin/HR).
 * Optional query: ?status=pending
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const status = new URL(request.url).searchParams.get('status');
  let query = guard.supabase.from('leave_requests').select(LEAVE_SELECT);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * PATCH /api/hr/leave — approve or reject a leave request (admin/HR).
 * On approval, deducts business days from the employee's leave balance.
 * Body: { id, decision: 'approved'|'rejected', notes? }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string; decision: string; notes?: string }>(
    request, ['id', 'decision']
  );
  if (isRejected(body)) return body;

  if (!['approved', 'rejected'].includes(body.decision)) {
    return jsonError("decision must be 'approved' or 'rejected'", 400);
  }

  // Fetch the request to act on
  const { data: leaveReq, error: fetchError } = await guard.supabase
    .from('leave_requests')
    .select('id, employee_id, leave_type, start_date, end_date, status')
    .eq('id', body.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!leaveReq) return jsonError('Leave request not found', 404);
  if (leaveReq.status !== 'pending') {
    return jsonError(`Leave request is already ${leaveReq.status}`, 409);
  }

  // Resolve the reviewer's employee id
  const { data: reviewer } = await guard.supabase
    .from('employees')
    .select('id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();

  const { error: updateError } = await guard.supabase
    .from('leave_requests')
    .update({
      status: body.decision,
      reviewer_id: reviewer?.id ?? null,
      review_notes: body.notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.id);

  if (updateError) return jsonError(updateError.message, 500);

  // Deduct balance on approval (annual leave only)
  if (body.decision === 'approved' && leaveReq.leave_type === 'annual') {
    const { data: emp } = await guard.supabase
      .from('employees')
      .select('id, annual_leave_balance, profile_id')
      .eq('id', leaveReq.employee_id)
      .maybeSingle();

    if (emp) {
      const days = businessDays(leaveReq.start_date, leaveReq.end_date);
      const newBalance = Math.max(0, (emp.annual_leave_balance ?? 0) - days);
      await guard.supabase
        .from('employees')
        .update({ annual_leave_balance: newBalance })
        .eq('id', emp.id);

      if (emp.profile_id) {
        await notify(
          emp.profile_id,
          `Leave ${body.decision}`,
          `Your leave (${leaveReq.start_date} → ${leaveReq.end_date}) was ${body.decision}. Remaining balance: ${newBalance} days.`,
          'leave',
          '/employee/leave'
        );
      }
    }
  }

  await audit(
    `LEAVE_${body.decision.toUpperCase()}`,
    'leave_requests',
    body.id,
    guard,
    { employee_id: leaveReq.employee_id },
    request.headers.get('x-real-ip')
  );

  return NextResponse.json({ success: true, decision: body.decision });
}
