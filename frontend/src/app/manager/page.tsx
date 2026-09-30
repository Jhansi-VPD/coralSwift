'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, ClipboardList, Users, AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState, ProgressBar } from '@/components/portal';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface ProjectSummary {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
  client_review_status: string;
  target_end_date: string | null;
  task_stats: Record<string, number>;
}

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  status: string;
  openTasks: number;
  hoursThisMonth: number;
  pendingTimesheets: number;
  pendingLeave: number;
}

interface Approvals {
  timesheets: unknown[];
  leave: unknown[];
}

export default function ManagerDashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [approvals, setApprovals] = useState<Approvals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t, a] = await Promise.all([
        portalClient.get<ProjectSummary[]>('/api/manager/projects'),
        portalClient.get<TeamMember[]>('/api/manager/team'),
        portalClient.get<Approvals>('/api/manager/approvals'),
      ]);
      setProjects(p);
      setTeam(t);
      setApprovals(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = (approvals?.timesheets.length ?? 0) + (approvals?.leave.length ?? 0);
  const attention = projects.filter(p => p.health !== 'on_track' || p.client_review_status === 'changes_requested');

  return (
    <PortalShell
      role="manager"
      title="Delivery Overview"
      subtitle="Your projects, team workload, and pending approvals at a glance."
      actions={<button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>}
    >
      {loading && <LoadingState label="Loading delivery data…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Active Projects" value={projects.filter(p => p.status === 'active').length} accent="coral" icon={<FolderKanban className="w-4 h-4" />} />
            <StatCard label="Needs Attention" value={attention.length} accent="rose" icon={<AlertTriangle className="w-4 h-4" />} sub="at-risk or client changes" />
            <StatCard label="Pending Approvals" value={pendingCount} accent="amber" icon={<ClipboardList className="w-4 h-4" />} sub={`${approvals?.timesheets.length ?? 0} timesheets · ${approvals?.leave.length ?? 0} leave`} />
            <StatCard label="Team Members" value={team.length} accent="indigo" icon={<Users className="w-4 h-4" />} sub={`${team.reduce((s, m) => s + m.openTasks, 0)} open tasks`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="My Projects"
              action={<Link href="/manager/projects" className="text-xs text-coral-600 font-semibold hover:underline">Manage projects →</Link>}
            >
              {projects.length === 0 ? (
                <EmptyState title="No projects yet" hint="Accepted enquiries become projects here." />
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 5).map(p => (
                    <Link key={p.id} href={`/manager/projects/${p.id}`} className="block p-4 rounded-2xl border border-slate-100 hover:border-coral-200 transition-colors">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0B1426] font-display truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.code ?? p.id.slice(0, 8)}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={p.health} />
                          <StatusBadge status={p.client_review_status} />
                        </div>
                      </div>
                      <ProgressBar percent={p.progress_percent} />
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Team Workload"
              action={<Link href="/manager/team" className="text-xs text-coral-600 font-semibold hover:underline">Team details →</Link>}
            >
              {team.length === 0 ? (
                <EmptyState title="No direct reports" />
              ) : (
                <div className="space-y-3">
                  {team.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{m.designation} · {m.hoursThisMonth}h this month</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                        <span className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">{m.openTasks} tasks</span>
                        {m.pendingTimesheets > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">{m.pendingTimesheets} TS</span>
                        )}
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
