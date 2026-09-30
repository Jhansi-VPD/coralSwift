'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type TaskRecord } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface TimesheetRow {
  id: string;
  work_date: string;
  hours: number;
  notes: string | null;
  status: string;
  review_notes: string | null;
  project: { id: string; name: string } | { id: string; name: string }[] | null;
  task: { id: string; title: string } | { id: string; title: string }[] | null;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function EmployeeTimesheetsPage() {
  const [entries, setEntries] = useState<TimesheetRow[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  // form state
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('8');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [ts, t] = await Promise.all([
        portalClient.get<TimesheetRow[]>('/api/employee/timesheets'),
        portalClient.get<TaskRecord[]>('/api/employee/tasks'),
      ]);
      setEntries(ts);
      setTasks(t.filter(x => x.status !== 'done'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      await portalClient.post('/api/employee/timesheets', {
        workDate,
        hours: Number(hours),
        taskId: taskId || undefined,
        projectId: task?.project?.id,
        notes: notes || undefined,
      });
      setShowForm(false);
      setNotes('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to log time');
    } finally {
      setBusy(false);
    }
  };

  const totalHours = entries.reduce((s, e) => s + Number(e.hours || 0), 0);
  const pending = entries.filter(e => e.status === 'pending').length;

  return (
    <PortalShell
      role="employee"
      title="Timesheets"
      subtitle="Log hours against project tasks. Entries go to your manager for approval."
      actions={
        <Button variant="coral" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Log Time
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Total logged</div>
              <div className="text-2xl font-bold font-display text-[#0B1426]">{totalHours}h</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Entries</div>
              <div className="text-2xl font-bold font-display text-[#0B1426]">{entries.length}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">Awaiting approval</div>
              <div className="text-2xl font-bold font-display text-amber-600">{pending}</div>
            </div>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              title="No time logged yet"
              hint="Log your first entry — pick a task, date, and hours."
              action={<Button variant="coral" size="sm" onClick={() => setShowForm(true)}>Log Time</Button>}
            />
          ) : (
            <SectionCard title="My Entries">
              <div className="space-y-3">
                {entries.map(e => {
                  const proj = first(e.project);
                  const task = first(e.task);
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{task?.title ?? proj?.name ?? 'General work'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatDate(e.work_date)} · {proj?.name ?? '—'}
                          {e.notes ? ` · ${e.notes}` : ''}
                        </div>
                        {e.review_notes && <div className="text-[10px] text-rose-600 mt-0.5">Reviewer: {e.review_notes}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-700">{e.hours}h</span>
                        <StatusBadge status={e.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Log time dialog */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log Time">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Date</label>
            <input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Task</label>
            <select value={taskId} onChange={e => setTaskId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none">
              <option value="">General / no specific task</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.project?.name} — {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Hours</label>
            <input type="number" min="0.5" max="24" step="0.5" value={hours} onChange={e => setHours(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy || !hours} onClick={submit}>Submit for Approval</Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
