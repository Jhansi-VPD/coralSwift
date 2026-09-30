'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, TrendingUp, Building2, Handshake, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient, formatMoney } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

interface Analytics {
  pipeline: { stage: string; count: number; value: number }[];
  openPipeline: { count: number; value: number };
  conversion: { leadsWon: number; leadsLost: number; winRate: number | null };
  proposals: { sent: number; accepted: number; acceptanceRate: number | null; acceptedValue: number };
  revenue: { invoicedYtd: number; paidYtd: number; outstanding: number };
}

interface EnquiryItem {
  id: string;
  full_name: string;
  company: string;
  service_interest: string | null;
  status: string;
  created_at: string;
  follow_up_at: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal_sent: 'Proposal Sent', won: 'Won', lost: 'Lost',
};

export default function SalesDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, e] = await Promise.all([
        portalClient.get<Analytics>('/api/sales/analytics'),
        portalClient.get<{ items: EnquiryItem[] }>('/api/sales/enquiries?pageSize=8'),
      ]);
      setAnalytics(a);
      setEnquiries(e.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PortalShell
      role="sales"
      title="Sales Overview"
      subtitle="Your assigned enquiries, pipeline health, and conversion performance."
      actions={<button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>}
    >
      {loading && <LoadingState label="Loading your pipeline…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Assigned Enquiries" value={enquiries.length >= 8 ? '8+' : enquiries.length} accent="coral" icon={<Mail className="w-4 h-4" />} sub="latest 8 shown" />
            <StatCard label="Open Pipeline" value={formatMoney(analytics.openPipeline.value)} accent="indigo" icon={<TrendingUp className="w-4 h-4" />} sub={`${analytics.openPipeline.count} open leads`} />
            <StatCard label="Win Rate" value={analytics.conversion.winRate != null ? `${analytics.conversion.winRate}%` : '—'} accent="emerald" icon={<CheckCircle2 className="w-4 h-4" />} sub={`${analytics.conversion.leadsWon} won / ${analytics.conversion.leadsLost} lost`} />
            <StatCard label="Outstanding" value={formatMoney(analytics.revenue.outstanding)} accent="rose" icon={<Handshake className="w-4 h-4" />} sub={`${formatMoney(analytics.revenue.paidYtd)} paid YTD`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Lead Pipeline by Stage">
              <div className="space-y-3">
                {Object.entries(STAGE_LABELS).map(([stage, label]) => {
                  const conf = analytics.pipeline.find(p => p.stage === stage);
                  const max = Math.max(...analytics.pipeline.map(p => p.count), 1);
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="w-24 text-[10px] font-mono uppercase font-bold text-slate-500">{label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage === 'won' ? 'bg-emerald-500' : stage === 'lost' ? 'bg-rose-400' : 'bg-gradient-to-r from-coral-500 to-rose-600'}`}
                          style={{ width: `${((conf?.count ?? 0) / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs font-mono font-semibold text-slate-700">
                        {conf?.count ?? 0} · {formatMoney(conf?.value ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Assigned Enquiries"
              action={<Link href="/sales/enquiries" className="text-xs text-coral-600 font-semibold hover:underline">View all →</Link>}
            >
              {enquiries.length === 0 ? (
                <EmptyState title="No enquiries assigned yet" hint="Assigned enquiries from admin appear here automatically." />
              ) : (
                <div className="space-y-3">
                  {enquiries.map(enq => (
                    <div key={enq.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-coral-200 transition-colors">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{enq.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{enq.company} · {enq.service_interest ?? '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={enq.status} />
                        <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(enq.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
