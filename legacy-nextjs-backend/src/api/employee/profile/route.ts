import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const MY_PROFILE_SELECT = `
  id, employee_code, designation, employment_type, work_model, date_of_joining,
  status, annual_leave_balance,
  profile:profiles!employees_profile_id_fkey (id, email, full_name, phone, avatar_url),
  department:departments (id, name),
  manager:employees!employees_manager_id_fkey (id, employee_code,
    profile:profiles (full_name, email))
`;

/**
 * GET /api/employee/profile            → own profile
 * GET /api/employee/profile?view=directory → staff directory (all staff roles)
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin', 'hr', 'sales');
  if (isRejected(guard)) return guard;

  const view = new URL(request.url).searchParams.get('view');

  if (view === 'directory') {
    const { data, error } = await guard.supabase
      .from('employees')
      .select(`
        id, employee_code, designation, work_model, status,
        profile:profiles (id, full_name, email, phone),
        department:departments (name)
      `)
      .in('status', ['active', 'on_leave', 'onboarding'])
      .order('employee_code');

    if (error) return jsonError(error.message, 500);
    interface DirectoryEntry {
      id: string;
      employee_code: string;
      designation: string;
      work_model: string;
      status: string;
      profile: { full_name: string; email: string; phone: string | null } | null;
      department: { name: string } | null;
    }
    return NextResponse.json(
      ((data ?? []) as unknown as DirectoryEntry[]).map(e => ({
        id: e.id,
        code: e.employee_code,
        name: e.profile?.full_name ?? '',
        email: e.profile?.email ?? '',
        phone: e.profile?.phone ?? null,
        designation: e.designation,
        department: e.department?.name ?? null,
        workModel: e.work_model,
        status: e.status,
      }))
    );
  }

  const { data: me } = await guard.supabase
    .from('employees')
    .select('id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();

  if (!me) return jsonError('No employee record; contact HR', 404);

  const { data, error } = await guard.supabase
    .from('employees')
    .select(MY_PROFILE_SELECT)
    .eq('id', me.id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * PATCH /api/employee/profile — self-service contact info only.
 * Body: { phone?, avatarUrl? }
 * (Name, role, department, salary etc. are HR-managed and rejected here.)
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('employee', 'manager', 'admin', 'hr', 'sales');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ phone?: string; avatarUrl?: string }>(request, []);
  if (isRejected(body)) return body;

  if (body.phone === undefined && body.avatarUrl === undefined) {
    return jsonError('Only phone and avatarUrl can be self-updated', 400);
  }

  const profileUpdates: Record<string, unknown> = {};
  if (body.phone !== undefined) profileUpdates.phone = body.phone || null;
  if (body.avatarUrl !== undefined) profileUpdates.avatar_url = body.avatarUrl || null;

  const { data, error } = await guard.supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', guard.user.id)
    .select('id, email, full_name, phone, avatar_url')
    .single();

  if (error) return jsonError(error.message, 500);

  await audit('UPDATE_OWN_PROFILE', 'profiles', guard.user.id, guard, profileUpdates, request.headers.get('x-real-ip'));
  return NextResponse.json(data);
}
