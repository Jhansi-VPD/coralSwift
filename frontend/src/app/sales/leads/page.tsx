'use client';

import React, { useEffect, useState } from 'react';
import { GripVertical, Plus, Building2 } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ExportButton } from '@/components/portal/ExportButton';
import { portalClient, formatMoney } from '@/lib/portal-client';

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
  loss_reason: string | null;
  converted_client_org_id: string | null;
  created_at: string;
}

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const;

const STAGE_META: Record<string, { label: string; dot: string; header: string }> = {
  new: { label: 'New', dot: 'bg-emerald-400', header: 'text-emerald-700' },
  contacted: { label: 'Contacted', dot: 'bg-cyan-400', header: 'text-cyan-700' },
  qualified: { label: 'Qualified', dot: 'bg-indigo-400', header: 'text-indigo-700' },
  proposal_sent: { label: 'Proposal Sent', dot: 'bg-amber-400', header: 'text-amber-700' },
  won: { label: 'Won', dot: 'bg-emerald-500', header: 'text-emerald-700' },
  lost: { label: 'Lost', dot: 'bg-rose-400', header: 'text-rose-700' },
};

/** SALES PIPELINE — drag leads between stages; moves hit PATCH /api/sales/leads. */
export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactName: '', contactEmail: '', serviceInterest: '', estimatedValue: '' });

  const load = async () => {
    setLoading(true);
    try {
      setLeads(await portalClient.get<LeadRow[]>('/api/sales/leads'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moveStage = async (lead: LeadRow, stage: string) => {
    if (stage === lead.stage) return;
    let lossReason: string | null = null;
    if (stage === 'lost') {
      lossReason = prompt(`Why is "${lead.company_name}" marked lost?`);
      if (!lossReason) return; // cancelled — keep the card where it was
    }
    setBusy(lead.id);
    // Optimistic move; revert on failure.
    const prev = leads;
    setLeads(cur => cur.map(l => (l.id === lead.id ? { ...l, stage } : l)));
    try {
      await portalClient.patch('/api/sales/leads', { id: lead.id, stage, lossReason });
      await load();
    } catch (err) {
      setLeads(prev);
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
      title="Pipeline"
      subtitle="Drag leads across stages. Won leads convert into client organizations."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton resource="leads" label="CSV" />
          <Button variant="coral" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3.5 h-3.5" /> New Lead
          </Button>
        </div>
      }
    >
      {loading && <LoadingState label="Loading pipeline…" />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && leads.length === 0 && (
        <EmptyState title="Pipeline is empty" hint="Add your first lead or convert an accepted enquiry." />
      )}

      {!loading && !error && (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {STAGES.map(stage => {
            const cards = leads.filter(l => l.stage === stage);
            const value = cards.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
            const meta = STAGE_META[stage];
            return (
              <div
                key={stage}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(cur => (cur === stage ? null : cur))}
                onDrop={e => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const id = e.dataTransfer.getData('text/plain') || dragId;
                  const lead = leads.find(l => l.id === id);
                  if (lead) moveStage(lead, stage);
                }}
                className={`w-64 shrink-0 rounded-3xl border p-3 transition-colors ${
                  dragOverStage === stage ? 'bg-coral-50/70 border-coral-300' : 'bg-white/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${meta.header}`}>{meta.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{cards.length}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 px-1 pb-2">{formatMoney(value)}</div>

                <div className="space-y-2.5 min-h-[80px]">
                  {cards.map(l => (
                    <div
                      key={l.id}
                      draggable={busy !== l.id}
                      onDragStart={e => { e.dataTransfer.setData('text/plain', l.id); setDragId(l.id); }}
                      onDragEnd={() => { setDragId(null); setDragOverStage(null); }}
                      className={`bg-white rounded-2xl border p-3 shadow-xs cursor-grab active:cursor-grabbing transition-all ${
                        dragId === l.id ? 'opacity-40 border-coral-300' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      } ${busy === l.id ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-[#0B1426] font-display leading-tight">{l.company_name}</div>
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">{l.contact_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{l.contact_email}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono font-semibold text-coral-600">
                          {l.estimated_value ? formatMoney(l.estimated_value) : '—'}
                        </span>
                        {stage === 'won' && !l.converted_client_org_id ? (
                          <button
                            onClick={() => convert(l)}
                            disabled={busy === l.id}
                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            Convert →
                          </button>
                        ) : l.converted_client_org_id ? (
                          <span className="text-[9px] font-mono text-emerald-600">converted ✓</span>
                        ) : null}
                      </div>
                      {l.loss_reason && <div className="text-[9px] text-rose-500 font-mono mt-1.5 truncate">✗ {l.loss_reason}</div>}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-[10px] font-mono text-slate-300">
                      drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
