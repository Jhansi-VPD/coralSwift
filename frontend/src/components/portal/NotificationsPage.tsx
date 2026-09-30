'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { portalClient, type NotificationRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  task: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  timesheet: 'bg-amber-50 text-amber-700 border-amber-200',
  leave: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ticket: 'bg-rose-50 text-rose-700 border-rose-200',
  invoice: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  review: 'bg-coral-50 text-coral-700 border-coral-200',
  project: 'bg-blue-50 text-blue-700 border-blue-200',
  general: 'bg-slate-100 text-slate-600 border-slate-200',
};

/**
 * Shared notification inbox — reused by every portal via <Role>/notifications.
 */
export function NotificationsPage({ role }: { role: 'hr' | 'sales' | 'manager' | 'employee' | 'client' }) {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await portalClient.get<NotificationRecord[]>('/api/employee/notifications'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    setBusy(true);
    try {
      await portalClient.patch('/api/employee/notifications', {});
      await load();
    } finally {
      setBusy(false);
    }
  };

  const markOne = async (id: string) => {
    await portalClient.patch('/api/employee/notifications', { id }).catch(() => undefined);
    await load();
  };

  const unread = items.filter(i => !i.is_read);

  return (
    <SectionCard
      title={`Notifications${unread.length > 0 ? ` · ${unread.length} unread` : ''}`}
      action={
        unread.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={markAll} disabled={busy}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        ) : undefined
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="No notifications" hint="Assignments, approvals, and updates arrive here." />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map(n => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-colors ${
                n.is_read ? 'border-slate-100 bg-white' : 'border-coral-200 bg-coral-50/40'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`px-2 py-1 rounded-lg border text-[9px] font-mono uppercase font-bold shrink-0 ${CATEGORY_COLORS[n.category] ?? CATEGORY_COLORS.general}`}>
                  {n.category}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#0B1426]">{n.title}</div>
                  {n.body && <p className="text-[11px] text-slate-600 mt-0.5">{n.body}</p>}
                  {n.link && (
                    <Link href={n.link} onClick={() => !n.is_read && markOne(n.id)} className="text-[11px] font-semibold text-coral-600 hover:underline mt-1 inline-block">
                      Open →
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{formatTimeAgo(n.created_at)}</span>
                {!n.is_read && (
                  <button onClick={() => markOne(n.id)} className="text-[10px] font-mono text-slate-400 hover:text-slate-700" title="Mark read">
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
