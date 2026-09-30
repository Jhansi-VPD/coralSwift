import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * CLIENT-SAFE projection — deliberately excludes:
 * employee names, internal task details, internal notes/blockers,
 * member allocations, budget internals, performance data.
 */
const CLIENT_PROJECT_SELECT = `
  id, name, code, description, status, health, progress_percent,
  client_review_status, submitted_for_review_at, client_feedback, client_feedback_at,
  expected_completion_date, start_date, target_end_date,
  milestones:milestones (id, title, description, due_date, status, sort_order, completed_at),
  updates:project_updates (id, title, body, created_at, author:profiles (full_name))
`;

async function resolveOrg(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string) {
  const { data } = await supabase
    .from('client_contacts')
    .select('organization_id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

/** GET /api/client/projects/[id] — client-safe project tracker detail. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const orgId = await resolveOrg(guard.supabase, guard.user.id);
  if (!orgId) return jsonError('No client organization linked', 403);

  const { data, error } = await guard.supabase
    .from('projects')
    .select(CLIENT_PROJECT_SELECT)
    .eq('id', params.id)
    .eq('organization_id', orgId)   // tenant isolation
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Project not found', 404);

  // Only client-visible journal entries
  const raw = data as { updates?: (Record<string, unknown> & { is_client_visible?: boolean })[] } & Record<string, unknown>;
  const project = {
    ...raw,
    updates: (raw.updates ?? []).filter(u => u.is_client_visible !== false),
  };

  return NextResponse.json({ project });
}

/**
 * PATCH /api/client/projects/[id] — client review decision.
 *
 * Body: { decision: 'accept' | 'request_changes', feedback?: string }
 *
 * accept          → project.client_review_status = 'approved', status → 'completed'
 *                   (finance can now invoice), manager notified.
 * request_changes → client_review_status = 'changes_requested', feedback stored,
 *                   manager notified; manager resolves → resubmits → client reviews again.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ decision: string; feedback?: string }>(request, ['decision']);
  if (isRejected(body)) return body;

  if (!['accept', 'request_changes'].includes(body.decision)) {
    return jsonError("decision must be 'accept' or 'request_changes'", 400);
  }
  if (body.decision === 'request_changes' && !body.feedback?.trim()) {
    return jsonError('Feedback is required when requesting changes', 422);
  }

  const orgId = await resolveOrg(guard.supabase, guard.user.id);
  if (!orgId) return jsonError('No client organization linked', 403);

  const { data: project, error: fetchError } = await guard.supabase
    .from('projects')
    .select('id, name, client_review_status, manager_id, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!project) return jsonError('Project not found', 404);
  if (project.client_review_status !== 'submitted') {
    return jsonError(
      `Project is not awaiting review (current state: ${project.client_review_status})`,
      409
    );
  }

  const updates: Record<string, unknown> = {
    client_feedback: body.feedback || null,
    client_feedback_at: new Date().toISOString(),
    client_feedback_by: guard.user.id,
  };
  let managerNotify: { title: string; body: string };

  if (body.decision === 'accept') {
    updates.client_review_status = 'approved';
    updates.status = 'completed';
    managerNotify = {
      title: 'Project accepted',
      body: `Client approved "${project.name}". Ready for invoicing.`,
    };
  } else {
    updates.client_review_status = 'changes_requested';
    managerNotify = {
      title: 'Changes requested',
      body: `Client requested changes on "${project.name}": ${body.feedback?.slice(0, 140)}`,
    };
  }

  const { error } = await guard.supabase.from('projects').update(updates).eq('id', params.id);
  if (error) return jsonError(error.message, 500);

  // Notify the project manager (via employee → profile)
  if (project.manager_id) {
    const { data: mgr } = await guard.supabase
      .from('employees').select('profile_id').eq('id', project.manager_id).maybeSingle();
    if (mgr?.profile_id) {
      await notify(mgr.profile_id, managerNotify.title, managerNotify.body, 'project', '/manager/projects');
    }
  }

  await audit(
    body.decision === 'accept' ? 'CLIENT_ACCEPT_PROJECT' : 'CLIENT_REQUEST_CHANGES',
    'projects',
    params.id,
    guard,
    { feedback: body.feedback },
    request.headers.get('x-real-ip')
  );

  return NextResponse.json({ success: true, decision: body.decision });
}
