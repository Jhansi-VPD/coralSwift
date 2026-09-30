'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { portalClient, type TrackingUpdateRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

interface Summary {
  total: number;
  openCount: number;
  byRole: Record<string, number>;
  recent: TrackingUpdateRecord[];
}

const ROLE_STYLE: Record<string, string> = {
  employee: 'bg-cyan-100 text-cyan-700',
  qa: 'bg-indigo-100 text-indigo-600',
  manager: 'bg-emerald-100 text-emerald-700',
};

/** ADMIN TRACKING AUDIT — every update across the employee ↔ QA ↔ manager ↔ client flow. */
export default function AdminTrackingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await portalClient.get<Summary>('/api/tracking/summary'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Project Tracking Audit"
        subtitle="Every update across the workflow: employee → manager, QA → manager/employee, manager → client."
        actions={
          <button onClick={load} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Refresh</button>
        }
      />
      <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {loading && <LoadingState label="Loading tracking activity…" />}
        {error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Total updates</div>
                <div className="text-2xl font-bold font-display text-[#0B1426] mt-1">{summary.total}</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Open</div>
                <div className="text-2xl font-bold font-display text-amber-600 mt-1">{summary.openCount}</div>
              </div>
              {['employee', 'qa', 'manager'].map(r => (
                <div key={r} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400">by {r}</div>
                  <div className="text-2xl font-bold font-display text-[#0B1426] mt-1">{summary.byRole[r] ?? 0}</div>
                </div>
              ))}
            </div>

            <SectionCard title="Recent updates (all projects, all roles)">
              {summary.recent.length === 0 ? (
                <EmptyState title="No tracking activity yet" hint="Updates posted from employee, QA, and manager portals appear here." />
              ) : (
                <div className="space-y-3">
                  {summary.recent.map(u => (
                    <div key={u.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${ROLE_STYLE[u.author_role ?? ''] ?? 'bg-slate-100 text-slate-500'}`}>
                            {u.author_role ?? 'unknown'}
                          </span>
                          <span className="text-xs font-bold text-[#0B1426] font-display truncate">{u.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(u.created_at)}</span>
                      </div>
                      {u.body && <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line">{u.body}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-mono text-slate-400">
                        <span className="text-slate-500">{u.project?.code ?? u.project_id.slice(0, 8)}</span>
                        <span>·</span>
                        <span>{u.author?.full_name ?? u.author?.email ?? '—'}</span>
                        <span>·</span>
                        <span className={`uppercase font-bold ${
                          u.visibility === 'public' ? 'text-emerald-600' : u.visibility === 'employee' ? 'text-cyan-600' : 'text-slate-400'
                        }`}>
                          {u.visibility === 'public' ? 'client-visible' : u.visibility === 'employee' ? 'to employee' : 'internal'}
                        </span>
                        {u.employee?.profile?.full_name && <><span>·</span><span>→ {u.employee.profile.full_name}</span></>}
                        {u.manager_acknowledged_at && <><span>·</span><span className="text-emerald-600">✓ manager reviewed</span></>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
