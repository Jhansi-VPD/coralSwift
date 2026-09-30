import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const TASK_SELECT = `
  id, title, description, priority, status, estimated_hours, due_date, created_at, updated_at,
  project:projects (id, name, code),
  milestone:milestones (id, title),
  assignee:employees!tasks_assignee_id_fkey (id, employee_code, profile:profiles (full_name, email))
`;

/** Resolves the manager's employee row id. */
async function employeeIdOf(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/**
 * GET /api/manager/tasks — tasks across the manager's projects.
 * Query: ?project=<uuid>&assignee=<employeeId>&status=todo|...
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const project = searchParams.get('project');
  const assignee = searchParams.get('assignee');
  const status = searchParams.get('status');

  let query = guard.supabase.from('tasks').select(TASK_SELECT);

  if (guard.user.role === 'manager') {
    const myId = await employeeIdOf(guard.supabase, guard.user.id);
    if (!myId) return NextResponse.json([]);
    // tasks joined through their project's manager
    query = query.eq('project.manager_id', myId);
  }
  if (project) query = query.eq('project_id', project);
  if (assignee) query = query.eq('assignee_id', assignee);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(500);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/manager/tasks — create and assign a task.
 * Body: { projectId, title, assigneeId, description?, priority?, estimatedHours?, dueDate?, milestoneId? }
 * Notifies the assignee.
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    projectId: string;
    title: string;
    assigneeId: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
    dueDate?: string;
    milestoneId?: string;
  }>(request, ['projectId', 'title', 'assigneeId']);
  if (isRejected(body)) return body;

  if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
    return jsonError('priority must be low, medium, high, or urgent', 400);
  }

  // Manager must own the project
  if (guard.user.role === 'manager') {
    const { data: owned } = await guard.supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .eq('manager_id', await employeeIdOf(guard.supabase, guard.user.id))
      .maybeSingle();
    if (!owned) return jsonError('Project not found or not yours', 404);
  }

  const { data: task, error } = await guard.supabase
    .from('tasks')
    .insert({
      project_id: body.projectId,
      milestone_id: body.milestoneId || null,
      title: body.title.trim(),
      description: body.description || null,
      assignee_id: body.assigneeId,
      priority: body.priority || 'medium',
      estimated_hours: body.estimatedHours ?? null,
      due_date: body.dueDate || null,
      created_by: guard.user.id,
    })
    .select(TASK_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  // Notify assignee via their profile
  const { data: assigneeProfile } = await guard.supabase
    .from('employees')
    .select('profile_id')
    .eq('id', body.assigneeId)
    .maybeSingle();

  if (assigneeProfile?.profile_id) {
    await notify(
      assigneeProfile.profile_id,
      `New task assigned: ${task.title}`,
      `Priority: ${task.priority}${task.due_date ? ` • Due ${task.due_date}` : ''}`,
      'task',
      '/employee/tasks'
    );
  }

  await audit('CREATE_TASK', 'tasks', task.id, guard, { title: task.title, assignee: body.assigneeId }, request.headers.get('x-real-ip'));
  return NextResponse.json(task, { status: 201 });
}

/**
 * PATCH /api/manager/tasks — edit/reassign/close a task (manager scope).
 * Body: { id, title?, description?, assigneeId?, priority?, status?, dueDate?, estimatedHours? }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<Record<string, unknown>>(request, ['id']);
  if (isRejected(body)) return body;
  const { id, ...rest } = body as { id: string } & Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: 'title', description: 'description', assigneeId: 'assignee_id',
    priority: 'priority', status: 'status', dueDate: 'due_date', estimatedHours: 'estimated_hours',
  };
  for (const [key, col] of Object.entries(map)) {
    if (rest[key] !== undefined) updates[col] = rest[key];
  }
  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  if (updates.priority && !['low', 'medium', 'high', 'urgent'].includes(updates.priority as string)) {
    return jsonError('invalid priority', 400);
  }
  if (updates.status && !['todo', 'in_progress', 'in_review', 'blocked', 'done'].includes(updates.status as string)) {
    return jsonError('invalid status', 400);
  }

  // Scope check through the project's manager
  if (guard.user.role === 'manager') {
    const { data: owned } = await guard.supabase
      .from('tasks')
      .select('id, project:projects!inner (manager_id), assignee:employees!tasks_assignee_id_fkey (profile_id)')
      .eq('id', id)
      .eq('project.manager_id', await employeeIdOf(guard.supabase, guard.user.id))
      .maybeSingle();
    if (!owned) return jsonError('Task not found in your projects', 404);
  }

  const { data: updated, error } = await guard.supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select(TASK_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  // Notify the assignee on reassignment
  if (updates.assignee_id) {
    const { data: prof } = await guard.supabase
      .from('employees').select('profile_id').eq('id', updates.assignee_id as string).maybeSingle();
    if (prof?.profile_id) {
      await notify(prof.profile_id, `Task assigned: ${updated.title}`, 'You have been assigned a task.', 'task', '/employee/tasks');
    }
  }

  await audit('UPDATE_TASK', 'tasks', id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json(updated);
}
