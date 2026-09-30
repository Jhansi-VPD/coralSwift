'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, CalendarDays, Activity, Inbox } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { portalClient, type AnnouncementRecord, type TrackingUpdateRecord } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface QaProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
}

export default function QaDashboardPage() {
  const [projects, setProjects] = useState<QaProject[]>([]);
  const [updates, setUpdates] = useState<TrackingUpdateRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, a] = await Promise.all([
        portalClient.get<QaProject[]>('/api/tracking/projects'),
        portalClient.get<{ recent: TrackingUpdateRecord[] }>('/api/tracking/summary').catch(() => ({ recent: [] })),
        portalClient.get<AnnouncementRecord[]>('/api/announcements').catch(() => []),
      ]);
      setProjects(p);
      setUpdates(s.recent ?? []);
      setAnnouncements(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QA dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PortalShell role="qa" title="QA Workspace" subtitle="Projects under your quality review, announcements, and tracking activity.">
      <AnnouncementsBanner announcements={announcements} max={2} />

      {loading && <LoadingState label="Loading QA workspace…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard label="Projects Assigned" value={projects.length} accent="coral" icon={<ClipboardCheck className="w-4 h-4" />} />
            <StatCard label="Recent Updates" value={updates.length} accent="indigo" icon={<Activity className="w-4 h-4" />} sub="org-wide, latest 50" />
            <StatCard label="Announcements" value={announcements.length} accent="amber" icon={<Inbox className="w-4 h-4" />} />
          </div>

          <SectionCard
            title="My Projects"
            action={<Link href="/qa/projects" className="text-xs text-coral-600 font-semibold hover:underline">Open QA reviews →</Link>}
          >
            {projects.length === 0 ? (
              <EmptyState title="No projects assigned yet" hint="The manager assigns you as project QA from the project workspace." />
            ) : (
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-coral-200 transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.code ?? '—'} · {p.progress_percent}% complete</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={p.health} />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Tracking Activity">
            {updates.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">No tracking activity yet.</p>
            ) : (
              <div className="space-y-3">
                {updates.slice(0, 8).map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0B1426] font-display">{u.title}</span>
                      <span className="text-slate-400 font-mono ml-2">{u.project?.code ?? ''}</span>
                      <span className="text-slate-500 ml-2">by {(u.author?.full_name ?? u.author_role) ?? 'unknown'}</span>
                    </div>
                    <span className="text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
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
