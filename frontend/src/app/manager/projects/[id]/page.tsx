'use client';

import React, { useEffect, useState, use } from 'react';
import { Send, Plus, CheckCircle2, StickyNote, CalendarClock } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState, ProgressBar } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type ProjectRecord } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

/**
 * MANAGER PROJECT DETAIL — milestones, task assignment, progress, journal
 * updates, and the client-review submission workflow.
 */

type Milestone = ProjectRecord['milestones'][number];
type Update = NonNullable<ProjectRecord['updates']>[number];

export default function ManagerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<'none' | 'milestone' | 'update' | 'submit'>('none');
  const [progressInput, setProgressInput] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const p = await portalClient.get<ProjectRecord>(`/api/manager/projects/${id}`);
      setProject(p);
      setProgressInput(p.progress_percent ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const patch = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      await portalClient.patch(`/api/manager/projects/${id}`, payload);
      setDialog('none');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell
      role="manager"
      title={project?.name ?? 'Project'}
      subtitle={project ? `${project.organization?.name ?? 'Internal'} · ${project.code ?? ''}` : undefined}
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && project && (
        <div className="space-y-6">
          {/* Header status row */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={project.status} size="md" />
                <StatusBadge status={project.health} size="md" />
                <StatusBadge status={project.client_review_status} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDialog('update')}>
                  <StickyNote className="w-3.5 h-3.5" /> Add Update
                </Button>
                <Button
                  variant="coral"
                  size="sm"
                  disabled={busy || project.client_review_status === 'submitted' || project.client_review_status === 'approved'}
                  onClick={() => setDialog('submit')}
                >
                  <Send className="w-3.5 h-3.5" />
                  {project.client_review_status === 'changes_requested' ? 'Resubmit for Review' : 'Submit for Client Review'}
                </Button>
              </div>
            </div>

            {project.client_feedback && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-[10px] font-mono uppercase font-bold text-rose-700 mb-1">Client feedback</div>
                <p className="text-xs text-rose-900">{project.client_feedback}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <ProgressBar percent={project.progress_percent} className="flex-1" />
              <span className="text-sm font-bold font-display text-[#0B1426]">{project.progress_percent}%</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 whitespace-nowrap">Update progress</label>
              <input
                type="range"
                min={0}
                max={100}
                value={progressInput}
                onChange={e => setProgressInput(Number(e.target.value))}
                className="flex-1 accent-coral-500"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || progressInput === project.progress_percent}
                onClick={() => patch({ progressPercent: progressInput })}
              >
                Save
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-5 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-coral-500" /> Target: {project.target_end_date ? formatDate(project.target_end_date) : '—'}</span>
              {project.expected_completion_date && <span>Expected: {formatDate(project.expected_completion_date)}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Milestones */}
            <SectionCard
              title="Milestones"
              action={
                <button onClick={() => setDialog('milestone')} className="text-xs font-semibold text-coral-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              }
            >
              {project.milestones.length === 0 ? (
                <EmptyState title="No milestones yet" hint="Break the project into client-visible milestones." />
              ) : (
                <div className="space-y-3">
                  {[...project.milestones].sort((a, b) => a.sort_order - b.sort_order).map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{m.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.due_date ? `Due ${formatDate(m.due_date)}` : 'No due date'}</div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Journal */}
            <SectionCard title="Project Journal">
              {(!project.updates || project.updates.length === 0) ? (
                <EmptyState title="No updates yet" hint="Post progress notes — client-visible ones appear in the client tracker." />
              ) : (
                <div className="space-y-4">
                  {project.updates.map((u: Update) => (
                    <div key={u.id} className="border-l-2 border-coral-200 pl-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(u.created_at)}</span>
                      </div>
                      {u.body && <p className="text-xs text-slate-600 mt-1">{u.body}</p>}
                      <span className="text-[10px] font-mono text-slate-400 mt-1 inline-block">
                        {u.is_client_visible === false ? 'internal' : 'client-visible'} · {u.author?.full_name ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* ---- Dialogs ---- */}
      <Modal isOpen={dialog === 'milestone'} onClose={() => setDialog('none')} title="Add Milestone">
        <MilestoneForm busy={busy} onSubmit={(title, dueDate) => patch({ milestone: { title, dueDate } })} onCancel={() => setDialog('none')} />
      </Modal>

      <Modal isOpen={dialog === 'update'} onClose={() => setDialog('none')} title="Add Project Update">
        <UpdateForm busy={busy} onSubmit={(title, body, isClientVisible) => patch({ update: { title, body, isClientVisible } })} onCancel={() => setDialog('none')} />
      </Modal>

      <Modal isOpen={dialog === 'submit'} onClose={() => setDialog('none')} title="Submit for Client Review">
        <div>
          <p className="text-xs text-slate-600 mb-4">
            Submitting <strong>{project?.name}</strong> notifies the client contacts and moves the project to
            <strong> Awaiting Review</strong>. The client can then accept (completing the project) or request changes.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialog('none')}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy} onClick={() => patch({ submitForReview: true })}>
              <Send className="w-3.5 h-3.5" /> Submit
            </Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}

function MilestoneForm({ busy, onSubmit, onCancel }: {
  busy: boolean;
  onSubmit: (title: string, dueDate?: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-3 focus:outline-none" />
      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Due date (optional)</label>
      <input type="date" value={due} onChange={e => setDue(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4 focus:outline-none" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="coral" size="sm" disabled={busy || !title.trim()} onClick={() => onSubmit(title.trim(), due || undefined)}>Add Milestone</Button>
      </div>
    </div>
  );
}

function UpdateForm({ busy, onSubmit, onCancel }: {
  busy: boolean;
  onSubmit: (title: string, body: string, clientVisible: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visible, setVisible] = useState(true);
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-3 focus:outline-none" />
      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Details</label>
      <textarea rows={3} value={body} onChange={e => setBody(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-3 focus:outline-none" />
      <label className="flex items-center gap-2 text-xs text-slate-600 mb-4">
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} className="accent-coral-500" />
        Visible to the client in their tracker
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="coral" size="sm" disabled={busy || !title.trim()} onClick={() => onSubmit(title.trim(), body, visible)}>Post Update</Button>
      </div>
    </div>
  );
}
