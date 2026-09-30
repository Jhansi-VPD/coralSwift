'use client';

import { useEffect, useState } from 'react';
import { Download, ExternalLink, CalendarDays, Video, PhoneCall } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { downloadIcs, type GoogleCalendarLink } from '@/lib/calendar';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

/** SALES CALENDAR — follow-ups & meetings as .ics / one-click Google Calendar events. */
export default function SalesCalendarPage() {
  const [links, setLinks] = useState<GoogleCalendarLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [icsBusy, setIcsBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setLinks(await portalClient.get<GoogleCalendarLink[]>('/api/exports/calendar/google-links'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportIcs = async () => {
    setIcsBusy(true);
    try { await downloadIcs(); } catch (err) { alert(err instanceof Error ? err.message : 'Export failed'); } finally { setIcsBusy(false); }
  };

  const followUps = links.filter(l => l.title.startsWith('Follow-up'));
  const meetings = links.filter(l => l.title.startsWith('Meeting'));

  return (
    <PortalShell
      role="sales"
      title="Calendar"
      subtitle="Your follow-ups and meetings — sync to Google Calendar or any calendar app."
      actions={
        <Button variant="dark" size="sm" disabled={icsBusy} onClick={exportIcs}>
          <Download className="w-3.5 h-3.5 mr-1.5 inline" /> Export .ics
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title={`Follow-ups (${followUps.length})`}>
            {followUps.length === 0 ? (
              <EmptyState title="Nothing scheduled" hint="Schedule follow-ups from the Enquiries workspace." />
            ) : (
              <div className="space-y-3">
                {followUps.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <PhoneCall className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{l.title.replace('Follow-up: ', '')}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatDate(l.start)}</div>
                      </div>
                    </div>
                    <a href={l.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-semibold text-coral-600 hover:underline">
                      + Google Cal
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={`Meetings (${meetings.length})`}>
            {meetings.length === 0 ? (
              <EmptyState title="No meetings scheduled" />
            ) : (
              <div className="space-y-3">
                {meetings.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <Video className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0B1426] font-display truncate">{l.title.replace('Meeting: ', '')}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{formatDate(l.start)}</div>
                      </div>
                    </div>
                    <a href={l.url} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="w-3.5 h-3.5 mr-1 inline" /> Add
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </PortalShell>
  );
}
