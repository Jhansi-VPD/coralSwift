'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Share2 } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';
import { formatDate } from '@/lib/utils';

interface ReviewRow {
  id: string;
  cycle_name: string;
  overall_rating: number | null;
  strengths: string | null;
  improvements: string | null;
  goals: string | null;
  status: string;
  employee_comment: string | null;
  employee: { employee_code: string; profile: { full_name: string } | { full_name: string }[] };
}

interface TeamMember { id: string; name: string }

function person(p: unknown): string {
  const row = Array.isArray(p) ? p[0] : p;
  return (row as { full_name?: string } | null)?.full_name ?? '—';
}

export default function ManagerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({ employeeId: '', cycleName: `H2 ${new Date().getFullYear()}`, overallRating: '3', strengths: '', improvements: '', goals: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        portalClient.get<ReviewRow[]>('/api/manager/reviews'),
        portalClient.get<TeamMember[]>('/api/manager/team'),
      ]);
      setReviews(r);
      setTeam(t);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/manager/reviews', {
        employeeId: form.employeeId,
        cycleName: form.cycleName,
        overallRating: Number(form.overallRating),
        strengths: form.strengths || undefined,
        improvements: form.improvements || undefined,
        goals: form.goals || undefined,
      });
      setShowNew(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const share = async (id: string) => {
    if (!confirm('Share this review with the employee?')) return;
    setBusy(true);
    try {
      await portalClient.patch('/api/manager/reviews', { id, status: 'shared' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Share failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell
      role="manager"
      title="Performance Reviews"
      subtitle="Structured review cycles for your direct reports."
      actions={
        <Button variant="coral" size="sm" onClick={() => setShowNew(true)} disabled={team.length === 0}>
          <Plus className="w-3.5 h-3.5" /> New Review
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && reviews.length === 0 && (
        <EmptyState
          title="No reviews yet"
          hint={team.length === 0 ? 'You need direct reports before creating reviews.' : 'Create the first review for a team member.'}
        />
      )}
      {!loading && !error && reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-bold text-[#0B1426] font-display">{person(r.employee.profile)}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{r.cycle_name} · {r.employee.employee_code}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.overall_rating != null && (
                    <span className="text-sm font-bold font-display text-coral-600">{r.overall_rating}/5</span>
                  )}
                  <StatusBadge status={r.status === 'shared' ? 'submitted' : r.status === 'acknowledged' ? 'approved' : 'draft'} />
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 mb-3">
                {r.strengths && <p><span className="font-mono font-bold text-emerald-600">Strengths:</span> {r.strengths}</p>}
                {r.improvements && <p><span className="font-mono font-bold text-amber-600">Improve:</span> {r.improvements}</p>}
                {r.goals && <p><span className="font-mono font-bold text-cyan-600">Goals:</span> {r.goals}</p>}
                {r.employee_comment && <p><span className="font-mono font-bold text-slate-500">Employee:</span> {r.employee_comment}</p>}
              </div>

              {r.status === 'draft' && (
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => share(r.id)}>
                  <Share2 className="w-3.5 h-3.5" /> Share with employee
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Performance Review" maxWidth="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Employee *</label>
            <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none">
              <option value="">Select…</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Cycle *</label>
            <input value={form.cycleName} onChange={e => setForm({ ...form, cycleName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Overall rating (1–5)</label>
            <select value={form.overallRating} onChange={e => setForm({ ...form, overallRating: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Strengths</label>
            <textarea rows={2} value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Improvement areas</label>
            <textarea rows={2} value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Goals</label>
            <textarea rows={2} value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button variant="coral" size="sm" disabled={busy || !form.employeeId} onClick={create}>Create Draft</Button>
        </div>
      </Modal>
    </PortalShell>
  );
}
