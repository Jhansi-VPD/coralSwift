'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface ApprovalRow {
  id: string;
  employee: { employee_code: string; profile: { full_name: string } | { full_name: string }[] };
  // timesheet-specific
  work_date?: string;
  hours?: number;
  project?: { name: string } | { name: string }[] | null;
  // leave-specific
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string | null;
  created_at: string;
}

interface Approvals {
  timesheets: ApprovalRow[];
  leave: ApprovalRow[];
}

function person(emp: ApprovalRow['employee']): string {
  const p = Array.isArray(emp?.profile) ? emp.profile[0] : emp?.profile;
  return p?.full_name ?? emp?.employee_code ?? '—';
}

function projectName(p: ApprovalRow['project']): string {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? '—';
}

export default function ManagerApprovalsPage() {
  const [data, setData] = useState<Approvals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'timesheet' | 'leave'; id: string; name: string } | null>(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setData(await portalClient.get<Approvals>('/api/manager/approvals'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (type: 'timesheet' | 'leave', id: string, decision: 'approved' | 'rejected', notes?: string) => {
    setBusy(id);
    try {
      await portalClient.post('/api/manager/approvals', { type, id, decision, notes });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setBusy(null);
      setRejectTarget(null);
      setReason('');
    }
  };

  return (
    <PortalShell role="manager" title="Approvals Inbox" subtitle="Timesheets and leave requests from your direct reports.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title={`Pending Timesheets (${data.timesheets.length})`}>
            {data.timesheets.length === 0 ? (
              <EmptyState title="No pending timesheets" />
            ) : (
              <div className="space-y-3">
                {data.timesheets.map(ts => (
                  <div key={ts.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display">{person(ts.employee)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {ts.work_date ? formatDate(ts.work_date) : ''} · {ts.hours}h · {projectName(ts.project)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button disabled={busy === ts.id} onClick={() => decide('timesheet', ts.id, 'approved')} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        disabled={busy === ts.id}
                        onClick={() => setRejectTarget({ type: 'timesheet', id: ts.id, name: person(ts.employee) })}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={`Pending Leave (${data.leave.length})`}>
            {data.leave.length === 0 ? (
              <EmptyState title="No pending leave requests" />
            ) : (
              <div className="space-y-3">
                {data.leave.map(lv => (
                  <div key={lv.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display">{person(lv.employee)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {lv.leave_type} · {lv.start_date ? formatDate(lv.start_date) : ''} → {lv.end_date ? formatDate(lv.end_date) : ''}
                      </div>
                      {lv.reason && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{lv.reason}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button disabled={busy === lv.id} onClick={() => decide('leave', lv.id, 'approved')} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        disabled={busy === lv.id}
                        onClick={() => setRejectTarget({ type: 'leave', id: lv.id, name: person(lv.employee) })}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Rejection reason dialog */}
      <Modal isOpen={rejectTarget !== null} onClose={() => setRejectTarget(null)} title="Reject with Reason">
        {rejectTarget && (
          <div>
            <p className="text-xs text-slate-600 mb-3">
              Rejecting <strong>{rejectTarget.name}</strong>&apos;s {rejectTarget.type === 'leave' ? 'leave request' : 'timesheet entry'}.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason shared with the employee…"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" size="sm" disabled={!reason.trim()} onClick={() => decide(rejectTarget.type, rejectTarget.id, 'rejected', reason)}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
