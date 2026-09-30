'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, ProgressBar } from '@/components/portal';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface ClientProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  health: string;
  progress_percent: number;
  client_review_status: string;
  target_end_date: string | null;
}

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalClient
      .get<{ projects: ClientProject[] }>('/api/client/overview')
      .then(d => setProjects(d.projects))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalShell role="client" title="Projects" subtitle="Track delivery progress across your engagements.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && projects.length === 0 && (
        <EmptyState title="No active projects" hint="Projects appear here once your engagement starts." />
      )}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(p => (
            <Link key={p.id} href={`/client/projects/${p.id}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:border-coral-300 transition-colors">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0B1426] font-display truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{p.code ?? p.id.slice(0, 8)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={p.status} />
                  <StatusBadge status={p.client_review_status} />
                </div>
              </div>
              <ProgressBar percent={p.progress_percent} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-slate-400">{p.progress_percent}% complete</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {p.target_end_date ? `target ${formatDate(p.target_end_date)}` : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
