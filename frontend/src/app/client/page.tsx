'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, ReceiptText, FileText, Building2 } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState, ProgressBar } from '@/components/portal';
import { portalClient, formatMoney } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface ClientProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
  client_review_status: string;
  target_end_date: string | null;
}

interface Overview {
  organization: { id: string; name: string; industry: string | null; status: string; account_owner: { full_name: string; email: string } | { full_name: string; email: string }[] | null } | null;
  projects: ClientProject[];
  invoices: InvoiceRow[];
  contracts: { id: string; title: string; engagement_type: string; status: string; contract_value: number | null; currency: string }[];
  summary: { activeProjects: number; outstandingInvoices: number; openContracts: number };
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function ClientDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await portalClient.get<Overview>('/api/client/overview'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PortalShell
      role="client"
      title="Welcome"
      subtitle={data?.organization ? `${data.organization.name}${data.organization.industry ? ` · ${data.organization.industry}` : ''}` : 'Your projects, invoices, and support.'}
      actions={<button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>}
    >
      <AnnouncementsBanner max={2} />
      {loading && <LoadingState label="Loading your projects…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Active Projects" value={data.summary.activeProjects} accent="coral" icon={<FolderKanban className="w-4 h-4" />} />
            <StatCard label="Outstanding" value={formatMoney(data.summary.outstandingInvoices)} accent="amber" icon={<ReceiptText className="w-4 h-4" />} />
            <StatCard label="Active Contracts" value={data.summary.openContracts} accent="indigo" icon={<FileText className="w-4 h-4" />} />
            <StatCard label="Invoices" value={data.invoices.length} accent="cyan" icon={<ReceiptText className="w-4 h-4" />} />
          </div>

          <SectionCard
            title="Your Projects"
            action={<Link href="/client/projects" className="text-xs text-coral-600 font-semibold hover:underline">View all →</Link>}
          >
            {data.projects.length === 0 ? (
              <EmptyState title="No active projects yet" hint="Once your engagement begins, live project tracking appears here." />
            ) : (
              <div className="space-y-4">
                {data.projects.map(p => (
                  <Link key={p.id} href={`/client/projects/${p.id}`} className="block p-5 rounded-2xl border border-slate-100 hover:border-coral-300 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#0B1426] font-display truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.code ?? p.id.slice(0, 8)} · target {p.target_end_date ? formatDate(p.target_end_date) : '—'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={p.status} />
                        <StatusBadge status={p.client_review_status} />
                      </div>
                    </div>
                    <ProgressBar percent={p.progress_percent} />
                    <div className="text-[10px] font-mono text-slate-400 mt-1.5">{p.progress_percent}% complete</div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Invoices"
            action={<Link href="/client/invoices" className="text-xs text-coral-600 font-semibold hover:underline">All invoices →</Link>}
          >
            {data.invoices.length === 0 ? (
              <EmptyState title="No invoices yet" hint="Invoices appear after project acceptance." />
            ) : (
              <div className="space-y-3">
                {data.invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-mono">{inv.invoice_number}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Issued {formatDate(inv.issue_date)}{inv.due_date ? ` · due ${formatDate(inv.due_date)}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold font-mono text-slate-700">{formatMoney(inv.amount, inv.currency)}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </PortalShell>
  );
}
