import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hr/departments — list departments with employee counts.
 * Accessible to all staff.
 */
export async function GET() {
  const guard = await requireRole('admin', 'hr', 'sales', 'manager', 'employee');
  if (isRejected(guard)) return guard;

  const { data, error } = await guard.supabase
    .from('departments')
    .select(`
      id, name, created_at,
      head:profiles!departments_head_of_department_fkey (full_name, email),
      employees:employees (count)
    `)
    .order('name');

  if (error) return jsonError(error.message, 500);

  return NextResponse.json(
    (data ?? []).map(d => ({
      id: d.id,
      name: d.name,
      head: d.head ?? null,
      employee_count: d.employees?.[0]?.count ?? 0,
      created_at: d.created_at,
    }))
  );
}

/** POST /api/hr/departments — create (admin/HR). Body: { name, headOfDepartment? } */
export async function POST(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ name: string; headOfDepartment?: string }>(request, ['name']);
  if (isRejected(body)) return body;

  const { data, error } = await guard.supabase
    .from('departments')
    .insert({ name: body.name.trim(), head_of_department: body.headOfDepartment || null })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return jsonError('A department with this name already exists', 409);
    return jsonError(error.message, 500);
  }

  await audit('CREATE_DEPARTMENT', 'departments', data.id, guard, { name: data.name });
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/hr/departments — rename / reassign head (admin/HR). Body: { id, name?, headOfDepartment? } */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string; name?: string; headOfDepartment?: string }>(request, ['id']);
  if (isRejected(body)) return body;

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.headOfDepartment !== undefined) updates.head_of_department = body.headOfDepartment || null;

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await guard.supabase
    .from('departments')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Department not found', 404);

  await audit('UPDATE_DEPARTMENT', 'departments', body.id, guard, updates);
  return NextResponse.json(data);
}

/** DELETE /api/hr/departments?id= (admin/HR) — blocked when employees are still assigned. */
export async function DELETE(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('Missing department id', 400);

  const { count, error: countError } = await guard.supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', id);

  if (countError) return jsonError(countError.message, 500);
  if ((count ?? 0) > 0) {
    return jsonError(`Cannot delete: ${count} employee(s) still assigned to this department`, 409);
  }

  const { error } = await guard.supabase.from('departments').delete().eq('id', id);
  if (error) return jsonError(error.message, 500);

  await audit('DELETE_DEPARTMENT', 'departments', id, guard);
  return NextResponse.json({ success: true });
}
