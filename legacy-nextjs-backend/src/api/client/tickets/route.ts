import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const TICKET_SELECT = `
  id, ticket_number, title, description, priority, status, resolved_at, created_at, updated_at,
  project:projects (id, name),
  assignee:employees (id, profile:profiles (full_name))
`;

interface OrgResolution {
  orgId: string;
}

/** Resolve the signed-in client's organization id. */
async function resolveOrg(supabase: import('@supabase/supabase-js').SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase
    .from('client_contacts')
    .select('organization_id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

/**
 * GET /api/client/tickets — own organization's tickets.
 * Query: ?status=open|in_progress|resolved|closed&includeMessages=<ticketId>
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const orgId = await resolveOrg(guard.supabase, guard.user.id);
  if (!orgId) return jsonError('No client organization linked', 403);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const includeMessages = searchParams.get('includeMessages');

  // Single ticket with its (non-internal) message thread
  if (includeMessages) {
    const { data: ticket } = await guard.supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('id', includeMessages)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!ticket) return jsonError('Ticket not found', 404);

    const { data: messages, error } = await guard.supabase
      .from('ticket_messages')
      .select('id, message, created_at, author:profiles (id, full_name)')
      .eq('ticket_id', includeMessages)
      .eq('is_internal', false) // staff internal notes are never exposed
      .order('created_at');

    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ticket, messages });
  }

  let query = guard.supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .eq('organization_id', orgId);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/client/tickets — raise a ticket against one of the org's projects.
 * Body: { title, description?, projectId?, priority? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ title: string; description?: string; projectId?: string; priority?: string }>(
    request, ['title']
  );
  if (isRejected(body)) return body;

  const orgId = await resolveOrg(guard.supabase, guard.user.id);
  if (!orgId) return jsonError('No client organization linked', 403);

  // If a project is given, it must belong to the client's org
  if (body.projectId) {
    const { data: project } = await guard.supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .eq('organization_id', orgId)
      .maybeSingle();
    if (!project) return jsonError('Project not found under your organization', 404);
  }

  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

  const { data: ticket, error } = await guard.supabase
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      organization_id: orgId,
      project_id: body.projectId || null,
      raised_by: guard.user.id,
      title: body.title.trim(),
      description: body.description || null,
      priority: body.priority || 'medium',
      status: 'open',
    })
    .select(TICKET_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  await audit('CLIENT_TICKET_CREATED', 'tickets', ticket.id, guard, { number: ticketNumber });
  return NextResponse.json(ticket, { status: 201 });
}

/**
 * PATCH /api/client/tickets — reply to a ticket thread (clients cannot change
 * status/priority/assignment — that is staff's job).
 * Body: { id, message }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ id: string; message: string }>(request, ['id', 'message']);
  if (isRejected(body)) return body;

  const orgId = await resolveOrg(guard.supabase, guard.user.id);
  if (!orgId) return jsonError('No client organization linked', 403);

  const { data: ticket } = await guard.supabase
    .from('tickets')
    .select('id, ticket_number')
    .eq('id', body.id)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!ticket) return jsonError('Ticket not found', 404);

  const { error } = await guard.supabase.from('ticket_messages').insert({
    ticket_id: body.id,
    author_id: guard.user.id,
    message: body.message.trim(),
    is_internal: false,
  });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true });
}
