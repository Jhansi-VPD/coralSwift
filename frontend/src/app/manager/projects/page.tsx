'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, TableShell, ProgressBar } from '@/components/portal';
import { portalClient, type ProjectRecord } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

export default function ManagerProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setProjects(await portalClient.get<ProjectRecord[]>('/api/manager/projects'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PortalShell role="manager" title="Projects" subtitle="Plan, execute, and submit projects for client review.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && projects.length === 0 && (
        <EmptyState title="No projects yet" hint="Projects appear here once sales accepts an enquiry and delivery begins." />
      )}
      {!loading && !error && projects.length > 0 && (
        <TableShell head={['Project', 'Client', 'Status', 'Health', 'Review', 'Progress', 'Target End', '']}>
          {projects.map(p => (
            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="text-xs font-bold text-[#0B1426] font-display">{p.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{p.code ?? p.id.slice(0, 8)}</div>
              </td>
              <td className="px-5 py-3 text-xs text-slate-600">{p.organization?.name ?? '—'}</td>
              <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
              <td className="px-5 py-3"><StatusBadge status={p.health} /></td>
              <td className="px-5 py-3"><StatusBadge status={p.client_review_status} /></td>
              <td className="px-5 py-3 w-36">
                <ProgressBar percent={p.progress_percent} />
                <span className="text-[10px] font-mono text-slate-400">{p.progress_percent}%</span>
              </td>
              <td className="px-5 py-3 text-xs text-slate-500 font-mono">{p.target_end_date ? formatDate(p.target_end_date) : '—'}</td>
              <td className="px-5 py-3">
                <Link href={`/manager/projects/${p.id}`} className="text-xs font-semibold text-coral-600 hover:underline">Open →</Link>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </PortalShell>
  );
}
