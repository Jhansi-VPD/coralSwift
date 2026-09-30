'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { TrackingComposer } from '@/components/portal/TrackingComposer';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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

interface ProjectMember {
  id: string;
  employee: { id: string; employee_code: string; profile: { full_name: string } | null };
}

/** MANAGER TRACKING — the delivery inbox: employee & QA updates come in; client updates go out. */
export default function ManagerTrackingPage() {
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdateRecord[]>([]);
  const [members, setMembers] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<TrackingUpdateRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portalClient.get<MyProject[]>('/api/tracking/projects');
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
      const [u, detail] = await Promise.all([
        portalClient.get<TrackingUpdateRecord[]>(`/api/tracking/projects/${projectId}/updates`),
        portalClient.get<{ members: ProjectMember[] }>(`/api/manager/projects/${projectId}`).catch(() => null),
      ]);
      setUpdates(u);
      if (detail?.members) {
        setMembers(
          detail.members
            .filter(m => m.employee?.profile?.full_name)
            .map(m => ({ id: m.employee.id, label: `${m.employee.profile!.full_name} (${m.employee.employee_code})` }))
        );
      } else setMembers([]);
    } catch {
      setUpdates([]);
    }
  };

  useEffect(() => { if (selected) loadProject(selected); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selected]);

  const submitReview = async (resolve: boolean) => {
    if (!reviewing) return;
    setBusy(true);
    try {
      await portalClient.patch('/api/tracking/updates/review', {
        updateId: reviewing.id,
        note: reviewNote.trim() || undefined,
        resolve,
      });
      setReviewing(null);
      setReviewNote('');
      if (selected) await loadProject(selected);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setBusy(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selected);
  const inbound = updates.filter(u => u.author_role === 'employee' || u.author_role === 'qa');
  const outbound = updates.filter(u => u.author_role === 'manager' || u.visibility === 'public');

  return (
    <PortalShell role="manager" title="Tracking Inbox" subtitle="Employee & QA updates in; client-ready updates out. Admin sees everything.">
      <AnnouncementsBanner max={1} />

      {loading && <LoadingState label="Loading your projects…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState title="No projects yet" hint="Create a project first; tracking appears once team members post updates." />
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
                role="manager"
                employees={members}
                onPosted={() => selected && loadProject(selected)}
              />

              <SectionCard title={`Inbound — employee & QA updates (${inbound.length})`}>
                {inbound.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono">Nothing waiting — your team hasn't posted updates here.</p>
                ) : (
                  <div className="space-y-3">
                    {inbound.map(u => (
                      <div key={u.id} className="p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                            <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ml-2 ${
                              u.author_role === 'qa' ? 'bg-indigo-100 text-indigo-600' : 'bg-cyan-100 text-cyan-700'
                            }`}>{u.author_role}</span>
                            {u.employee?.profile?.full_name && (
                              <span className="text-[10px] text-slate-400 font-mono ml-2">→ {u.employee.profile.full_name}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
                        </div>
                        {u.body && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{u.body}</p>}
                        <div className="flex items-center gap-2 mt-2.5">
                          {u.manager_acknowledged_at ? (
                            <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> reviewed{u.manager_note ? `: “${u.manager_note}”` : ''}
                            </span>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => { setReviewing(u); setReviewNote(''); }}>
                              Review…
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Outbound — client-visible & internal (${outbound.length})`}>
                {outbound.length === 0 ? (
                  <p className="text-xs text-slate-400 font-mono">No client-facing updates yet. Use “Publish to client” above.</p>
                ) : (
                  <div className="space-y-3">
                    {outbound.map(u => (
                      <div key={u.id} className="p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(u.created_at)}</span>
                        </div>
                        {u.body && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{u.body}</p>}
                        <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded mt-2 inline-block ${
                          u.visibility === 'public' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.visibility === 'public' ? 'client-visible' : 'internal'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      )}

      <Modal isOpen={reviewing !== null} onClose={() => setReviewing(null)} title="Review update">
        {reviewing && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600"><strong>{reviewing.title}</strong> — {reviewing.author?.full_name ?? reviewing.author_role}</p>
            {reviewing.body && <p className="text-xs text-slate-500 whitespace-pre-line p-3 rounded-xl bg-slate-50">{reviewing.body}</p>}
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Note back to the author (optional)…"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none resize-y"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReviewing(null)}>Cancel</Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => submitReview(false)}>Acknowledge</Button>
              <Button variant="coral" size="sm" disabled={busy} onClick={() => submitReview(true)}>Acknowledge & resolve</Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
