'use client';

import { apiUrl, authHeaders } from './api-base';

export interface GoogleCalendarLink {
  title: string;
  start: string;
  url: string;
}

/** Download the signed-in user's calendar as an .ics file (auth via Bearer token). */
export async function downloadIcs(): Promise<void> {
  const res = await fetch(apiUrl('/api/exports/calendar.ics'), { headers: authHeaders(false) });
  if (!res.ok) throw new Error('Failed to export calendar');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coralswift-calendar.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
