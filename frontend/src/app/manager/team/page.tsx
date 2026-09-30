'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatCard, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { portalClient } from '@/lib/portal-client';

interface TeamMember {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  designation: string;
  department: string | null;
  status: string;
  joined: string;
  openTasks: number;
  hoursThisMonth: number;
  pendingTimesheets: number;
  pendingLeave: number;
  allocations: { project: { id: string; name: string; status: string }; allocation_percent: number }[];
}

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalClient
      .get<TeamMember[]>('/api/manager/team')
      .then(setTeam)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const totalOpen = team.reduce((s, m) => s + m.openTasks, 0);
  const totalHours = team.reduce((s, m) => s + m.hoursThisMonth, 0);

  return (
    <PortalShell role="manager" title="My Team" subtitle="Direct reports, workload, and capacity.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <StatCard label="Team Size" value={team.length} accent="indigo" icon={<UsersIcon />} />
            <StatCard label="Open Tasks" value={totalOpen} accent="coral" icon={<TasksIcon />} />
            <StatCard label="Hours This Month" value={totalHours} accent="emerald" icon={<ClockIcon />} />
          </div>

          {team.length === 0 ? (
            <EmptyState title="No direct reports" hint="Employees assigned to you in HR records appear here." />
          ) : (
            <TableShell head={['Member', 'Designation', 'Status', 'Open Tasks', 'Hours (mo)', 'Allocations', 'Pending']}>
              {team.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="text-xs font-bold text-[#0B1426] font-display">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.employee_code} · {m.email}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{m.designation || '—'}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">{m.status}</td>
                  <td className="px-5 py-3 text-xs font-bold font-mono text-cyan-700">{m.openTasks}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-700">{m.hoursThisMonth}h</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.allocations.length === 0 ? (
                        <span className="text-[10px] text-slate-400 font-mono">unallocated</span>
                      ) : (
                        m.allocations.map(a => (
                          <span key={a.project.id} className="px-2 py-0.5 rounded-lg bg-coral-50 text-coral-700 border border-coral-200 text-[10px] font-mono">
                            {a.project.name} · {a.allocation_percent}%
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {m.pendingTimesheets > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono">
                          {m.pendingTimesheets} TS
                        </span>
                      )}
                      {m.pendingLeave > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono">
                          {m.pendingLeave} leave
                        </span>
                      )}
                      {m.pendingTimesheets === 0 && m.pendingLeave === 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </>
      )}
    </PortalShell>
  );
}

function UsersIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function TasksIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function ClockIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }
