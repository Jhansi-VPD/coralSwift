import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const PROJECT_SELECT = `
  id, name, code, description, status, health, progress_percent,
  client_review_status, submitted_for_review_at, client_feedback, client_feedback_at,
  expected_completion_date, start_date, target_end_date, budget,
  organization:client_organizations (id, name),
  manager:employees!projects_manager_id_fkey (id, employee_code, profile:profiles (full_name)),
  milestones:milestones (id, title, description, due_date, status, sort_order, completed_at),
  members:project_members (id, allocation_percent, role_on_project,
    employee:employees (id, employee_code, designation, profile:profiles (id, full_name, email))),
  updates:project_updates (id, title, body, is_client_visible, created_at,
    author:profiles (full_name))
`;

async function employeeIdOf(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string) {
  const { data } = await supabase.from('employees').select('id').eq('profile_id', profileId).maybeSingle();
  return data?.id ?? null;
}

/** GET /api/manager/projects/[id] — full project detail (manager-owned or admin). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  let query = guard.supabase.from('projects').select(PROJECT_SELECT).eq('id', params.id);
  if (guard.user.role === 'manager') {
    query = query.eq('manager_id', await employeeIdOf(guard.supabase, guard.user.id));
  }

  const { data, error } = await query.maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Project not found', 404);
  return NextResponse.json(data);
}

/**
 * PATCH /api/manager/projects/[id] — project lifecycle operations.
 *
 * Body: {
 *   status?, health?, progressPercent?, expectedCompletionDate?,
 *   submitForReview?: boolean          → manager → client review
 *   update?: { title, body, isClientVisible? }   → journal entry
 *   milestone?: { id?, title, dueDate?, status?, remove? }
 * }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('manager', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    status?: string;
    health?: string;
    progressPercent?: number;
    expectedCompletionDate?: string;
    submitForReview?: boolean;
    update?: { title: string; body?: string; isClientVisible?: boolean };
    milestone?: { id?: string; title: string; dueDate?: string; status?: string; remove?: boolean };
  }>(request);
  if (isRejected(guard)) return guard;
  if (isRejected(body)) return body;

  // Ownership scope
  let scoped = guard.supabase.from('projects').select('id, name, status, client_review_status, organization_id, progress_percent');
  if (guard.user.role === 'manager') {
    scoped = scoped.eq('manager_id', await employeeIdOf(guard.supabase, guard.user.id));
  }
  const { data: project, error: projectError } = await scoped.eq('id', params.id).maybeSingle();
  if (projectError) return jsonError(projectError.message, 500);
  if (!project) return jsonError('Project not found', 404);

  const row = project as {
    id: string; name: string; status: string;
    client_review_status: string; organization_id: string; progress_percent: number;
  };

  const updates: Record<string, unknown> = {};
  let clientNotification: { title: string; body: string } | null = null;

  if (body.submitForReview) {
    if (row.client_review_status === 'submitted') {
      return jsonError('Project is already awaiting client review', 409);
    }
    updates.client_review_status = 'submitted';
    updates.submitted_for_review_at = new Date().toISOString();
    clientNotification = {
      title: 'Review requested',
      body: `Project "${row.name}" was submitted for your review.`,
    };
  }

  if (body.status) {
    if (!['planning', 'active', 'on_hold', 'completed', 'cancelled'].includes(body.status)) {
      return jsonError('invalid status', 400);
    }
    updates.status = body.status;
  }
  if (body.health) {
    if (!['on_track', 'at_risk', 'critical'].includes(body.health)) return jsonError('invalid health', 400);
    updates.health = body.health;
  }
  if (body.progressPercent !== undefined) {
    const p = Math.max(0, Math.min(100, Math.round(Number(body.progressPercent))));
    if (Number.isNaN(p)) return jsonError('invalid progressPercent', 400);
    updates.progress_percent = p;
  }
  if (body.expectedCompletionDate !== undefined) {
    updates.expected_completion_date = body.expectedCompletionDate || null;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await guard.supabase.from('projects').update(updates).eq('id', params.id);
    if (error) return jsonError(error.message, 500);
  }

  // Journal entry
  if (body.update) {
    const { error } = await guard.supabase.from('project_updates').insert({
      project_id: params.id,
      author_id: guard.user.id,
      title: body.update.title,
      body: body.update.body || null,
      is_client_visible: body.update.isClientVisible ?? true,
    });
    if (error) return jsonError(error.message, 500);
  }

  // Milestone op
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
        project_id: params.id,
        title: m.title,
        due_date: m.dueDate || null,
      });
    }
  }

  // Notify client contacts (client-visible event)
  if (clientNotification && row.organization_id) {
    const { data: contacts } = await guard.supabase
      .from('client_contacts')
      .select('profile_id')
      .eq('organization_id', row.organization_id)
      .not('profile_id', 'is', null);

    for (const c of contacts ?? []) {
      if (c.profile_id) {
        await notify(c.profile_id, clientNotification.title, clientNotification.body, 'project', '/client');
      }
    }
  }

  await audit('UPDATE_PROJECT', 'projects', params.id, guard, { ...updates, update: body.update?.title }, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
