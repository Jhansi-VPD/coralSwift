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
  mime_type: string | null;
  created_at: string;
  project: { id: string; name: string } | null;
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmployeeDocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await portalClient.get<DocRow[]>('/api/employee/documents'));
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
      const { downloadUrl } = await portalClient.post<{ downloadUrl: string; fileName: string }>(
        '/api/employee/documents',
        { id: doc.id }
      );
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const shared = docs.filter(d => d.category === 'hr_record' || !d.project);
  const project = docs.filter(d => d.project);

  return (
    <PortalShell role="employee" title="Documents" subtitle="HR policies, your records, and shared project files.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && docs.length === 0 && (
        <EmptyState title="No documents yet" hint="HR policies and project deliverables appear here." />
      )}

      {!loading && !error && docs.length > 0 && (
        <div className="space-y-6">
          {project.length > 0 && (
            <SectionCard title="Project Files">
              <div className="space-y-3">
                {project.map(d => (
                  <DocRowItem key={d.id} doc={d} downloading={downloading === d.id} onDownload={() => download(d)} />
                ))}
              </div>
            </SectionCard>
          )}
          {shared.length > 0 && (
            <SectionCard title="Policies & Records">
              <div className="space-y-3">
                {shared.map(d => (
                  <DocRowItem key={d.id} doc={d} downloading={downloading === d.id} onDownload={() => download(d)} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </PortalShell>
  );
}

function DocRowItem({ doc, downloading, onDownload }: { doc: DocRow; downloading: boolean; onDownload: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-coral-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-coral-50 border border-coral-200 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-coral-600" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0B1426] font-display truncate">{doc.title}</div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {doc.file_name} · {fmtSize(doc.file_size_bytes)} · {formatDate(doc.created_at)}
            {doc.project ? ` · ${doc.project.name}` : ''}
          </div>
        </div>
      </div>
      <Button variant="secondary" size="sm" disabled={downloading} onClick={onDownload}>
        <Download className="w-3.5 h-3.5" /> {downloading ? '…' : 'Download'}
      </Button>
    </div>
  );
}
