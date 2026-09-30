'use client';

import { useEffect, useState } from 'react';
import { Download, ExternalLink, CalendarDays } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { downloadIcs, type GoogleCalendarLink } from '@/lib/calendar';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

/** QA CALENDAR — .ics feed + Google Calendar links for milestones on QA projects. */
export default function QaCalendarPage() {
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

  return (
    <PortalShell
      role="qa"
      title="Calendar"
      subtitle="Milestones on your QA projects — sync to Google Calendar or any calendar app."
      actions={
        <Button variant="dark" size="sm" disabled={icsBusy} onClick={exportIcs}>
          <Download className="w-3.5 h-3.5 mr-1.5 inline" /> Export .ics
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && (
        <SectionCard title="Add to Google Calendar">
          {links.length === 0 ? (
            <EmptyState title="Nothing scheduled" hint="Milestones with due dates appear here as one-click Google Calendar events." />
          ) : (
            <div className="space-y-3">
              {links.map((l, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <CalendarDays className="w-4 h-4 text-coral-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display truncate">{l.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatDate(l.start)}</div>
                    </div>
                  </div>
                  <a href={l.url} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="w-3.5 h-3.5 mr-1 inline" /> Google Calendar
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </PortalShell>
  );
}
