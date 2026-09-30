import { NextResponse } from 'next/server';
import { requireRole, isRejected, jsonError } from '@backend/lib/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats — real organization-wide KPIs for the admin dashboard.
 * Replaces hardcoded statistics with live database aggregates.
 */
export async function GET() {
  const guard = await requireRole('admin');
  if (isRejected(guard)) return guard;

  const sb = guard.supabase;

  const [
    enquiriesAll, enquiriesNew, leadsAll, leadsWon, orgs, projectsAll,
    employeesAll, employeesActive, attendanceToday, leavePending,
    invoicesAll, ticketsAll, auditRecent,
  ] = await Promise.all([
    sb.from('enquiries').select('id, status, created_at'),
    sb.from('enquiries').select('id').eq('status', 'new'),
    sb.from('leads').select('id, stage, estimated_value'),
    sb.from('leads').select('id, estimated_value').eq('stage', 'won'),
    sb.from('client_organizations').select('id').eq('status', 'active'),
    sb.from('projects').select('id, status, health, progress_percent, client_review_status'),
    sb.from('employees').select('id, status'),
    sb.from('employees').select('id').eq('status', 'active'),
    sb.from('attendance').select('id, status').gte('work_date', new Date().toISOString().slice(0, 10)),
    sb.from('leave_requests').select('id').eq('status', 'pending'),
    sb.from('invoices').select('id, status, amount'),
    sb.from('tickets').select('id, status'),
    sb.from('audit_logs').select('id, action, entity_type, user_email, created_at').order('created_at', { ascending: false }).limit(8),
  ]);

  // Fail loudly on real errors (never fake success — ISSUES_REPORT #2 principle)
  const firstError = [enquiriesAll, leadsAll, orgs, projectsAll, employeesAll, invoicesAll, ticketsAll, auditRecent]
    .find(r => r.error);
  if (firstError?.error) return jsonError(firstError.error.message, 500);

  const projects = projectsAll.data ?? [];
  const invoices = invoicesAll.data ?? [];
  const leads = leadsAll.data ?? [];

  const countBy = <T extends Record<string, unknown>>(rows: T[] | null, key: keyof T) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      const k = String(r[key]);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  const sum = (rows: { amount?: number; estimated_value?: number }[]) =>
    rows.reduce((s, r) => s + Number(r.amount ?? r.estimated_value ?? 0), 0);

  return NextResponse.json({
    business: {
      totalEnquiries: (enquiriesAll.data ?? []).length,
      newEnquiries: (enquiriesNew.data ?? []).length,
      activeClients: (orgs.data ?? []).length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
    },
    sales: {
      byStage: countBy(leads, 'stage'),
      openLeads: leads.filter(l => !['won', 'lost'].includes(l.stage)).length,
      wonLeads: leadsWon.data?.length ?? 0,
      wonValue: sum(leadsWon.data ?? []),
      pipelineValue: leads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + Number(l.estimated_value || 0), 0),
    },
    projects: {
      byStatus: countBy(projects, 'status'),
      byHealth: countBy(projects, 'health'),
      awaitingReview: projects.filter(p => p.client_review_status === 'submitted').length,
      changesRequested: projects.filter(p => p.client_review_status === 'changes_requested').length,
      avgProgress: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress_percent || 0), 0) / projects.length) : 0,
    },
    employees: {
      total: (employeesAll.data ?? []).length,
      active: (employeesActive.data ?? []).length,
      byStatus: countBy(employeesAll.data, 'status'),
      attendanceToday: countBy(attendanceToday.data, 'status'),
      onLeaveToday: (attendanceToday.data ?? []).filter(a => a.status === 'leave').length,
    },
    finance: {
      invoiceCount: invoices.length,
      byStatus: countBy(invoices, 'status'),
      invoiced: sum(invoices.filter(i => !['draft', 'cancelled'].includes(i.status))),
      paid: sum(invoices.filter(i => i.status === 'paid')),
      outstanding: sum(invoices.filter(i => ['sent', 'overdue'].includes(i.status))),
    },
    support: countBy(ticketsAll.data, 'status'),
    leavePending: (leavePending.data ?? []).length,
    recentActivity: auditRecent.data ?? [],
  });
}
