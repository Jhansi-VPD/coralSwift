'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { portalClient, type AnnouncementRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

/**
 * ANNOUNCEMENTS BANNER — renders targeted announcements at the top of a portal
 * dashboard. Fetches its own feed when `announcements` is not provided, so a
 * page adds it with a single line. High-priority posts get a coral treatment.
 */
export function AnnouncementsBanner({ announcements, max = 2 }: { announcements?: AnnouncementRecord[]; max?: number }) {
  const [feed, setFeed] = useState<AnnouncementRecord[] | null>(announcements ?? null);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (announcements) {
      setFeed(announcements);
      return;
    }
    let cancelled = false;
    portalClient.get<AnnouncementRecord[]>('/api/announcements')
      .then(items => { if (!cancelled) setFeed(items); })
      .catch(() => { if (!cancelled) setFeed([]); });
    return () => { cancelled = true; };
  }, [announcements]);

  if (!feed || feed.length === 0) return null;
  const shown = feed.filter(a => !dismissed[a.id]).slice(0, max);
  if (shown.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {shown.map(a => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            a.priority === 'high'
              ? 'bg-coral-50 border-coral-200'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            a.priority === 'high' ? 'bg-coral-100 border-coral-300 text-coral-600' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B1426] font-display">{a.title}</span>
              {a.priority === 'high' && (
                <span className="text-[9px] font-mono uppercase font-bold text-coral-600 bg-coral-100 px-1.5 py-0.5 rounded">high priority</span>
              )}
              <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(a.created_at)}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{a.body}</p>
            {a.author?.full_name && <p className="text-[10px] text-slate-400 font-mono mt-1">— {a.author.full_name}</p>}
          </div>
          <button
            onClick={() => setDismissed(d => ({ ...d, [a.id]: true }))}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
