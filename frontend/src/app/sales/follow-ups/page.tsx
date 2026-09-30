'use client';

import React, { useEffect, useState } from 'react';
import { CalendarPlus, Video } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, StatCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface EnquiryRow {
  id: string;
  full_name: string;
  company: string;
  status: string;
  follow_up_at: string | null;
  meeting_at: string | null;
  meeting_link: string | null;
  created_at: string;
}

export default function SalesFollowUpsPage() {
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<EnquiryRow | null>(null);
  const [when, setWhen] = useState('');
  const [link, setLink] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await portalClient.get<{ items: EnquiryRow[] }>('/api/sales/enquiries?pageSize=100');
      setRows(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const schedule = async (kind: 'followUpAt' | 'meetingAt') => {
    if (!target || !when) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { [kind]: new Date(when).toISOString() };
      if (kind === 'meetingAt' && link) payload.meetingLink = link;
      await portalClient.patch(`/api/sales/enquiries/${target.id}`, payload);
      setTarget(null);
      setWhen('');
      setLink('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Scheduling failed');
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now();
  const upcomingFollowUps = rows
    .filter(r => r.follow_up_at && new Date(r.follow_up_at).getTime() >= now)
    .sort((a, b) => new Date(a.follow_up_at!).getTime() - new Date(b.follow_up_at!).getTime());
  const upcomingMeetings = rows
    .filter(r => r.meeting_at && new Date(r.meeting_at).getTime() >= now)
    .sort((a, b) => new Date(a.meeting_at!).getTime() - new Date(b.meeting_at!).getTime());

  return (
    <PortalShell role="sales" title="Follow-ups & Meetings" subtitle="Scheduled touchpoints across your pipeline.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <StatCard label="Upcoming Follow-ups" value={upcomingFollowUps.length} accent="cyan" icon={<CalendarPlus className="w-4 h-4" />} />
            <StatCard label="Scheduled Meetings" value={upcomingMeetings.length} accent="indigo" icon={<Video className="w-4 h-4" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Follow-up Queue">
              {upcomingFollowUps.length === 0 ? (
                <EmptyState title="Nothing scheduled" hint="Schedule follow-ups from the Enquiries workspace." />
              ) : (
                <div className="space-y-3">
                  {upcomingFollowUps.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{r.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.company} · {formatDate(r.follow_up_at!)}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Meetings">
              {upcomingMeetings.length === 0 ? (
                <EmptyState title="No meetings scheduled" />
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{r.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.company} · {formatDate(r.meeting_at!)}</div>
                        {r.meeting_link && (
                          <a href={r.meeting_link} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-coral-600 hover:underline">
                            Join meeting →
                          </a>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}

      {/* Schedule dialog */}
      <Modal isOpen={target !== null} onClose={() => setTarget(null)} title="Schedule">
        {target && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600"><strong>{target.full_name}</strong> ({target.company})</p>
            <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Meeting link (optional)" className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>Cancel</Button>
              <Button variant="coral" size="sm" disabled={busy || !when} onClick={() => schedule('followUpAt')}>Set Follow-up</Button>
              <Button variant="dark" size="sm" disabled={busy || !when} onClick={() => schedule('meetingAt')}>Set Meeting</Button>
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
