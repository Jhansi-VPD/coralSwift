import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const ORG_SELECT = `
  id, name, industry, website, address, status, created_at,
  account_owner:profiles!client_organizations_account_owner_id_fkey (id, full_name, email),
  contacts:client_contacts (id, name, email, phone, is_primary),
  contracts:contracts (id, title, engagement_type, status, contract_value, currency, start_date, end_date)
`;

/**
 * GET /api/sales/clients — client organizations with contacts & contracts.
 * Query: ?status=prospect|active|churned
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const status = new URL(request.url).searchParams.get('status');
  let query = guard.supabase.from('client_organizations').select(ORG_SELECT);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('name');
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/** POST /api/sales/clients — create a client organization. Body: { name, industry?, website?, address?, contacts? } */
export async function POST(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    name: string;
    industry?: string;
    website?: string;
    address?: string;
    contacts?: { name: string; email: string; phone?: string; isPrimary?: boolean }[];
  }>(request, ['name']);
  if (isRejected(body)) return body;

  const { data: org, error } = await guard.supabase
    .from('client_organizations')
    .insert({
      name: body.name.trim(),
      industry: body.industry || null,
      website: body.website || null,
      address: body.address || null,
      account_owner_id: guard.user.id,
      status: 'prospect',
    })
    .select('id, name')
    .single();

  if (error) return jsonError(error.message, 500);

  if (body.contacts?.length) {
    await guard.supabase.from('client_contacts').insert(
      body.contacts.map((c, i) => ({
        organization_id: org.id,
        name: c.name,
        email: c.email.trim().toLowerCase(),
        phone: c.phone || null,
        is_primary: c.isPrimary ?? i === 0,
      }))
    );
  }

  await audit('CREATE_CLIENT_ORG', 'client_organizations', org.id, guard, { name: org.name }, request.headers.get('x-real-ip'));
  return NextResponse.json(org, { status: 201 });
}

/** PATCH /api/sales/clients — update org / manage contacts. Body: { id, name?, industry?, status?, contact? } */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    name?: string;
    industry?: string;
    website?: string;
    address?: string;
    status?: string;
    contact?: { id?: string; name: string; email: string; phone?: string; isPrimary?: boolean };
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const orgUpdates: Record<string, unknown> = {};
  if (body.name) orgUpdates.name = body.name.trim();
  if (body.industry !== undefined) orgUpdates.industry = body.industry;
  if (body.website !== undefined) orgUpdates.website = body.website;
  if (body.address !== undefined) orgUpdates.address = body.address;
  if (body.status) {
    if (!['prospect', 'active', 'churned'].includes(body.status)) {
      return jsonError('status must be prospect, active, or churned', 400);
    }
    orgUpdates.status = body.status;
  }

  if (Object.keys(orgUpdates).length > 0) {
    const { error } = await guard.supabase
      .from('client_organizations')
      .update(orgUpdates)
      .eq('id', body.id);
    if (error) return jsonError(error.message, 500);
  }

  // Upsert a contact when provided
  if (body.contact) {
    const c = body.contact;
    const payload = {
      organization_id: body.id,
      name: c.name,
      email: c.email.trim().toLowerCase(),
      phone: c.phone || null,
      is_primary: c.isPrimary ?? false,
    };
    const { error: contactError } = c.id
      ? await guard.supabase.from('client_contacts').update(payload).eq('id', c.id)
      : await guard.supabase.from('client_contacts').insert(payload);
    if (contactError) return jsonError(contactError.message, 500);
  }

  if (Object.keys(orgUpdates).length === 0 && !body.contact) {
    return jsonError('Nothing to update', 400);
  }

  await audit('UPDATE_CLIENT_ORG', 'client_organizations', body.id, guard, orgUpdates, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}
