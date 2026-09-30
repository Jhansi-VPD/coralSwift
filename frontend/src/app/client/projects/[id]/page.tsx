'use client';

import React, { useEffect, useState, use } from 'react';
import { CheckCircle2, Undo2, Milestone as MilestoneIcon, CalendarClock } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState, ProgressBar } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type ProjectRecord } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

/**
 * CLIENT PROJECT TRACKER — client-safe view only.
 * Shows: status, progress, milestones, client-visible updates, expected completion.
 * Hides: employees, internal tasks, internal notes, allocations.
 * Review workflow: accept (completes project) or request changes (returns to manager).
 */

type Detail = { project: {
  id: string; name: string; code: string | null; description: string | null;
  status: string; health: string; progress_percent: number;
  client_review_status: string; client_feedback: string | null;
  expected_completion_date: string | null;
  start_date: string | null; target_end_date: string | null;
  milestones: ProjectRecord['milestones'];
  updates: { id: string; title: string; body: string | null; created_at: string; author: { full_name: string } | null }[];
} };

export default function ClientProjectTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setData(await portalClient.get<Detail>(`/api/client/projects/${id}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const decide = async (decision: 'accept' | 'request_changes', note?: string) => {
    setBusy(true);
    try {
      await portalClient.patch(`/api/client/projects/${id}`, { decision, feedback: note });
      setShowChanges(false);
      setFeedback('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setBusy(false);
    }
  };

  const p = data?.project;

  return (
    <PortalShell role="client" title={p?.name ?? 'Project'}>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && p && (
        <div className="space-y-6">
          {/* Header + review actions */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={p.status} size="md" />
                <StatusBadge status={p.health} size="md" />
                <StatusBadge status={p.client_review_status} size="md" />
              </div>
              {p.client_review_status === 'submitted' && (
                <div className="flex items-center gap-2">
                  <Button variant="coral" size="sm" disabled={busy} onClick={() => decide('accept')}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept Delivery
                  </Button>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => setShowChanges(true)}>
                    <Undo2 className="w-3.5 h-3.5" /> Request Changes
                  </Button>
                </div>
              )}
            </div>

            {p.description && <p className="text-xs text-slate-600 mb-4">{p.description}</p>}

            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">Overall Progress</span>
              <span className="text-sm font-bold font-display text-[#0B1426]">{p.progress_percent}%</span>
            </div>
            <ProgressBar percent={p.progress_percent} />

            <div className="mt-4 flex flex-wrap gap-5 text-[11px] font-mono text-slate-500">
              {p.start_date && <span>Started {formatDate(p.start_date)}</span>}
              {p.target_end_date && <span>Target {formatDate(p.target_end_date)}</span>}
              {p.expected_completion_date && (
                <span className="flex items-center gap-1.5 text-coral-600 font-bold">
                  <CalendarClock className="w-3.5 h-3.5" /> Expected: {formatDate(p.expected_completion_date)}
                </span>
              )}
            </div>

            {p.client_feedback && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">Your feedback on record</div>
                <p className="text-xs text-slate-700">{p.client_feedback}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Milestone timeline */}
            <SectionCard title="Milestones">
              {p.milestones.length === 0 ? (
                <EmptyState title="No milestones published yet" />
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />
                  {[...p.milestones].sort((a, b) => a.sort_order - b.sort_order).map(m => (
                    <div key={m.id} className="relative pb-5 last:pb-0">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        m.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : m.status === 'in_progress'
                            ? 'bg-white border-coral-500'
                            : 'bg-white border-slate-300'
                      }`}>
                        {m.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {m.status === 'in_progress' && <div className="w-1.5 h-1.5 rounded-full bg-coral-500" />}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold font-display ${m.status === 'completed' ? 'text-slate-500 line-through' : 'text-[#0B1426]'}`}>
                          {m.title}
                        </span>
                        <StatusBadge status={m.status} />
                      </div>
                      {m.due_date && <div className="text-[10px] text-slate-400 font-mono mt-0.5">Due {formatDate(m.due_date)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Latest updates */}
            <SectionCard title="Latest Updates">
              {p.updates.length === 0 ? (
                <EmptyState title="No updates yet" hint="Your delivery team posts progress notes here." />
              ) : (
                <div className="space-y-4">
                  {p.updates.map(u => (
                    <div key={u.id} className="border-l-2 border-coral-200 pl-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B1426] font-display">{u.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
                      </div>
                      {u.body && <p className="text-xs text-slate-600 mt-1">{u.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* Request changes dialog */}
      <Modal isOpen={showChanges} onClose={() => setShowChanges(false)} title="Request Changes">
        <div>
          <p className="text-xs text-slate-600 mb-3">
            Describe what needs to change. This goes directly to the delivery manager and pauses the review.
          </p>
          <textarea
            rows={4}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="e.g. The onboarding flow needs a two-factor step before deployment…"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowChanges(false)}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={busy || !feedback.trim()} onClick={() => decide('request_changes', feedback)}>
              Send Change Request
            </Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
