'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { portalClient } from '@/lib/portal-client';

/**
 * TRACKING COMPOSER — posts an update on a project. Visibility options are
 * filtered by the poster's role:
 *   employee → manager only (progress reports upward)
 *   qa       → manager or a specific employee (review notes)
 *   manager  → any, including "client" (publishes to the client portal)
 */
export function TrackingComposer({
  projectId,
  role,
  employees,
  onPosted,
}: {
  projectId: string;
  role: 'employee' | 'qa' | 'manager';
  employees?: { id: string; label: string }[];
  onPosted?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'manager' | 'employee' | 'public'>('manager');
  const [employeeId, setEmployeeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const visibilities: { value: 'manager' | 'employee' | 'public'; label: string }[] =
    role === 'employee'
      ? [{ value: 'manager', label: 'To my manager' }]
      : role === 'qa'
        ? [
            { value: 'manager', label: 'To manager' },
            ...(employees && employees.length > 0 ? [{ value: 'employee' as const, label: 'To an employee' }] : []),
          ]
        : [
            { value: 'manager', label: 'Internal (team)' },
            { value: 'employee', label: 'To an employee' },
            { value: 'public', label: 'Publish to client' },
          ];

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      await portalClient.post(`/api/tracking/projects/${projectId}/updates`, {
        title: title.trim(),
        body: body.trim() || undefined,
        visibility,
        employeeId: visibility === 'employee' && role !== 'employee' ? employeeId || undefined : undefined,
      });
      setTitle('');
      setBody('');
      setEmployeeId('');
      onPosted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Send className="w-3.5 h-3.5 text-coral-500" />
        <span className="text-xs font-bold text-[#0B1426] font-display">Post a tracking update</span>
      </div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Update title (e.g. Payment API regression found)"
        className="w-full mb-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Details, blockers, test results, next steps…"
        rows={3}
        className="w-full mb-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none resize-y"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={visibility}
          onChange={e => setVisibility(e.target.value as typeof visibility)}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none"
        >
          {visibilities.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
        {visibility === 'employee' && role !== 'employee' && employees && employees.length > 0 && (
          <select
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none"
          >
            <option value="">Choose employee…</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        )}
        <div className="flex-1" />
        <Button variant="coral" size="sm" disabled={busy || !title.trim()} onClick={submit}>
          {busy ? 'Posting…' : 'Post update'}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
    </div>
  );
}
