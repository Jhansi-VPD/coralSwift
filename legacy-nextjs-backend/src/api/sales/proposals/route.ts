import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const PROPOSAL_SELECT = `
  id, title, total_amount, currency, valid_until, status, sent_at, decided_at, created_at,
  lead:leads (id, company_name, contact_name),
  organization:client_organizations (id, name),
  items:proposal_items (id, description, quantity, unit_price, sort_order)
`;

function computeTotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
}

/**
 * GET /api/sales/proposals — all proposals with items (sales/admin).
 * Query: ?status=draft|sent|accepted|declined|expired
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const status = new URL(request.url).searchParams.get('status');
  let query = guard.supabase.from('proposals').select(PROPOSAL_SELECT);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/sales/proposals — create a proposal with line items.
 * Body: {
 *   title, leadId?, organizationId?, validUntil?,
 *   items: [{ description, quantity, unitPrice }]
 * }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    title: string;
    leadId?: string;
    organizationId?: string;
    validUntil?: string;
    currency?: string;
    items?: { description: string; quantity: number; unitPrice: number }[];
  }>(request, ['title']);
  if (isRejected(body)) return body;

  const items = (body.items ?? []).map((it, i) => ({
    description: it.description,
    quantity: Number(it.quantity) || 1,
    unit_price: Number(it.unitPrice) || 0,
    sort_order: i,
  }));

  const { data: proposal, error } = await guard.supabase
    .from('proposals')
    .insert({
      title: body.title.trim(),
      lead_id: body.leadId || null,
      organization_id: body.organizationId || null,
      valid_until: body.validUntil || null,
      currency: body.currency || 'USD',
      total_amount: computeTotal(items),
      status: 'draft',
      created_by: guard.user.id,
    })
    .select(PROPOSAL_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  if (items.length > 0) {
    const { error: itemsError } = await guard.supabase
      .from('proposal_items')
      .insert(items.map(it => ({ ...it, proposal_id: proposal.id })));
    if (itemsError) return jsonError(itemsError.message, 500);
  }

  await audit('CREATE_PROPOSAL', 'proposals', proposal.id, guard, { title: proposal.title }, request.headers.get('x-real-ip'));
  return NextResponse.json(proposal, { status: 201 });
}

/**
 * PATCH /api/sales/proposals — update items/status.
 * Body: { id, title?, validUntil?, status?, items? }
 * Status transitions: draft→sent (sets sent_at), sent→accepted/declined (sets decided_at).
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    title?: string;
    validUntil?: string;
    status?: string;
    items?: { description: string; quantity: number; unitPrice: number }[];
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const updates: Record<string, unknown> = {};
  if (body.title) updates.title = body.title.trim();
  if (body.validUntil !== undefined) updates.valid_until = body.validUntil || null;

  if (body.status) {
    const VALID = ['draft', 'sent', 'accepted', 'declined', 'expired'];
    if (!VALID.includes(body.status)) return jsonError(`status must be one of ${VALID.join(', ')}`, 400);
    updates.status = body.status;
    if (body.status === 'sent') updates.sent_at = new Date().toISOString();
    if (body.status === 'accepted' || body.status === 'declined') {
      updates.decided_at = new Date().toISOString();
    }
  }

  // Replace all items when a new list is provided
  if (body.items) {
    const items = body.items.map((it, i) => ({
      proposal_id: body.id,
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unitPrice) || 0,
      sort_order: i,
    }));
    updates.total_amount = computeTotal(items);

    await guard.supabase.from('proposal_items').delete().eq('proposal_id', body.id);
    if (items.length > 0) {
      const { error: itemsError } = await guard.supabase.from('proposal_items').insert(items);
      if (itemsError) return jsonError(itemsError.message, 500);
    }
  }

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { error } = await guard.supabase.from('proposals').update(updates).eq('id', body.id);
  if (error) return jsonError(error.message, 500);

  await audit('UPDATE_PROPOSAL', 'proposals', body.id, guard, { status: updates.status }, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
