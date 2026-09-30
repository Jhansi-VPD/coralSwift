import { NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

interface LeadRow {
  stage: string;
  estimated_value: number | null;
}

interface ProposalRow {
  status: string;
  total_amount: number;
  currency: string;
}

interface InvoiceRow {
  status: string;
  amount: number;
  currency: string;
}

/**
 * GET /api/sales/analytics — one-call dashboard KPIs (sales/admin).
 *
 * Returns:
 *  - pipeline: count + total estimated value of open leads by stage
 *  - conversion: won / total closed ratio
 *  - proposals: sent/accepted/declined counts + acceptance rate + accepted value
 *  - revenue: invoiced vs paid totals (current year)
 */
export async function GET() {
  const guard = await requireRole('sales', 'admin');
  if (isRejected(guard)) return guard;

  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const yearStartIso = yearStart.toISOString().slice(0, 10);

  const [leadsRes, proposalsRes, invoicesRes] = await Promise.all([
    guard.supabase.from('leads').select('stage, estimated_value'),
    guard.supabase.from('proposals').select('status, total_amount, currency'),
    guard.supabase
      .from('invoices')
      .select('status, amount, currency')
      .gte('issue_date', yearStartIso),
  ]);

  if (leadsRes.error) return jsonError(leadsRes.error.message, 500);
  if (proposalsRes.error) return jsonError(proposalsRes.error.message, 500);
  if (invoicesRes.error) return jsonError(invoicesRes.error.message, 500);

  const leads = (leadsRes.data ?? []) as LeadRow[];
  const proposals = (proposalsRes.data ?? []) as ProposalRow[];
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];

  const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const;

  const pipeline = STAGES.map(stage => {
    const stageLeads = leads.filter(l => l.stage === stage);
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0),
    };
  });

  const openPipeline = pipeline.filter(p => !['won', 'lost'].includes(p.stage));
  const won = leads.filter(l => l.stage === 'won').length;
  const lost = leads.filter(l => l.stage === 'lost').length;
  const closed = won + lost;

  const sent = proposals.filter(p => p.status !== 'draft');
  const accepted = proposals.filter(p => p.status === 'accepted');

  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const invoicedTotal = invoices
    .filter(i => !['draft', 'cancelled'].includes(i.status))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const outstanding = invoicedTotal - paidTotal;

  return NextResponse.json({
    pipeline,
    openPipeline: {
      count: openPipeline.reduce((s, p) => s + p.count, 0),
      value: openPipeline.reduce((s, p) => s + p.value, 0),
    },
    conversion: {
      leadsWon: won,
      leadsLost: lost,
      winRate: closed > 0 ? Math.round((won / closed) * 1000) / 10 : null,
    },
    proposals: {
      sent: sent.length,
      accepted: accepted.length,
      acceptanceRate: sent.length > 0 ? Math.round((accepted.length / sent.length) * 1000) / 10 : null,
      acceptedValue: accepted.reduce((s, p) => s + Number(p.total_amount || 0), 0),
    },
    revenue: {
      invoicedYtd: invoicedTotal,
      paidYtd: paidTotal,
      outstanding,
    },
  });
}
