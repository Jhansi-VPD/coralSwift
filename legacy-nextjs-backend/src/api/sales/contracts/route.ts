import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const CONTRACT_SELECT = `
  id, title, engagement_type, start_date, end_date, contract_value, currency, status,
  document_path, created_at,
  organization:client_organizations (id, name),
  proposal:proposals (id, title, total_amount)
`;

/**
 * GET /api/sales/contracts — all contracts (sales/admin; other staff read via RLS).
 * Query: ?organization=<uuid>&status=active|draft|expired|terminated
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const organization = searchParams.get('organization');
  const status = searchParams.get('status');

  let query = guard.supabase.from('contracts').select(CONTRACT_SELECT);
  if (organization) query = query.eq('organization_id', organization);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/sales/contracts — create a contract.
 * Body: { organizationId, title, engagementType?, startDate?, endDate?, contractValue?, proposalId? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    organizationId: string;
    title: string;
    engagementType?: string;
    startDate?: string;
    endDate?: string;
    contractValue?: number;
    currency?: string;
    proposalId?: string;
  }>(request, ['organizationId', 'title']);
  if (isRejected(body)) return body;

  const { data, error } = await guard.supabase
    .from('contracts')
    .insert({
      organization_id: body.organizationId,
      proposal_id: body.proposalId || null,
      title: body.title.trim(),
      engagement_type: body.engagementType || 'project',
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      contract_value: body.contractValue ?? null,
      currency: body.currency || 'USD',
      status: 'draft',
      created_by: guard.user.id,
    })
    .select(CONTRACT_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  await audit('CREATE_CONTRACT', 'contracts', data.id, guard, { title: data.title }, request.headers.get('x-real-ip'));
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/sales/contracts — update lifecycle. Body: { id, status?, endDate?, contractValue?, documentPath? } */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    status?: string;
    endDate?: string;
    contractValue?: number;
    documentPath?: string;
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const updates: Record<string, unknown> = {};
  if (body.status) {
    if (!['draft', 'active', 'expired', 'terminated'].includes(body.status)) {
      return jsonError('status must be draft, active, expired, or terminated', 400);
    }
    updates.status = body.status;
  }
  if (body.endDate !== undefined) updates.end_date = body.endDate || null;
  if (body.contractValue !== undefined) updates.contract_value = body.contractValue;
  if (body.documentPath !== undefined) updates.document_path = body.documentPath || null;

  if (Object.keys(updates).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await guard.supabase
    .from('contracts')
    .update(updates)
    .eq('id', body.id)
    .select(CONTRACT_SELECT)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Contract not found', 404);

  await audit('UPDATE_CONTRACT', 'contracts', body.id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json(data);
}
