'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { TrackingComposer } from '@/components/portal/TrackingComposer';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient, type TrackingUpdateRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

interface MyProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
}

/** EMPLOYEE TRACKING — report progress to the manager; see manager & QA responses. */
export default function EmployeeTrackingPage() {
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalClient.get<MyProject[]>('/api/tracking/projects');
      setProjects(data);
      if (!selected && data.length > 0) setSelected(data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadUpdates = async (projectId: string) => {
    setUpdates([]);
    try {
      setUpdates(await portalClient.get<TrackingUpdateRecord[]>(`/api/tracking/projects/${projectId}/updates`));
    } catch {
      setUpdates([]);
    }
  };

  useEffect(() => { if (selected) loadUpdates(selected); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selected]);

  const selectedProject = projects.find(p => p.id === selected);

  return (
    <PortalShell role="employee" title="Project Tracking" subtitle="Send progress updates to your manager; read QA notes and replies.">
      <AnnouncementsBanner max={1} />

      {loading && <LoadingState label="Loading your projects…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState title="Not on any project yet" hint="Your manager adds you to projects; tracking appears here automatically." />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="space-y-5">
          {projects.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selected === p.id ? 'bg-coral-50 border-coral-300 text-coral-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {selectedProject && (
            <>
              <TrackingComposer
                projectId={selectedProject.id}
                role="employee"
                onPosted={() => selected && loadUpdates(selected)}
              />

              <SectionCard title={`Updates — ${selectedProject.name}`}>
                {updates.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono">No updates on this project yet.</p>
                ) : (
                  <div className="space-y-3">
                    {updates.map(u => {
                      const mine = u.author_role === 'employee';
                      return (
                        <div key={u.id} className={`p-3.5 rounded-2xl border ${mine ? 'border-coral-100 bg-coral-50/40' : 'border-slate-100'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
                          </div>
                          {u.body && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{u.body}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {u.author_role === 'qa' ? 'from QA' : mine ? 'my update' : 'from manager'}
                            </span>
                            {u.manager_acknowledged_at && <span className="text-[10px] text-emerald-600 font-mono">✓ manager reviewed</span>}
                            {u.manager_note && <span className="text-[10px] text-emerald-700 font-mono">“{u.manager_note}”</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      )}
    </PortalShell>
  );
}
