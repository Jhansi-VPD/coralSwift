import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const ATTENDANCE_SELECT = `
  id, work_date, check_in, check_out, status, notes,
  employee:employees (id, employee_code, profile:profiles (full_name, email))
`;

/**
 * GET /api/hr/attendance — org-wide attendance (admin/HR).
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&employee=<uuid>
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const employee = searchParams.get('employee');

  let query = guard.supabase
    .from('attendance')
    .select(ATTENDANCE_SELECT)
    .order('work_date', { ascending: false })
    .limit(500);

  if (from) query = query.gte('work_date', from);
  if (to) query = query.lte('work_date', to);
  if (employee) query = query.eq('employee_id', employee);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
