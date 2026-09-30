'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type TaskRecord } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

const NEXT_STATUS: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'done',
  blocked: 'in_progress',
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  todo: 'Start work',
  in_progress: 'Submit for review',
  in_review: 'Mark done',
  blocked: 'Resume work',
};

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState('open');

  const load = async () => {
    setLoading(true);
    try {
      setTasks(await portalClient.get<TaskRecord[]>('/api/employee/tasks'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moveStatus = async (task: TaskRecord) => {
    const next = NEXT_STATUS[task.status];
    if (!next) return;
    setBusy(task.id);
    try {
      await portalClient.patch('/api/employee/tasks', { id: task.id, status: next });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  };

  const filtered = statusFilter === 'open'
    ? tasks.filter(t => t.status !== 'done')
    : statusFilter === 'all'
      ? tasks
      : tasks.filter(t => t.status === statusFilter);

  return (
    <PortalShell
      role="employee"
      title="My Tasks"
      subtitle="Assigned work from your managers. Move tasks through the workflow as you progress."
      actions={
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none shadow-xs">
          <option value="open">Open tasks</option>
          <option value="all">All</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="in_review">In review</option>
          <option value="done">Done</option>
        </select>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No tasks here" hint="Task assignments arrive with a notification." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <button onClick={() => setDetail(t)} className="text-left text-sm font-bold text-[#0B1426] font-display hover:text-coral-600 transition-colors">
                  {t.title}
                </button>
                <StatusBadge status={t.status} />
              </div>
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 mb-3">
                <span className="truncate">{t.project?.name ?? '—'}</span>
                <span className={t.priority === 'urgent' ? 'text-rose-600 font-bold' : t.priority === 'high' ? 'text-amber-600' : ''}>
                  {t.priority}{t.due_date ? ` · due ${formatDate(t.due_date)}` : ''}
                </span>
              </div>
              {t.status !== 'done' && NEXT_STATUS[t.status] && (
                <Button variant="coral" size="sm" disabled={busy === t.id} onClick={() => moveStatus(t)}>
                  {STATUS_ACTION_LABEL[t.status]} → {NEXT_STATUS[t.status].replace('_', ' ')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task detail */}
      <Modal isOpen={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} size="md" />
              <Badge variant="slate" size="md">{detail.priority}</Badge>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {detail.description || 'No description provided.'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <div>Project: {detail.project?.name ?? '—'}</div>
              {detail.milestone && <div>Milestone: {detail.milestone.title}</div>}
              {detail.due_date && <div>Due: {formatDate(detail.due_date)}</div>}
              {detail.estimated_hours != null && <div>Estimate: {detail.estimated_hours}h</div>}
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
