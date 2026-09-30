'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, StatCard, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface AttendanceRow {
  id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  employee: {
    employee_code: string;
    profile: { full_name: string; email: string } | { full_name: string; email: string }[];
  };
}

function person(p: unknown): string {
  const row = Array.isArray(p) ? p[0] : p;
  return (row as { full_name?: string } | null)?.full_name ?? '—';
}

export default function HRAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      setRows(await portalClient.get<AttendanceRow[]>(`/api/hr/attendance?from=${from}&to=${to}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const present = rows.filter(r => r.status === 'present').length;
  const remote = rows.filter(r => r.status === 'remote').length;
  const leave = rows.filter(r => r.status === 'leave').length;

  return (
    <PortalShell
      role="hr"
      title="Attendance"
      subtitle="Organization-wide check-ins and attendance records."
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none shadow-xs" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none shadow-xs" />
          <Button variant="secondary" size="sm" onClick={load}>Apply</Button>
        </div>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard label="Records" value={rows.length} accent="indigo" icon={<CalendarIcon />} />
            <StatCard label="Present" value={present} accent="emerald" icon={<CalendarIcon />} />
            <StatCard label="Remote" value={remote} accent="cyan" icon={<CalendarIcon />} />
            <StatCard label="On Leave" value={leave} accent="amber" icon={<CalendarIcon />} />
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No attendance records for this range" />
          ) : (
            <TableShell head={['Employee', 'Date', 'Check In', 'Check Out', 'Status']}>
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-xs font-bold text-[#0B1426] font-display">{person(r.employee.profile)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.employee.employee_code}</div>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">{formatDate(r.work_date)}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">
                    {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">
                    {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </TableShell>
          )}
        </>
      )}
    </PortalShell>
  );
}

function CalendarIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
