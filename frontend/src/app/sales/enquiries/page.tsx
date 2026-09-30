'use client';

import React, { useEffect, useState } from 'react';
import { CalendarPlus, CheckCircle2, XCircle, MessageSquarePlus, Search } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type EnquiryRecord, type Paged } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

/**
 * SALES ENQUIRY WORKSPACE — the working pipeline for the assigned enquiries.
 * Actions: accept / reject (with reason) / follow-up / schedule meeting / notes.
 */

type DialogState =
  | { mode: 'none' }
  | { mode: 'reject'; enquiry: EnquiryRecord }
  | { mode: 'followup'; enquiry: EnquiryRecord }
  | { mode: 'meeting'; enquiry: EnquiryRecord }
  | { mode: 'note'; enquiry: EnquiryRecord };

export default function SalesEnquiriesPage() {
  const [items, setItems] = useState<EnquiryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ mode: 'none' });
  const [busy, setBusy] = useState(false);

  interface EnquiryItemRow extends EnquiryRecord {}

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pageSize: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());
      const data = await portalClient.get<Paged<EnquiryRecord>>(`/api/sales/enquiries?${params}`);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const act = async (payload: Record<string, unknown>, enquiryId: string) => {
    setBusy(true);
    try {
      await portalClient.patch(`/api/sales/enquiries/${enquiryId}`, payload);
      setDialog({ mode: 'none' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell
      role="sales"
      title="Enquiry Pipeline"
      subtitle="Work your assigned enquiries: review, follow up, meet, accept or reject."
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search…"
              className="pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs w-40 focus:outline-none shadow-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none shadow-xs"
          >
            <option value="all">All</option>
            <option value="assigned_to_sales">Assigned to me</option>
            <option value="sales_review">In my review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="No enquiries in this view" hint="Enquiries assigned to you by admin will appear here." />
      )}

      {!loading && !error && items.length > 0 && (
        <TableShell head={['Prospect', 'Company', 'Service', 'Status', 'Follow-up', 'Received', 'Actions']}>
          {items.map(enq => (
            <tr key={enq.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="text-xs font-bold text-[#0B1426] font-display">{enq.full_name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{enq.email}</div>
              </td>
              <td className="px-5 py-3 text-xs text-slate-600">{enq.company}</td>
              <td className="px-5 py-3 text-xs text-coral-600 font-mono">{enq.service_interest ?? '—'}</td>
              <td className="px-5 py-3"><StatusBadge status={enq.status} /></td>
              <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                {enq.follow_up_at ? formatDate(enq.follow_up_at) : '—'}
              </td>
              <td className="px-5 py-3 text-[10px] text-slate-400 font-mono">{formatTimeAgo(enq.created_at)}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                  {enq.status !== 'accepted' && enq.status !== 'rejected' && (
                    <>
                      <button
                        onClick={() => act({ status: 'accepted' }, enq.id)}
                        disabled={busy}
                        title="Accept enquiry"
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDialog({ mode: 'reject', enquiry: enq })}
                        disabled={busy}
                        title="Reject with reason"
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDialog({ mode: 'followup', enquiry: enq })}
                        title="Schedule follow-up"
                        className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDialog({ mode: 'meeting', enquiry: enq })}
                        title="Schedule meeting"
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDialog({ mode: 'note', enquiry: enq })}
                    title="View / add notes"
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {/* ---- Dialogs ---- */}
      <RejectDialog state={dialog} busy={busy} onClose={() => setDialog({ mode: 'none' })} onConfirm={act} />
      <DateTimeDialog
        state={dialog}
        kind={dialog.mode === 'followup' ? 'followUpAt' : dialog.mode === 'meeting' ? 'meetingAt' : null}
        busy={busy}
        onClose={() => setDialog({ mode: 'none' })}
        onConfirm={act}
      />
      <NoteDialog state={dialog} busy={busy} onClose={() => setDialog({ mode: 'none' })} onConfirm={act} />
    </PortalShell>
  );
}

// ---------- Reject dialog ----------
function RejectDialog({ state, busy, onClose, onConfirm }: {
  state: DialogState;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: Record<string, unknown>, id: string) => void;
}) {
  const [reason, setReason] = useState('');
  const open = state.mode === 'reject';
  useEffect(() => { if (open) setReason(''); }, [open]);

  if (!open) return null;
  return (
    <Modal isOpen onClose={onClose} title="Reject Enquiry">
      <div>
        <p className="text-xs text-slate-600 mb-4">
          Rejecting <strong>{state.enquiry.full_name}</strong> ({state.enquiry.company}). A written reason is required and recorded in the enquiry history.
        </p>
        <textarea
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Outside our service scope — recommended alternative: …"
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-coral-500/20"
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          disabled={busy || !reason.trim()}
          onClick={() => onConfirm({ status: 'rejected', decisionNotes: reason }, state.enquiry.id)}
        >
          Reject Enquiry
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Follow-up / meeting datetime dialog ----------
function DateTimeDialog({ state, kind, busy, onClose, onConfirm }: {
  state: DialogState;
  kind: 'followUpAt' | 'meetingAt' | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: Record<string, unknown>, id: string) => void;
}) {
  const [when, setWhen] = useState('');
  const [link, setLink] = useState('');
  const open = state.mode === 'followup' || state.mode === 'meeting';
  useEffect(() => { if (open) { setWhen(''); setLink(''); } }, [open]);

  if (!open || !kind) return null;
  const isMeeting = state.mode === 'meeting';
  const enquiry = state.mode === 'followup' || state.mode === 'meeting' ? state.enquiry : null;
  if (!enquiry) return null;

  return (
    <Modal isOpen onClose={onClose} title={isMeeting ? 'Schedule Meeting' : 'Schedule Follow-up'}>
      <div>
        <p className="text-xs text-slate-600 mb-4">
          {isMeeting ? 'Meeting' : 'Follow-up'} for <strong>{enquiry.full_name}</strong> ({enquiry.company})
        </p>
        <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Date & time</label>
        <input
          type="datetime-local"
          value={when}
          onChange={e => setWhen(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-3 focus:outline-none"
        />
        {isMeeting && (
          <>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Meeting link (optional)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://meet…"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
            />
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="coral"
          size="sm"
          disabled={busy || !when}
          onClick={() => {
            const payload: Record<string, unknown> = { [kind]: new Date(when).toISOString() };
            if (isMeeting && link) payload.meetingLink = link;
            onConfirm(payload, enquiry.id);
          }}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}

// ---------- Notes dialog ----------
function NoteDialog({ state, busy, onClose, onConfirm }: {
  state: DialogState;
  busy: boolean;
  onClose: () => void;
  onConfirm: (payload: Record<string, unknown>, id: string) => void;
}) {
  const [note, setNote] = useState('');
  const open = state.mode === 'note';
  const enquiry = open ? (state as { mode: 'note'; enquiry: import('@/lib/portal-client').EnquiryRecord }).enquiry : null;
  const adminNotesRef = enquiry?.admin_notes ?? '';
  useEffect(() => { if (open) setNote(adminNotesRef); }, [open, adminNotesRef]);

  if (!open || !enquiry) return null;
  return (
    <Modal isOpen onClose={onClose} title="Working Notes">
      <div>
        <p className="text-xs text-slate-600 mb-4">
          <strong>{enquiry.full_name}</strong> ({enquiry.company}) — {enquiry.message.slice(0, 160)}…
        </p>
        <textarea
          rows={5}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Requirement notes, clarification requests, pricing discussed…"
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="coral"
          size="sm"
          disabled={busy}
          onClick={() => onConfirm({ notes: note }, enquiry.id)}
        >
          Save Notes
        </Button>
      </div>
    </Modal>
  );
}
