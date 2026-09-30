import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';
import { provisionUser } from '@backend/lib/auth-server';
import { ROLES, type Role } from '@backend/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hr/users — list all user accounts (admin/HR).
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const { data, error } = await guard.supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/hr/users — provision a new user with a role (admin/HR only).
 * Body: { email, password, fullName, role, phone? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ email: string; password: string; fullName: string; role: string; phone?: string }>(
    request,
    ['email', 'password', 'fullName', 'role']
  );
  if (isRejected(body)) return body;

  const role = body.role as Role;
  if (!ROLES.includes(role)) {
    return jsonError(`Invalid role. Must be one of: ${ROLES.join(', ')}`, 400);
  }
  // Only admin may create another admin
  if (role === 'admin' && guard.user.role !== 'admin') {
    return jsonError('Only an admin can provision another admin account', 403);
  }
  if (body.password.length < 8) {
    return jsonError('Password must be at least 8 characters', 400);
  }

  try {
    const created = await provisionUser({
      email: body.email.trim().toLowerCase(),
      password: body.password,
      fullName: body.fullName.trim(),
      role,
      phone: body.phone,
    });

    await audit(
      'CREATE_USER',
      'profiles',
      created.id,
      guard,
      { email: created.email, role },
      request.headers.get('x-real-ip')
    );

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'User provisioning failed', 500);
  }
}

/**
 * PATCH /api/hr/users — activate/deactivate or change a user's role (admin/HR).
 * Body: { id, isActive?, role? }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('admin', 'hr');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string; isActive?: boolean; role?: string; fullName?: string; phone?: string }>(
    request,
    ['id']
  );
  if (isRejected(body)) return body;

  const updates: Record<string, unknown> = {};
  if (typeof body.isActive === 'boolean') updates.is_active = body.isActive;
  if (body.fullName) updates.full_name = body.fullName.trim();
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.role) {
    if (!ROLES.includes(body.role as Role)) return jsonError('Invalid role', 400);
    if (body.role === 'admin' && guard.user.role !== 'admin') {
      return jsonError('Only an admin can grant the admin role', 403);
    }
    updates.role = body.role;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError('Nothing to update', 400);
  }

  const { data, error } = await guard.supabase
    .from('profiles')
    .update(updates)
    .eq('id', body.id)
    .select('id, email, role, is_active')
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('User not found', 404);

  await audit('UPDATE_USER', 'profiles', body.id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true, user: data });
}
