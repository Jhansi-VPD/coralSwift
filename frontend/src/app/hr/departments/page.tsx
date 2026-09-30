'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { SectionCard, LoadingState, ErrorState, EmptyState } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';

interface DeptRow {
  id: string;
  name: string;
  head: { full_name: string; email: string } | null;
  employee_count: number;
}

export default function HRDepartmentsPage() {
  const [rows, setRows] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setRows(await portalClient.get<DeptRow[]>('/api/hr/departments'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/hr/departments', { name });
      setName('');
      setShowCreate(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (dept: DeptRow) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    setBusy(true);
    try {
      await portalClient.delete(`/api/hr/departments?id=${dept.id}`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell
      role="hr"
      title="Departments"
      subtitle="Organizational units and headcount."
      actions={
        <Button variant="coral" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New Department
        </Button>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState title="No departments" hint="Create your first department to organize employees." />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map(d => (
            <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-bold text-[#0B1426] font-display">{d.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Head: {d.head?.full_name ?? 'unassigned'}
                  </div>
                </div>
                <button
                  onClick={() => remove(d)}
                  disabled={busy}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold font-display text-[#0B1426]">{d.employee_count}</div>
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400">employees</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Department">
        <div>
          <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">Department name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4 focus:outline-none" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="coral" size="sm" disabled={busy || !name.trim()} onClick={create}>Create</Button>
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
