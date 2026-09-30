'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut, ListTodo, CalendarClock, CalendarDays, Bell } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatCard, SectionCard, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { portalClient, type TaskRecord, type NotificationRecord } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface AttendanceDay {
  id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
}

interface LeaveInfo {
  balance: number | null;
  requests: { id: string; leave_type: string; start_date: string; end_date: string; status: string }[];
}

interface TimesheetRow {
  id: string;
  work_date: string;
  hours: number;
  status: string;
  project: { name: string } | { name: string }[] | null;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function EmployeeDashboardPage() {
  const [today, setToday] = useState<AttendanceDay | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [leave, setLeave] = useState<LeaveInfo | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [att, t, lv, ts, notif] = await Promise.all([
        portalClient.get<{ today: AttendanceDay | null; history: AttendanceDay[] }>('/api/employee/attendance'),
        portalClient.get<TaskRecord[]>('/api/employee/tasks'),
        portalClient.get<LeaveInfo>('/api/employee/leave'),
        portalClient.get<TimesheetRow[]>('/api/employee/timesheets'),
        portalClient.get<NotificationRecord[]>('/api/employee/notifications?unread=true'),
      ]);
      setToday(att.today);
      setTasks(t);
      setLeave(lv);
      setTimesheets(ts.slice(0, 8));
      setNotifications(notif.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const punch = async (action: 'check_in' | 'check_out') => {
    setBusy(true);
    try {
      await portalClient.post('/api/employee/attendance', { action });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const openTasks = tasks.filter(t => t.status !== 'done');
  const weekHours = timesheets.reduce((s, t) => s + Number(t.hours || 0), 0);

  return (
    <PortalShell
      role="employee"
      title="My Workspace"
      subtitle="Your tasks, attendance, hours, and leave at a glance."
      actions={<button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>}
    >
      {loading && <LoadingState label="Loading your workspace…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Attendance punch card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 mb-1">
                Today · {formatDate(new Date().toISOString())}
              </div>
              {today ? (
                <div className="flex items-center gap-3">
                  <StatusBadge status={today.check_out ? 'present' : 'present'} size="md" />
                  <span className="text-xs font-mono text-slate-600">
                    In: {today.check_in ? new Date(today.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' · '}
                    Out: {today.check_out ? new Date(today.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono">Not checked in yet</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!today && (
                <Button variant="coral" size="sm" disabled={busy} onClick={() => punch('check_in')}>
                  <LogIn className="w-3.5 h-3.5" /> Check In
                </Button>
              )}
              {today && !today.check_out && (
                <Button variant="dark" size="sm" disabled={busy} onClick={() => punch('check_out')}>
                  <LogOut className="w-3.5 h-3.5" /> Check Out
                </Button>
              )}
              {today?.check_out && (
                <Badge variant="emerald" size="md">Day complete</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard label="Open Tasks" value={openTasks.length} accent="coral" icon={<ListTodo className="w-4 h-4" />} sub={`${tasks.length} total assigned`} />
            <StatCard label="Logged Hours" value={`${weekHours}h`} accent="cyan" icon={<CalendarClock className="w-4 h-4" />} sub="recent entries" />
            <StatCard label="Leave Balance" value={leave?.balance != null ? `${leave.balance}d` : '—'} accent="indigo" icon={<CalendarDays className="w-4 h-4" />} />
            <StatCard label="Notifications" value={notifications.length} accent="amber" icon={<Bell className="w-4 h-4" />} sub="unread" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="My Tasks"
              action={<Link href="/employee/tasks" className="text-xs text-coral-600 font-semibold hover:underline">All tasks →</Link>}
            >
              {openTasks.length === 0 ? (
                <EmptyState title="No open tasks" hint="New assignments from your manager appear here." />
              ) : (
                <div className="space-y-3">
                  {openTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-xs font-bold text-[#0B1426] font-display truncate">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono text-slate-400 truncate">{t.project?.name ?? '—'}{t.due_date ? ` · due ${formatDate(t.due_date)}` : ''}</span>
                        <span className={`text-[10px] font-mono font-bold ${t.priority === 'urgent' ? 'text-rose-600' : t.priority === 'high' ? 'text-amber-600' : 'text-slate-400'}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Timesheet Entries"
              action={<Link href="/employee/timesheets" className="text-xs text-coral-600 font-semibold hover:underline">Log time →</Link>}
            >
              {timesheets.length === 0 ? (
                <EmptyState title="No time logged yet" hint="Log hours against your project tasks." />
              ) : (
                <div className="space-y-3">
                  {timesheets.map(ts => {
                    const proj = first(ts.project);
                    return (
                      <div key={ts.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#0B1426]">{proj?.name ?? 'General'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formatDate(ts.work_date)}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold font-mono text-slate-700">{ts.hours}h</span>
                          <StatusBadge status={ts.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {notifications.length > 0 && (
            <SectionCard title="Recent Notifications">
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-[#0B1426]">{n.title}</div>
                      {n.body && <p className="text-[11px] text-slate-500 mt-0.5">{n.body}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(n.created_at)}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </PortalShell>
  );
}
