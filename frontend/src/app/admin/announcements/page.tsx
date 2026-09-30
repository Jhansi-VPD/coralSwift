'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient, type AnnouncementRecord } from '@/lib/portal-client';
import { formatTimeAgo } from '@/lib/utils';

const AUDIENCES = ['all', 'staff', 'hr', 'sales', 'manager', 'employee', 'qa', 'client'] as const;
const PRIORITIES = ['low', 'normal', 'high'] as const;

/** ADMIN ANNOUNCEMENTS — broadcast posts with per-role targeting + in-app fan-out. */
export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', priority: 'normal', expiresAt: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await portalClient.get<AnnouncementRecord[]>('/api/announcements'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const publish = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/announcements', {
        title: form.title,
        body: form.body,
        audience: form.audience,
        priority: form.priority,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setShowNew(false);
      setForm({ title: '', body: '', audience: 'all', priority: 'normal', expiresAt: '' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await portalClient.delete(`/api/announcements/${id}`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Announcements"
        subtitle="Broadcast posts to every portal — target all staff, one role, or everyone."
        actions={
          <Button variant="coral" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </Button>
        }
      />
      <div className="p-6 sm:p-8 max-w-4xl">
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && items.length === 0 && (
          <EmptyState title="No announcements yet" hint="Publish your first broadcast — it appears at the top of the targeted portals." />
        )}

        {!loading && !error && items.length > 0 && (
          <SectionCard title={`Published (${items.length})`}>
            <div className="space-y-3">
              {items.map(a => (
                <div key={a.id} className={`p-4 rounded-2xl border ${a.priority === 'high' ? 'bg-coral-50/60 border-coral-200' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Megaphone className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                      <span className="text-xs font-bold text-[#0B1426] font-display truncate">{a.title}</span>
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{a.audience}</span>
                      {a.priority === 'high' && <span className="text-[9px] font-mono uppercase font-bold text-coral-600">high</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(a.created_at)}</span>
                      <button onClick={() => remove(a.id)} className="text-slate-300 hover:text-red-500 transition-colors" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line">{a.body}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Announcement">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Message *</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none resize-y" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Audience</label>
              <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none">
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Expires (optional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy || !form.title.trim() || !form.body.trim()} onClick={publish}>
              {busy ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
