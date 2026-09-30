'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { TrackingComposer } from '@/components/portal/TrackingComposer';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient, type TrackingUpdateRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

interface QaProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
}

interface ProjectMember {
  id: string;
  employee: { id: string; employee_code: string; profile: { full_name: string } | null };
}

/** QA WORKSPACE — review updates to the manager, review notes to employees. */
export default function QaProjectsPage() {
  const [projects, setProjects] = useState<QaProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdateRecord[]>([]);
  const [members, setMembers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalClient.get<QaProject[]>('/api/tracking/projects');
      setProjects(data);
      if (!selected && data.length > 0) setSelected(data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadProject = async (projectId: string) => {
    setSelected(projectId);
    setUpdates([]);
    try {
      const [u, mems] = await Promise.all([
        portalClient.get<TrackingUpdateRecord[]>(`/api/tracking/projects/${projectId}/updates`),
        portalClient.get<ProjectMember[]>(`/api/tracking/projects/${projectId}/members`).catch(() => []),
      ]);
      setUpdates(u);
      setMembers(
        (mems ?? [])
          .filter(m => m.employee?.profile?.full_name)
          .map(m => ({ id: m.employee.id, label: `${m.employee.profile!.full_name} (${m.employee.employee_code})` }))
      );
    } catch {
      setUpdates([]);
      setMembers([]);
    }
  };

  useEffect(() => { if (selected) loadProject(selected); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selected]);

  const selectedProject = projects.find(p => p.id === selected);

  return (
    <PortalShell role="qa" title="QA Reviews" subtitle="Post review notes to the manager or directly to an employee.">
      <AnnouncementsBanner max={1} />

      {loading && <LoadingState label="Loading your projects…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState title="No QA assignments" hint="The manager assigns QA reviewers on each project." />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected === p.id ? 'bg-white border-coral-300 shadow-sm' : 'bg-white/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-[#0B1426] font-display">{p.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">{p.code ?? '—'} · {p.progress_percent}%</div>
                <div className="flex gap-1.5 mt-2"><StatusBadge status={p.health} /><StatusBadge status={p.status} /></div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-5">
            {selectedProject && (
              <TrackingComposer
                projectId={selectedProject.id}
                role="qa"
                employees={members}
                onPosted={() => selected && loadProject(selected)}
              />
            )}

            <SectionCard title={`Updates — ${selectedProject?.name ?? ''}`}>
              {updates.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No updates on this project yet.</p>
              ) : (
                <div className="space-y-3">
                  {updates.map(u => (
                    <div key={u.id} className="p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
                      </div>
                      {u.body && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{u.body}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {u.visibility === 'public' ? 'client-visible' : u.visibility === 'employee' ? 'to employee' : 'to manager'}
                        </span>
                        {u.employee?.profile?.full_name && (
                          <span className="text-[10px] text-slate-400 font-mono">→ {u.employee.profile.full_name}</span>
                        )}
                        {u.manager_note && <span className="text-[10px] text-emerald-600 font-mono">manager: “{u.manager_note}”</span>}
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
