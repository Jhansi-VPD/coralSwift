import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const ENQUIRY_SELECT = `
  id, full_name, email, company, phone, service_interest, message, consent,
  source_page, status, admin_notes, created_at, updated_at,
  assigned_to, assigned_at, follow_up_at, meeting_at, meeting_link,
  assignee:profiles!enquiries_assigned_to_fkey (id, email, full_name, role)
`;

const VALID_STATUSES = ['new', 'under_review', 'assigned_to_sales', 'sales_review', 'accepted', 'rejected', 'in_review', 'contacted', 'qualified', 'closed'];

interface EnquiryRow {
  id: string;
  status: string;
  assigned_to: string | null;
}

/** Append the state-machine trail row. */
async function recordTransition(
  sb: import('@supabase/supabase-js').SupabaseClient,
  enquiryId: string,
  from: string | null,
  to: string,
  userId: string | null,
  note?: string
) {
  await sb.from('enquiry_status_history').insert({
    enquiry_id: enquiryId,
    from_status: from,
    to_status: to,
    changed_by: userId,
    note: note || null,
  });
}

/**
 * GET /api/enquiries/[id] — enquiry detail + status history.
 * Admin/sales (assigned or admin) only.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('admin', 'sales');
  if (isRejected(guard)) return guard;

  const { data: enquiry, error } = await guard.supabase
    .from('enquiries')
    .select(ENQUIRY_SELECT)
    .eq('id', params.id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!enquiry) return jsonError('Enquiry not found', 404);

  // Sales may only view enquiries assigned to them
  if (guard.user.role === 'sales' && enquiry.assigned_to !== guard.user.id) {
    return jsonError('Not your assigned enquiry', 403);
  }

  const { data: history } = await guard.supabase
    .from('enquiry_status_history')
    .select('id, from_status, to_status, note, created_at, changed_by:profiles (full_name, role)')
    .eq('enquiry_id', params.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ enquiry, history: history ?? [] });
}

/**
 * PATCH /api/enquiries/[id] — workflow transitions.
 *
 * Body: {
 *   status?:        any valid state,
 *   assignTo?:      profile id (admin assigns to sales; admin/sales may reassign),
 *   notes?:         internal notes,
 *   followUpAt?:    ISO timestamp,
 *   meetingAt?:     ISO timestamp, meetingLink?: string,
 *   decisionNotes?: required when status = rejected
 * }
 *
 * Guards:
 *  - only admin can assign
 *  - only the assignee (or admin) can move assigned_to_sales → sales_review/accepted/rejected
 *  - reject requires a reason (decisionNotes)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('admin', 'sales');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    status?: string;
    assignTo?: string;
    notes?: string;
    followUpAt?: string;
    meetingAt?: string;
    meetingLink?: string;
    decisionNotes?: string;
  }>(request);
  if (isRejected(body)) return body;

  const { data: enquiry, error: fetchError } = await guard.supabase
    .from('enquiries')
    .select('id, status, assigned_to, full_name, company, email')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!enquiry) return jsonError('Enquiry not found', 404);
  const row = enquiry as EnquiryRow & { full_name: string; company: string; email: string };

  const updates: Record<string, unknown> = {};
  let transitionNote = body.notes || null;

  // ---- Assignment (admin only) ----
  if (body.assignTo !== undefined) {
    if (guard.user.role !== 'admin') return jsonError('Only an admin can (re)assign enquiries', 403);

    const { data: target, error: targetError } = await guard.supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', body.assignTo)
      .maybeSingle();

    if (targetError) return jsonError(targetError.message, 500);
    if (!target || !['sales', 'admin'].includes(target.role)) {
      return jsonError('Enquiries can only be assigned to sales users', 400);
    }

    updates.assigned_to = body.assignTo;
    updates.assigned_by = guard.user.id;
    updates.assigned_at = new Date().toISOString();
    updates.status = 'assigned_to_sales';

    await notify(
      body.assignTo,
      'New enquiry assigned',
      `${row.full_name} (${row.company}) — assigned by ${guard.user.fullName || 'admin'}.`,
      'general',
      '/sales/enquiries'
    );
    transitionNote = `Assigned to ${target.full_name || target.role}`;
  }

  // ---- Status transitions ----
  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return jsonError(`Invalid status '${body.status}'`, 400);
    }

    const from = row.status;
    const to = body.status;

    // Sales ownership check on the sales-review segment of the pipeline
    if (['sales_review', 'accepted', 'rejected'].includes(to) && guard.user.role === 'sales') {
      if (row.assigned_to !== guard.user.id) {
        return jsonError('Only the assigned sales user can progress this enquiry', 403);
      }
    }
    if (['sales_review', 'accepted', 'rejected'].includes(to) && guard.user.role === 'admin') {
      // admin may act on behalf
    }

    if (to === 'rejected' && !body.decisionNotes && !body.notes) {
      return jsonError('A rejection reason is required', 422);
    }

    // Enquiry → lead conversion bookkeeping on acceptance
    if (to === 'accepted') {
      const { data: lead } = await guard.supabase
        .from('leads')
        .insert({
          company_name: row.company || row.full_name,
          contact_name: row.full_name,
          contact_email: row.email,
          service_interest: null,
          source: 'admin_enquiry',
          stage: 'qualified',
          owner_id: row.assigned_to ?? guard.user.id,
        })
        .select('id')
        .single();
      if (lead) updates.converted_lead_id = lead.id;
    }

    updates.status = to;
    await recordTransition(guard.supabase, params.id, from, to, guard.user.id, body.decisionNotes || body.notes);
  }

  // ---- Plain updates ----
  if (body.notes !== undefined && !body.status && body.assignTo === undefined) {
    updates.admin_notes = body.notes;
  }
  if (body.followUpAt !== undefined) updates.follow_up_at = body.followUpAt || null;
  if (body.meetingAt !== undefined) updates.meeting_at = body.meetingAt || null;
  if (body.meetingLink !== undefined) updates.meeting_link = body.meetingLink || null;

  if (Object.keys(updates).length === 0) {
    return jsonError('Nothing to update', 400);
  }

  const { data: updated, error: updateError } = await guard.supabase
    .from('enquiries')
    .update(updates)
    .eq('id', params.id)
    .select(ENQUIRY_SELECT)
    .single();

  if (updateError) return jsonError(updateError.message, 500);

  await audit(
    'ENQUIRY_UPDATE',
    'enquiries',
    params.id,
    guard,
    { ...updates, note: transitionNote },
    request.headers.get('x-real-ip')
  );

  return NextResponse.json(updated);
}

/**
 * GET /api/enquiries/[id]?mode=history — kept for clarity; history is in GET above.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole('admin');
  if (isRejected(guard)) return guard;

  const { error } = await guard.supabase.from('enquiries').delete().eq('id', params.id);
  if (error) return jsonError(error.message, 500);

  await audit('DELETE_ENQUIRY', 'enquiries', params.id, guard, undefined, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
