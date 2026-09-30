'use client';

import React, { useEffect, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, formatMoney } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface LeadRow {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  service_interest: string | null;
  source: string | null;
  estimated_value: number | null;
  stage: string;
  converted_client_org_id: string | null;
  created_at: string;
  owner: { full_name: string } | { full_name: string }[] | null;
}

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactName: '', contactEmail: '', serviceInterest: '', estimatedValue: '' });

  const load = async () => {
    setLoading(true);
    try {
      const q = stageFilter === 'all' ? '' : `?stage=${stageFilter}`;
      setLeads(await portalClient.get<LeadRow[]>(`/api/sales/leads${q}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [stageFilter]);

  const moveStage = async (lead: LeadRow, stage: string) => {
    setBusy(lead.id);
    try {
      const payload: Record<string, unknown> = { stage };
      if (stage === 'lost') {
        const reason = prompt('Reason for losing this lead:');
        if (!reason) { setBusy(null); return; }
        payload.lossReason = reason;
      }
      await portalClient.patch('/api/sales/leads', { id: lead.id, ...payload });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Stage update failed');
    } finally {
      setBusy(null);
    }
  };

  const convert = async (lead: LeadRow) => {
    if (!confirm(`Convert "${lead.company_name}" into a client organization?`)) return;
    setBusy(lead.id);
    try {
      await portalClient.put('/api/sales/leads', { leadId: lead.id });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setBusy('new');
    try {
      await portalClient.post('/api/sales/leads', {
        companyName: form.companyName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        serviceInterest: form.serviceInterest || undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      });
      setShowNew(false);
      setForm({ companyName: '', contactName: '', contactEmail: '', serviceInterest: '', estimatedValue: '' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <PortalShell
      role="sales"
      title="Leads Pipeline"
      subtitle="Prospects from website enquiries and manual entry. Won leads convert into client organizations."
      actions={
        <div className="flex items-center gap-2">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none shadow-xs">
            <option value="all">All stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <Button variant="coral" size="sm" onClick={() => setShowNew(true)}>+ New Lead</Button>
        </div>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="No leads in this stage" />}
      {!loading && !error && leads.length > 0 && (
        <TableShell head={['Company', 'Contact', 'Service', 'Value', 'Stage', 'Move', '']}>
          {leads.map(l => (
            <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="text-xs font-bold text-[#0B1426] font-display">{l.company_name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{l.source ?? 'manual'}</div>
              </td>
              <td className="px-5 py-3">
                <div className="text-xs text-slate-700">{l.contact_name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{l.contact_email}</div>
              </td>
              <td className="px-5 py-3 text-xs text-coral-600 font-mono">{l.service_interest ?? '—'}</td>
              <td className="px-5 py-3 text-xs font-mono text-slate-600">{l.estimated_value ? formatMoney(l.estimated_value) : '—'}</td>
              <td className="px-5 py-3"><StatusBadge status={l.stage} /></td>
              <td className="px-5 py-3">
                <select
                  value=""
                  disabled={busy === l.id}
                  onChange={e => e.target.value && moveStage(l, e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold focus:outline-none"
                >
                  <option value="">Move to…</option>
                  {STAGES.filter(s => s !== l.stage).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-3">
                {l.stage === 'won' && !l.converted_client_org_id ? (
                  <Button variant="secondary" size="sm" disabled={busy === l.id} onClick={() => convert(l)}>
                    Convert → Client
                  </Button>
                ) : l.converted_client_org_id ? (
                  <span className="text-[10px] font-mono text-emerald-600">converted ✓</span>
                ) : null}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Lead">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Company *</label>
            <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Contact name *</label>
            <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Contact email *</label>
            <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Service interest</label>
            <input value={form.serviceInterest} onChange={e => setForm({ ...form, serviceInterest: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Estimated value (USD)</label>
            <input type="number" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button variant="coral" size="sm" disabled={busy === 'new' || !form.companyName || !form.contactName || !form.contactEmail} onClick={create}>Create Lead</Button>
        </div>
      </Modal>
    </PortalShell>
  );
}
