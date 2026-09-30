import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';
import { provisionUser } from '@backend/lib/auth-server';

export const dynamic = 'force-dynamic';

const EMPLOYEE_SELECT = `
  id, employee_code, designation, employment_type, work_model,
  date_of_joining, status, annual_leave_balance, salary_band,
  profile:profiles!employees_profile_id_fkey (id, email, full_name, phone, role, is_active),
  department:departments (id, name),
  manager:employees!employees_manager_id_fkey (id, employee_code, profile:profiles (full_name, email))
`;

/**
 * GET /api/hr/employees — full employee directory (admin/HR).
 * Optional query: ?department=<uuid>&status=active
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');
  const status = searchParams.get('status');

  let query = guard.supabase.from('employees').select(EMPLOYEE_SELECT);

  if (department) query = query.eq('department_id', department);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('employee_code');
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/hr/employees — onboard an employee.
 * Creates the auth account (unless profileId is supplied for an existing user)
 * and the employee record in one call.
 *
 * Body: {
 *   email, password, fullName,
 *   employeeCode, designation, departmentId?, managerId?,
 *   employmentType?, workModel?, dateOfJoining?, annualLeaveBalance?,
 *   phone?, createAccount?
 * }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    email?: string;
    password?: string;
    fullName: string;
    profileId?: string;
    employeeCode: string;
    designation?: string;
    departmentId?: string;
    managerId?: string;
    employmentType?: string;
    workModel?: string;
    dateOfJoining?: string;
    annualLeaveBalance?: number;
    phone?: string;
    createAccount?: boolean;
  }>(request, ['fullName', 'employeeCode']);

  if (isRejected(body)) return body;

  const role = 'employee' as const;

  // 1. Resolve or create the profile
  let profileId = body.profileId || null;

  if (!profileId && body.createAccount !== false && body.email && body.password) {
    try {
      const created = await provisionUser({
        email: body.email.trim().toLowerCase(),
        password: body.password,
        fullName: body.fullName.trim(),
        role,
        phone: body.phone,
      });
      profileId = created.id;
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Account creation failed', 500);
    }
  }

  // 2. Create the employee record
  const { data: employee, error } = await guard.supabase
    .from('employees')
    .insert({
      profile_id: profileId,
      employee_code: body.employeeCode.trim(),
      designation: body.designation?.trim() || '',
      department_id: body.departmentId || null,
      manager_id: body.managerId || null,
      employment_type: body.employmentType || 'Full-time',
      work_model: body.workModel || 'Hybrid',
      date_of_joining: body.dateOfJoining || new Date().toISOString().slice(0, 10),
      annual_leave_balance: body.annualLeaveBalance ?? 20,
      status: profileId ? 'active' : 'onboarding',
    })
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  await audit(
    'CREATE_EMPLOYEE',
    'employees',
    employee.id,
    guard,
    { employee_code: employee.employee_code, name: body.fullName },
    request.headers.get('x-real-ip')
  );

  if (profileId) {
    await notify(profileId, 'Welcome to CoralSwift', 'Your employee account has been created.', 'general', '/employee');
  }

  return NextResponse.json(employee, { status: 201 });
}

/**
 * PATCH /api/hr/employees — update an employee record (admin/HR).
 * Body: { id, ...fields }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<Record<string, unknown>>(request, ['id']);
  if (isRejected(body)) return body;

  const { id, profile, ...rest } = body as { id: string; profile?: Record<string, unknown> } & Record<string, unknown>;

  const allowed = [
    'designation', 'department_id', 'manager_id', 'employment_type',
    'work_model', 'date_of_joining', 'status', 'annual_leave_balance', 'salary_band',
  ];
  const updates: Record<string, unknown> = {};
  const restRecord = rest as Record<string, unknown>;
  for (const key of allowed) {
    if (restRecord[key] !== undefined) updates[key] = restRecord[key];
  }
  if (Object.keys(updates).length === 0) {
    return jsonError('No updatable fields provided', 400);
  }

  const { data, error } = await guard.supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select(EMPLOYEE_SELECT)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Employee not found', 404);

  await audit('UPDATE_EMPLOYEE', 'employees', id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json(data);
}

/**
 * DELETE /api/hr/employees?id= — mark employee as exited (soft; record kept).
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('Missing employee id', 400);

  const { error } = await guard.supabase
    .from('employees')
    .update({ status: 'exited' })
    .eq('id', id);

  if (error) return jsonError(error.message, 500);

  await audit('EXIT_EMPLOYEE', 'employees', id, guard, undefined, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
