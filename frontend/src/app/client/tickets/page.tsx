'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface TicketRow {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  project: { id: string; name: string } | { id: string; name: string }[] | null;
  assignee: { profile: { full_name: string } | { full_name: string }[] } | { profile: { full_name: string } | { full_name: string }[] }[] | null;
}

interface TicketMessage {
  id: string;
  message: string;
  created_at: string;
  author: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
}

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const [openTicket, setOpenTicket] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await portalClient.get<TicketRow[]>('/api/client/tickets'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openThread = async (ticket: TicketRow) => {
    setOpenTicket(ticket);
    setMessages([]);
    try {
      const data = await portalClient.get<{ ticket: TicketRow; messages: TicketMessage[] }>(
        `/api/client/tickets?includeMessages=${ticket.id}`
      );
      setMessages(data.messages);
    } catch {
      // thread loads empty
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/client/tickets', { title, description: description || undefined, priority });
      setShowNew(false);
      setTitle('');
      setDescription('');
      setPriority('medium');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!openTicket || !reply.trim()) return;
    setBusy(true);
    try {
      await portalClient.patch('/api/client/tickets', { id: openTicket.id, message: reply });
      setReply('');
      await openThread(openTicket);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell
      role="client"
      title="Support"
      subtitle="Raise issues and track resolutions with your delivery team."
      actions={
        <Button variant="coral" size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5" /> New Ticket
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tickets.length === 0 && (
        <EmptyState title="No support tickets" hint="Raise a ticket when you need help — your team responds here." />
      )}
      {!loading && !error && tickets.length > 0 && (
        <SectionCard title={`Your Tickets (${tickets.length})`}>
          <div className="space-y-3">
            {tickets.map(t => {
              const proj = first(t.project);
              const assignee = first(t.assignee);
              const assigneeName = assignee ? first(assignee.profile)?.full_name : null;
              return (
                <button
                  key={t.id}
                  onClick={() => openThread(t)}
                  className={`w-full text-left flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
                    openTicket?.id === t.id ? 'border-coral-400 bg-coral-50/30' : 'border-slate-100 hover:border-coral-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0B1426] font-display truncate">
                      <span className="font-mono text-slate-400 mr-2">{t.ticket_number}</span>
                      {t.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {proj?.name ?? 'General'}
                      {assigneeName ? ` · handled by ${assigneeName}` : ' · awaiting assignment'}
                      {` · opened ${formatTimeAgo(t.created_at)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono font-bold ${
                      t.priority === 'urgent' ? 'text-rose-600' : t.priority === 'high' ? 'text-amber-600' : 'text-slate-400'
                    }`}>{t.priority}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Thread panel */}
      <Modal isOpen={openTicket !== null} onClose={() => setOpenTicket(null)} title={openTicket ? `${openTicket.ticket_number} — ${openTicket.title}` : ''} maxWidth="xl">
        {openTicket && (
          <div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-4 whitespace-pre-line">
              {openTicket.description || 'No description provided.'}
            </div>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-mono text-center py-4">No replies yet — your delivery team will respond here.</p>
              ) : (
                messages.map(m => {
                  const author = first(m.author);
                  return (
                    <div key={m.id} className="p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-coral-600">{author?.full_name ?? 'Team'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(m.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line">{m.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {openTicket.status !== 'closed' && (
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
                />
                <Button variant="coral" size="sm" disabled={busy || !reply.trim()} onClick={sendReply}>
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New ticket dialog */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Raise a Ticket">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Subject *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Description</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy || !title.trim()} onClick={create}>Submit Ticket</Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
