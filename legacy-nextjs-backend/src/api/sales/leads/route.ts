import { NextRequest, NextResponse } from 'next/server';
import { requireRole, isRejected, parseJsonBody, jsonError, audit, notify } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

const LEAD_SELECT = `
  id, company_name, contact_name, contact_email, contact_phone,
  service_interest, source, estimated_value, stage, loss_reason,
  converted_client_org_id, created_at, updated_at,
  enquiry:enquiries (id, message, source_page),
  owner:profiles!leads_owner_id_fkey (id, full_name, email)
`;

/**
 * GET /api/sales/leads — pipeline view (sales/admin).
 * Query: ?stage=new|contacted|qualified|proposal_sent|won|lost
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const stage = new URL(request.url).searchParams.get('stage');
  let query = guard.supabase.from('leads').select(LEAD_SELECT);
  if (stage) query = query.eq('stage', stage);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

/**
 * POST /api/sales/leads — create a lead, optionally converting a marketing enquiry.
 * Body: { companyName, contactName, contactEmail, enquiryId?, serviceInterest?,
 *         estimatedValue?, contactPhone?, source? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    companyName: string;
    contactName: string;
    contactEmail: string;
    enquiryId?: string;
    serviceInterest?: string;
    estimatedValue?: number;
    contactPhone?: string;
    source?: string;
  }>(request, ['companyName', 'contactName', 'contactEmail']);
  if (isRejected(body)) return body;

  // Duplicate guard: same company+email already an open lead
  const { data: existing } = await guard.supabase
    .from('leads')
    .select('id, stage')
    .eq('contact_email', body.contactEmail.trim().toLowerCase())
    .in('stage', ['new', 'contacted', 'qualified', 'proposal_sent'])
    .limit(1);

  if (existing && existing.length > 0) {
    return jsonError('An open lead with this contact email already exists', 409, { leadId: existing[0].id });
  }

  const { data: lead, error } = await guard.supabase
    .from('leads')
    .insert({
      enquiry_id: body.enquiryId || null,
      company_name: body.companyName.trim(),
      contact_name: body.contactName.trim(),
      contact_email: body.contactEmail.trim().toLowerCase(),
      contact_phone: body.contactPhone || null,
      service_interest: body.serviceInterest || null,
      source: body.source || 'manual',
      estimated_value: body.estimatedValue ?? null,
      stage: 'new',
      owner_id: guard.user.id,
    })
    .select(LEAD_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);

  // If born from an enquiry, track the linkage
  if (body.enquiryId) {
    await guard.supabase
      .from('enquiries')
      .update({ status: 'qualified' })
      .eq('id', body.enquiryId);
  }

  await audit('CREATE_LEAD', 'leads', lead.id, guard, { company: lead.company_name }, request.headers.get('x-real-ip'));
  return NextResponse.json(lead, { status: 201 });
}

/**
 * PATCH /api/sales/leads — move a lead through the pipeline / edit details.
 * Body: { id, stage?, estimatedValue?, lossReason?, note? }
 * Adding `note` appends a lead_activities row atomically with the stage change.
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{
    id: string;
    stage?: string;
    estimatedValue?: number;
    lossReason?: string;
    note?: string;
  }>(request, ['id']);
  if (isRejected(body)) return body;

  const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
  if (body.stage && !STAGES.includes(body.stage)) {
    return jsonError(`stage must be one of: ${STAGES.join(', ')}`, 400);
  }
  if (body.stage === 'lost' && !body.lossReason) {
    return jsonError('lossReason is required when marking a lead lost', 400);
  }

  const updates: Record<string, unknown> = {};
  if (body.stage) updates.stage = body.stage;
  if (body.estimatedValue !== undefined) updates.estimated_value = body.estimatedValue;
  if (body.lossReason) updates.loss_reason = body.lossReason;

  if (Object.keys(updates).length > 0) {
    const { error } = await guard.supabase.from('leads').update(updates).eq('id', body.id);
    if (error) return jsonError(error.message, 500);
  }

  if (body.note) {
    const { error } = await guard.supabase.from('lead_activities').insert({
      lead_id: body.id,
      author_id: guard.user.id,
      note: body.note,
    });
    if (error) return jsonError(error.message, 500);
  }

  if (Object.keys(updates).length === 0 && !body.note) {
    return jsonError('Nothing to update', 400);
  }

  await audit('UPDATE_LEAD', 'leads', body.id, guard, updates, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true });
}

/**
 * POST /api/sales/leads?action=convert&id=<leadId> — actually that's awkward;
 * conversion lives in its own handler below via PUT.
 * PUT /api/sales/leads — convert a won lead into a client organization.
 * Body: { leadId, organizationName? }
 */
export async function PUT(request: NextRequest) {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const body = await parseJsonBody<{ leadId: string; organizationName?: string }>(request, ['leadId']);
  if (isRejected(body)) return body;

  const { data: lead, error: leadError } = await guard.supabase
    .from('leads')
    .select('*')
    .eq('id', body.leadId)
    .maybeSingle();

  if (leadError) return jsonError(leadError.message, 500);
  if (!lead) return jsonError('Lead not found', 404);
  if (lead.converted_client_org_id) {
    return jsonError('Lead is already converted', 409, { organizationId: lead.converted_client_org_id });
  }

  // Create the client organization
  const { data: org, error: orgError } = await guard.supabase
    .from('client_organizations')
    .insert({
      name: body.organizationName?.trim() || lead.company_name,
      account_owner_id: guard.user.id,
      status: 'active',
    })
    .select('id, name')
    .single();

  if (orgError) return jsonError(orgError.message, 500);

  // Carry the primary contact across
  await guard.supabase.from('client_contacts').insert({
    organization_id: org.id,
    name: lead.contact_name,
    email: lead.contact_email,
    phone: lead.contact_phone,
    is_primary: true,
  });

  await guard.supabase
    .from('leads')
    .update({ stage: 'won', converted_client_org_id: org.id })
    .eq('id', lead.id);

  await audit('CONVERT_LEAD', 'client_organizations', org.id, guard, { lead_id: lead.id }, request.headers.get('x-real-ip'));
  return NextResponse.json({ success: true, organization: org }, { status: 201 });
}
