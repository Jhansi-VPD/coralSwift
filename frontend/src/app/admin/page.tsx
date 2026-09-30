'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers, Briefcase, FileCheck, MessageSquare, Users, TrendingUp,
  Clock, ShieldCheck, FolderKanban, ReceiptText, TicketCheck, CalendarClock,
} from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient, formatMoney, type AdminStats } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

/**
 * ADMIN DASHBOARD — existing UI structure, now wired to /api/admin/stats
 * (real database aggregates instead of hardcoded/mocked numbers).
 */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await portalClient.get<AdminStats>('/api/admin/stats'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Administrative Overview"
        subtitle="Live organization-wide metrics across sales, delivery, people, finance, and support."
        actions={<Button variant="secondary" size="sm" onClick={loadData}>Refresh Data</Button>}
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {isLoading && <LoadingState label="Crunching organization metrics…" />}
        {!isLoading && error && <ErrorState message={error} onRetry={loadData} />}

        {!isLoading && !error && stats && (
          <>
            {/* Business Overview */}
            <section className="space-y-4">
              <h2 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500">Business Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard label="Total Enquiries" value={stats.business.totalEnquiries} icon={<MessageSquare className="w-4 h-4" />} />
                <StatCard label="New Enquiries" value={stats.business.newEnquiries} accent="emerald" icon={<MessageSquare className="w-4 h-4" />} />
                <StatCard label="Active Clients" value={stats.business.activeClients} accent="indigo" icon={<Briefcase className="w-4 h-4" />} />
                <StatCard label="Active Projects" value={stats.business.activeProjects} accent="coral" icon={<FolderKanban className="w-4 h-4" />} />
                <StatCard label="Completed Projects" value={stats.business.completedProjects} accent="cyan" icon={<FolderKanban className="w-4 h-4" />} />
              </div>
            </section>

            {/* Sales + Projects */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard
                title="Sales Pipeline"
                action={<Link href="/admin/enquiries" className="text-xs text-coral-600 font-semibold hover:underline">Manage enquiries →</Link>}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Open leads</div>
                    <div className="text-2xl font-bold font-display text-[#0B1426]">{stats.sales.openLeads}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Pipeline value</div>
                    <div className="text-2xl font-bold font-display text-[#0B1426]">{formatMoney(stats.sales.pipelineValue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Won</div>
                    <div className="text-2xl font-bold font-display text-emerald-600">{stats.sales.wonLeads}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Won value</div>
                    <div className="text-2xl font-bold font-display text-emerald-600">{formatMoney(stats.sales.wonValue)}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Project Health"
                action={<span className="text-xs font-mono text-slate-400">avg {stats.projects.avgProgress}%</span>}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2">Awaiting client review</div>
                    <div className="text-2xl font-bold font-display text-amber-600">{stats.projects.awaitingReview}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2">Changes requested</div>
                    <div className="text-2xl font-bold font-display text-rose-600">{stats.projects.changesRequested}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2">At risk / critical</div>
                    <div className="text-2xl font-bold font-display text-rose-600">
                      {(stats.projects.byHealth['at_risk'] ?? 0) + (stats.projects.byHealth['critical'] ?? 0)}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </section>

            {/* People / Finance / Support */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                label="Employees"
                value={stats.employees.active}
                sub={`${stats.employees.total} total • ${stats.employees.onLeaveToday} on leave today`}
                accent="indigo"
                icon={<Users className="w-4 h-4" />}
              />
              <StatCard
                label="Outstanding"
                value={formatMoney(stats.finance.outstanding)}
                sub={`${stats.finance.invoiceCount} invoices • ${formatMoney(stats.finance.paid)} paid`}
                accent="emerald"
                icon={<ReceiptText className="w-4 h-4" />}
              />
              <StatCard
                label="Open Tickets"
                value={(stats.support['open'] ?? 0) + (stats.support['in_progress'] ?? 0)}
                sub={`${stats.support['resolved'] ?? 0} resolved`}
                accent="rose"
                icon={<TicketCheck className="w-4 h-4" />}
              />
              <StatCard
                label="Pending Leave"
                value={stats.leavePending}
                accent="amber"
                icon={<CalendarClock className="w-4 h-4" />}
              />
            </section>

            {/* Recent activity */}
            <section>
              <SectionCard title="Recent System Activity">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentActivity.map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                          <span className="font-semibold text-[#0B1426] font-mono truncate">{a.action}</span>
                          <span className="text-slate-400 truncate">{a.entity_type ?? ''}</span>
                          <span className="text-slate-500 truncate">{a.user_email ?? 'system'}</span>
                        </div>
                        <span className="text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
