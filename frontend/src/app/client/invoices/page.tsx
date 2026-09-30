'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, StatCard, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { ExportButton } from '@/components/portal/ExportButton';
import { portalClient, formatMoney } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    portalClient
      .get<{ invoices: InvoiceRow[]; summary: { outstandingInvoices: number } }>('/api/client/overview')
      .then(d => setInvoices(d.invoices))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const outstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  return (
    <PortalShell
      role="client"
      title="Invoices & Payments"
      subtitle="Your billing history and payment status."
      actions={<ExportButton resource="invoices" label="CSV" />}
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <StatCard label="Outstanding" value={formatMoney(outstanding)} accent="amber" icon={<InvoiceIcon />} />
            <StatCard label="Paid" value={formatMoney(paid)} accent="emerald" icon={<InvoiceIcon />} />
            <StatCard label="Invoices" value={invoices.length} accent="cyan" icon={<InvoiceIcon />} />
          </div>

          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" hint="Invoices appear after project acceptance." />
          ) : (
            <TableShell head={['Invoice', 'Issued', 'Due', 'Amount', 'Status', 'Paid On']}>
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-xs font-bold font-mono text-[#0B1426]">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">{formatDate(inv.issue_date)}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-600">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                  <td className="px-5 py-3 text-xs font-bold font-mono text-slate-800">{formatMoney(inv.amount, inv.currency)}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-500">{inv.paid_at ? formatDate(inv.paid_at) : '—'}</td>
                </tr>
              ))}
            </TableShell>
          )}
        </>
      )}
    </PortalShell>
  );
}

function InvoiceIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>; }
