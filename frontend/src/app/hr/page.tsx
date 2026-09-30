'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CalendarClock, CalendarDays, Building2, UserPlus, UserCheck } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { AnnouncementsBanner } from '@/components/portal/AnnouncementsBanner';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

interface EmployeeRow {
  id: string;
  employee_code: string;
  designation: string;
  status: string;
  profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  department: { name: string } | { name: string }[] | null;
}

interface LeaveRow {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  employee: { employee_code: string; profile: { full_name: string } | { full_name: string }[] };
}

function person(p: unknown): string {
  const row = Array.isArray(p) ? p[0] : p;
  const obj = row as { full_name?: string } | null | undefined;
  return obj?.full_name ?? '—';
}

export default function HRDashboardPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [leave, setLeave] = useState<LeaveRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [emp, lv, att] = await Promise.all([
        portalClient.get<EmployeeRow[]>('/api/hr/employees'),
        portalClient.get<LeaveRow[]>('/api/hr/leave?status=pending'),
        portalClient.get<Record<string, unknown>[]>('/api/hr/attendance'),
      ]);
      setEmployees(emp);
      setLeave(lv);
      setAttendance(att);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HR data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = attendance.filter(a => a.work_date === today);
  const presentToday = todayRows.filter(a => a.status === 'present' || a.status === 'remote').length;
  const onLeaveToday = todayRows.filter(a => a.status === 'leave').length;
  const active = employees.filter(e => e.status === 'active').length;
  const departments = new Set(
    employees.map(e => {
      const d = Array.isArray(e.department) ? e.department[0] : e.department;
      return d?.name;
    }).filter(Boolean)
  );

  return (
    <PortalShell
      role="hr"
      title="People Overview"
      subtitle="Workforce status, attendance, and pending leave approvals."
      actions={<button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>}
    >
      <AnnouncementsBanner max={2} />
      {loading && <LoadingState label="Loading people data…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Total Employees" value={employees.length} accent="indigo" icon={<Users className="w-4 h-4" />} sub={`${active} active`} />
            <StatCard label="Present Today" value={presentToday} accent="emerald" icon={<UserCheck className="w-4 h-4" />} sub={`${onLeaveToday} on leave`} />
            <StatCard label="Pending Leave" value={leave.length} accent="amber" icon={<CalendarDays className="w-4 h-4" />} />
            <StatCard label="Departments" value={departments.size} accent="coral" icon={<Building2 className="w-4 h-4" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Pending Leave Approvals"
              action={<Link href="/hr/leave" className="text-xs text-coral-600 font-semibold hover:underline">Manage leave →</Link>}
            >
              {leave.length === 0 ? (
                <EmptyState title="No pending requests" />
              ) : (
                <div className="space-y-3">
                  {leave.slice(0, 6).map(lv => (
                    <div key={lv.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display">{person(lv.employee)}</div>
                        <div className="text-[10px] text-slate-500 font-mono capitalize">
                          {lv.leave_type} · {lv.start_date} → {lv.end_date}
                        </div>
                      </div>
                      <StatusBadge status={lv.status} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Employees"
              action={<Link href="/hr/employees" className="text-xs text-coral-600 font-semibold hover:underline">All employees →</Link>}
            >
              {employees.length === 0 ? (
                <EmptyState title="No employee records" hint="Onboard your first employee from the Employees page." />
              ) : (
                <div className="space-y-3">
                  {employees.slice(0, 6).map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display">{person(e.profile)}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {e.employee_code} · {e.designation || '—'}
                        </div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
