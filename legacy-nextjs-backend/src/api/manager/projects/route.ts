import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const PROJECT_SELECT = `
  id, name, code, description, status, health, start_date, target_end_date, budget, created_at,
  organization:client_organizations (id, name),
  manager:employees!projects_manager_id_fkey (id, employee_code, profile:profiles (full_name)),
  milestones:milestones (id, title, due_date, status, sort_order),
  members:project_members (id, allocation_percent, role_on_project,
    employee:employees (id, employee_code, profile:profiles (full_name, email))),
  task_stats:tasks (status)
`;

/**
 * GET /api/manager/projects — projects the manager owns (admin sees all).
 * Query: ?status=active|planning|...
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = guard.supabase.from('projects').select(PROJECT_SELECT);
  if (guard.user.role === 'manager') {
    query = query.eq('manager_id', (await myEmployeeId(guard))).eq('status', status ?? '');
    if (!status) {
      // rebuild query without the empty status filter
      query = guard.supabase.from('projects').select(PROJECT_SELECT).eq('manager_id', await myEmployeeId(guard));
    }
  } else if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);

  // Fold task status counts into a summary
  const projects = (data ?? []).map(p => {
    const stats: Record<string, number> = {};
    for (const t of p.task_stats ?? []) stats[t.status] = (stats[t.status] ?? 0) + 1;
    return { ...p, task_stats: stats };
  });

  return NextResponse.json(projects);
}

async function myEmployeeId(guard: { supabase: import('@supabase/supabase-js').SupabaseClient; user: { id: string } }): Promise<string | null> {
  const { data } = await guard.supabase
    .from('employees')
    .select('id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * POST /api/manager/projects — create a project.
 * Body: { name, code?, organizationId?, contractId?, startDate?, targetEndDate?, budget?, milestoneIds? }
 * The creating manager is assigned as project manager; admin may pass managerId explicitly.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    name: string;
    code?: string;
    description?: string;
    organizationId?: string;
    contractId?: string;
    managerId?: string;
    startDate?: string;
    targetEndDate?: string;
    budget?: number;
    milestones?: { title: string; dueDate?: string }[];
  }>(request, ['name']);
  if (isRejected(body)) return body;

  let managerId = body.managerId || null;
  if (guard.user.role === 'manager') {
    managerId = await myEmployeeId(guard);
    if (!managerId) return jsonError('Your user has no employee record; contact HR.', 400);
  }

  const { data: project, error } = await guard.supabase
    .from('projects')
    .insert({
      name: body.name.trim(),
      code: body.code?.trim() || null,
      description: body.description || null,
      organization_id: body.organizationId || null,
      contract_id: body.contractId || null,
      manager_id: managerId,
      status: 'planning',
      start_date: body.startDate || null,
      target_end_date: body.targetEndDate || null,
      budget: body.budget ?? null,
    })
    .select('id, name, code')
    .single();

  if (error) return jsonError(error.message, 500);

  if (body.milestones?.length) {
    await guard.supabase.from('milestones').insert(
      body.milestones.map((m, i) => ({
        project_id: project.id,
        title: m.title,
        due_date: m.dueDate || null,
        sort_order: i,
      }))
    );
  }

  await audit('CREATE_PROJECT', 'projects', project.id, guard, { name: project.name }, request.headers.get('x-real-ip'));
  return NextResponse.json(project, { status: 201 });
}

/**
 * PATCH /api/manager/projects — update status/health/schedule, upsert milestones & members.
 * Body: {
 *   id, status?, health?, targetEndDate?, budget?,
 *   milestone?: { id?, title, dueDate?, status?, delete? },
 *   member?: { employeeId, allocationPercent?, roleOnProject?, remove? }
 * }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    status?: string;
    health?: string;
    targetEndDate?: string;
    budget?: number;
    milestone?: { id?: string; title: string; dueDate?: string; status?: string; remove?: boolean };
    member?: { employeeId: string; allocationPercent?: number; roleOnProject?: string; remove?: boolean };
  }>(request, ['id']);
  if (isRejected(body)) return body;

  // Ownership check: manager must own this project (RLS also enforces)
  if (guard.user.role === 'manager') {
    const { data: owned } = await guard.supabase
      .from('projects')
      .select('id')
      .eq('id', body.id)
      .eq('manager_id', await myEmployeeId(guard))
      .maybeSingle();
    if (!owned) return jsonError('Project not found or not yours', 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.status) {
    if (!['planning', 'active', 'on_hold', 'completed', 'cancelled'].includes(body.status)) {
      return jsonError('invalid status', 400);
    }
    updates.status = body.status;
  }
  if (body.health) {
    if (!['on_track', 'at_risk', 'critical'].includes(body.health)) {
      return jsonError('invalid health', 400);
    }
    updates.health = body.health;
  }
  if (body.targetEndDate !== undefined) updates.target_end_date = body.targetEndDate || null;
  if (body.budget !== undefined) updates.budget = body.budget;

  if (Object.keys(updates).length > 0) {
    const { error } = await guard.supabase.from('projects').update(updates).eq('id', body.id);
    if (error) return jsonError(error.message, 500);
  }

  if (body.milestone) {
    const m = body.milestone;
    if (m.remove && m.id) {
      await guard.supabase.from('milestones').delete().eq('id', m.id);
    } else if (m.id) {
      const mu: Record<string, unknown> = { title: m.title };
      if (m.dueDate !== undefined) mu.due_date = m.dueDate || null;
      if (m.status) mu.status = m.status;
      if (m.status === 'completed') mu.completed_at = new Date().toISOString();
      await guard.supabase.from('milestones').update(mu).eq('id', m.id);
    } else {
      await guard.supabase.from('milestones').insert({
        project_id: body.id,
        title: m.title,
        due_date: m.dueDate || null,
      });
    }
  }

  if (body.member) {
    const mem = body.member;
    if (mem.remove) {
      await guard.supabase
        .from('project_members')
        .delete()
        .eq('project_id', body.id)
        .eq('employee_id', mem.employeeId);
    } else {
      const payload = {
        project_id: body.id,
        employee_id: mem.employeeId,
        allocation_percent: mem.allocationPercent ?? 100,
        role_on_project: mem.roleOnProject || null,
      };
      const { error } = await guard.supabase
        .from('project_members')
        .upsert(payload, { onConflict: 'project_id,employee_id' });
      if (error) return jsonError(error.message, 500);
    }
  }

  await audit('UPDATE_PROJECT', 'projects', body.id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
