'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ExportButton } from '@/components/portal/ExportButton';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface LeaveRow {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  employee: {
    id: string;
    employee_code: string;
    annual_leave_balance: number;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[];
  };
}

function person(p: unknown): string {
  const row = Array.isArray(p) ? p[0] : p;
  return (row as { full_name?: string } | null)?.full_name ?? '—';
}

export default function HRLeavePage() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRow | null>(null);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      setRows(await portalClient.get<LeaveRow[]>(`/api/hr/leave${q}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const decide = async (id: string, decision: 'approved' | 'rejected', reviewNotes?: string) => {
    setBusy(id);
    try {
      await portalClient.patch('/api/hr/leave', { id, decision, notes: reviewNotes });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Decision failed');
    } finally {
      setBusy(null);
      setRejectTarget(null);
      setNotes('');
    }
  };

  return (
    <PortalShell
      role="hr"
      title="Leave Management"
      subtitle="Approve or reject leave requests. Annual approvals deduct from balances automatically."
      actions={
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none shadow-xs">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <ExportButton resource="leave" label="CSV" />
        </div>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState title="No leave requests in this view" />
      )}
      {!loading && !error && rows.length > 0 && (
        <TableShell head={['Employee', 'Type', 'Dates', 'Reason', 'Balance', 'Status', 'Actions']}>
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="text-xs font-bold text-[#0B1426] font-display">{person(r.employee.profile)}</div>
                <div className="text-[10px] text-slate-400 font-mono">{r.employee.employee_code}</div>
              </td>
              <td className="px-5 py-3 text-xs font-mono capitalize text-slate-600">{r.leave_type}</td>
              <td className="px-5 py-3 text-xs font-mono text-slate-600">
                {formatDate(r.start_date)} → {formatDate(r.end_date)}
              </td>
              <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate">{r.reason ?? '—'}</td>
              <td className="px-5 py-3 text-xs font-mono text-slate-600">{r.employee.annual_leave_balance}d</td>
              <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-5 py-3">
                {r.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button disabled={busy === r.id} onClick={() => decide(r.id, 'approved')} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button disabled={busy === r.id} onClick={() => setRejectTarget(r)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">—</span>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Modal isOpen={rejectTarget !== null} onClose={() => setRejectTarget(null)} title="Reject Leave Request">
        {rejectTarget && (
          <div>
            <p className="text-xs text-slate-600 mb-3">
              Rejecting <strong>{person(rejectTarget.employee.profile)}</strong>&apos;s {rejectTarget.leave_type} leave.
            </p>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason (visible to the employee)…" className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4 focus:outline-none" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" size="sm" disabled={!notes.trim()} onClick={() => decide(rejectTarget.id, 'rejected', notes)}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
