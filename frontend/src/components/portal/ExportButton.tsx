'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { apiUrl, authHeaders } from '@/lib/api-base';

/**
 * EXPORT CSV BUTTON — downloads `/api/exports/{resource}` with the caller's
 * Bearer token and saves it as a file. The browser never navigates away.
 */
export function ExportButton({ resource, label, className }: { resource: string; label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/exports/${resource}`), { headers: authHeaders(false) });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] ?? `${resource}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={download}
      disabled={busy}
      className={
        className ??
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50'
      }
    >
      <Download className="w-3.5 h-3.5" />
      {busy ? 'Exporting…' : (label ?? 'Export CSV')}
    </button>
  );
}
