'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { portalClient, formatMoney } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface ClientRow {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  account_owner: { full_name: string } | { full_name: string }[] | null;
  contacts: { id: string; name: string; email: string; is_primary: boolean }[];
  contracts: { id: string; title: string; engagement_type: string; status: string; contract_value: number | null; currency: string; start_date: string | null }[];
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function SalesClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalClient
      .get<ClientRow[]>('/api/sales/clients')
      .then(setClients)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalShell role="sales" title="Clients" subtitle="Client organizations, primary contacts, and active contracts.">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && clients.length === 0 && (
        <EmptyState title="No client organizations" hint="Convert a won lead or create a client directly." />
      )}
      {!loading && !error && clients.length > 0 && (
        <TableShell head={['Organization', 'Industry', 'Primary Contact', 'Contracts', 'Status']}>
          {clients.map(c => {
            const owner = first(c.account_owner);
            const primary = c.contacts.find(x => x.is_primary) ?? c.contacts[0];
            const active = c.contracts.filter(k => k.status === 'active');
            return (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="text-xs font-bold text-[#0B1426] font-display">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Owner: {owner?.full_name ?? '—'}</div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">{c.industry ?? '—'}</td>
                <td className="px-5 py-3">
                  <div className="text-xs text-slate-700">{primary?.name ?? '—'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{primary?.email ?? ''}</div>
                </td>
                <td className="px-5 py-3">
                  {active.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-mono">none</span>
                  ) : (
                    <div className="space-y-0.5">
                      {active.slice(0, 2).map(k => (
                        <div key={k.id} className="text-[10px] font-mono text-slate-600">
                          {k.engagement_type} · {k.contract_value ? formatMoney(k.contract_value, k.currency) : '—'}
                        </div>
                      ))}
                      {active.length > 2 && <div className="text-[10px] text-slate-400 font-mono">+{active.length - 2} more</div>}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </PortalShell>
  );
}
