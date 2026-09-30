import { NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/overview — everything the client portal landing page needs,
 * scoped strictly to the signed-in client's organization:
 *   - organization summary + account owner
 *   - active projects with milestones & progress
 *   - open/recent invoices
 *   - active contracts
 */
export async function GET() {
  const guard = await requireRole('client');
  if (isRejected(guard)) return guard;

  // Resolve the client's organization
  const { data: contact } = await guard.supabase
    .from('client_contacts')
    .select('organization_id')
    .eq('profile_id', guard.user.id)
    .maybeSingle();

  if (!contact) return jsonError('No client organization linked to this account', 403);
  const orgId = contact.organization_id;

  const [orgRes, projectsRes, invoicesRes, contractsRes] = await Promise.all([
    guard.supabase
      .from('client_organizations')
      .select('id, name, industry, status, account_owner:profiles (full_name, email)')
      .eq('id', orgId)
      .maybeSingle(),
    guard.supabase
      .from('projects')
      .select(`
        id, name, code, description, status, health, start_date, target_end_date,
        manager:employees (employee_code, profile:profiles (full_name)),
        milestones:milestones (id, title, due_date, status, sort_order),
        documents:documents (id, title, category, file_name, created_at)
      `)
      .eq('organization_id', orgId)
      .in('status', ['planning', 'active', 'on_hold'])
      .order('created_at', { ascending: false }),
    guard.supabase
      .from('invoices')
      .select('id, invoice_number, issue_date, due_date, amount, currency, status, paid_at')
      .eq('organization_id', orgId)
      .order('issue_date', { ascending: false })
      .limit(24),
    guard.supabase
      .from('contracts')
      .select('id, title, engagement_type, start_date, end_date, contract_value, currency, status')
      .eq('organization_id', orgId)
      .in('status', ['active', 'draft'])
      .order('created_at', { ascending: false }),
  ]);

  if (orgRes.error) return jsonError(orgRes.error.message, 500);
  if (projectsRes.error) return jsonError(projectsRes.error.message, 500);
  if (invoicesRes.error) return jsonError(invoicesRes.error.message, 500);
  if (contractsRes.error) return jsonError(contractsRes.error.message, 500);

  // Compute per-project milestone progress
  const projects = (projectsRes.data ?? []).map(p => {
    const milestones = p.milestones ?? [];
    const completed = milestones.filter(m => m.status === 'completed').length;
    return {
      ...p,
      progress: milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : null,
      milestones: [...milestones].sort((a, b) => a.sort_order - b.sort_order),
    };
  });

  const outstanding = (invoicesRes.data ?? [])
    .filter(i => ['sent', 'overdue'].includes(i.status))
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  return NextResponse.json({
    organization: orgRes.data,
    projects,
    invoices: invoicesRes.data,
    contracts: contractsRes.data,
    summary: {
      activeProjects: projects.filter(p => p.status === 'active').length,
      outstandingInvoices: outstanding,
      openContracts: (contractsRes.data ?? []).filter(c => c.status === 'active').length,
    },
  });
}
