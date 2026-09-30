import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

async function myEmployeeId(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string) {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/employee/attendance — own attendance.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (default: current month)
 * Response: { today: {...}|null, history: [...] }
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return NextResponse.json({ today: null, history: [] });

  const { searchParams } = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = searchParams.get('from') || today.slice(0, 8) + '01';
  const to = searchParams.get('to') || today;

  const { data, error } = await guard.supabase
    .from('attendance')
    .select('id, work_date, check_in, check_out, status, notes')
    .eq('employee_id', myId)
    .gte('work_date', from)
    .lte('work_date', to)
    .order('work_date', { ascending: false });

  if (error) return jsonError(error.message, 500);

  const rows = data ?? [];
  return NextResponse.json({
    today: rows.find(r => r.work_date === today) ?? null,
    history: rows,
  });
}

/**
 * POST /api/employee/attendance — check in / check out.
 * Body: { action: 'check_in' | 'check_out', notes? }
 * check_in: creates today's row (idempotent — returns existing row if already checked in)
 * check_out: stamps check_out on today's open row
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ action: string; notes?: string }>(request, ['action']);
  if (isRejected(body)) return body;

  if (!['check_in', 'check_out'].includes(body.action)) {
    return jsonError("action must be 'check_in' or 'check_out'", 400);
  }

  const myId = await myEmployeeId(guard.supabase, guard.user.id);
  if (!myId) return jsonError('No employee record; contact HR', 400);

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { data: existing } = await guard.supabase
    .from('attendance')
    .select('id, work_date, check_in, check_out')
    .eq('employee_id', myId)
    .eq('work_date', today)
    .maybeSingle();

  if (body.action === 'check_in') {
    if (existing) {
      return jsonError('Already checked in today', 409, { attendance: existing });
    }
    const { data, error } = await guard.supabase
      .from('attendance')
      .insert({ employee_id: myId, work_date: today, check_in: now, status: 'present', notes: body.notes || null })
      .select('id, work_date, check_in, check_out, status')
      .single();
    if (error) return jsonError(error.message, 500);
    await audit('ATTENDANCE_CHECK_IN', 'attendance', data.id, guard, { date: today }, request.headers.get('x-real-ip'));
    return NextResponse.json({ today: data }, { status: 201 });
  }

  // check_out
  if (!existing) {
    return jsonError('No check-in found for today', 409);
  }
  if (existing.check_out) {
    return jsonError('Already checked out today', 409, { attendance: existing });
  }
  const { data, error } = await guard.supabase
    .from('attendance')
    .update({ check_out: now })
    .eq('id', existing.id)
    .select('id, work_date, check_in, check_out, status')
    .single();
  if (error) return jsonError(error.message, 500);
  await audit('ATTENDANCE_CHECK_OUT', 'attendance', data.id, guard, { date: today }, request.headers.get('x-real-ip'));
  return NextResponse.json({ today: data });
}
