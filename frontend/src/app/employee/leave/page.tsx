'use client';

import React, { useEffect, useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, StatCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
}

export default function EmployeeLeavePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await portalClient.get<{ balance: number | null; requests: LeaveRequest[] }>('/api/employee/leave');
      setBalance(data.balance);
      setRequests(data.requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/employee/leave', {
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      setShowForm(false);
      setReason('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Leave request failed');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this leave request?')) return;
    setBusy(true);
    try {
      await portalClient.delete(`/api/employee/leave?id=${id}`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <PortalShell
      role="employee"
      title="Leave"
      subtitle="Apply for leave, track approvals, and manage your balance."
      actions={
        <Button variant="coral" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Apply for Leave
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <StatCard label="Annual Balance" value={balance != null ? `${balance} days` : '—'} accent="indigo" icon={<CalendarDays className="w-4 h-4" />} />
            <StatCard label="Pending Requests" value={pending} accent="amber" icon={<CalendarDays className="w-4 h-4" />} />
            <StatCard label="Total Requests" value={requests.length} accent="cyan" icon={<CalendarDays className="w-4 h-4" />} />
          </div>

          {requests.length === 0 ? (
            <EmptyState
              title="No leave requests yet"
              hint="Submit a request and your manager or HR will review it."
              action={<Button variant="coral" size="sm" onClick={() => setShowForm(true)}>Apply for Leave</Button>}
            />
          ) : (
            <SectionCard title="Leave History">
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display capitalize">{r.leave_type} leave</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatDate(r.start_date)} → {formatDate(r.end_date)}
                        {r.reason ? ` · ${r.reason}` : ''}
                      </div>
                      {r.review_notes && <div className="text-[10px] text-slate-500 mt-0.5">Reviewer note: {r.review_notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      {r.status === 'pending' && (
                        <button
                          onClick={() => cancel(r.id)}
                          disabled={busy}
                          className="text-[10px] font-mono font-bold text-rose-600 hover:underline"
                        >
                          CANCEL
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      {/* Apply dialog */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Apply for Leave">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Leave type</label>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none">
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="unpaid">Unpaid</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Reason (optional)</label>
            <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          {balance != null && leaveType === 'annual' && (
            <p className="text-[10px] font-mono text-slate-500">Current balance: {balance} days</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy || !startDate || !endDate} onClick={apply}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
