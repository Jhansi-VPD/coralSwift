'use client';

import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface DocRow {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_size_bytes: number | null;
  created_at: string;
  project: { id: string; name: string } | { id: string; name: string }[] | null;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function ClientDocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await portalClient.get<DocRow[]>('/api/client/documents'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const download = async (doc: DocRow) => {
    setDownloading(doc.id);
    try {
      const res = await portalClient.post<{ downloadUrl: string }>('/api/client/documents', { id: doc.id });
      window.open(res.downloadUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PortalShell role="client" title="Documents" subtitle="Deliverables, agreements, and reports shared with your organization.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && docs.length === 0 && (
        <EmptyState title="No documents yet" hint="Deliverables and signed agreements appear here as work progresses." />
      )}
      {!loading && !error && docs.length > 0 && (
        <SectionCard title={`Shared Files (${docs.length})`}>
          <div className="space-y-3">
            {docs.map(d => {
              const proj = first(d.project);
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-coral-200 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-coral-50 border border-coral-200 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-coral-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B1426] font-display truncate">{d.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {d.category} · {formatDate(d.created_at)}{proj ? ` · ${proj.name}` : ''}
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" disabled={downloading === d.id} onClick={() => download(d)}>
                    <Download className="w-3.5 h-3.5" /> {downloading === d.id ? '…' : 'Download'}
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PortalShell>
  );
}
