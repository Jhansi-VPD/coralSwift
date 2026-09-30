'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { StatusBadge, LoadingState, ErrorState, EmptyState, TableShell } from '@/components/portal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { portalClient } from '@/lib/portal-client';

interface EmployeeRow {
  id: string;
  employee_code: string;
  designation: string;
  employment_type: string;
  work_model: string;
  status: string;
  annual_leave_balance: number;
  profile: { email: string; full_name: string; phone: string | null } | { email: string; full_name: string; phone: string | null }[] | null;
  department: { id: string; name: string } | { id: string; name: string }[] | null;
  manager: { employee_code: string; profile: { full_name: string } | { full_name: string }[] } | { employee_code: string; profile: { full_name: string } | { full_name: string }[] }[] | null;
}

interface DepartmentRow { id: string; name: string }

function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  // onboard form
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', employeeCode: '', designation: '',
    departmentId: '', managerId: '', employmentType: 'Full-time', workModel: 'Hybrid',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [emp, depts] = await Promise.all([
        portalClient.get<EmployeeRow[]>('/api/hr/employees'),
        portalClient.get<DepartmentRow[]>('/api/hr/departments'),
      ]);
      setEmployees(emp);
      setDepartments(depts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onboard = async () => {
    setBusy(true);
    try {
      await portalClient.post('/api/hr/employees', {
        fullName: form.fullName,
        email: form.email || undefined,
        password: form.password || undefined,
        createAccount: Boolean(form.email && form.password),
        employeeCode: form.employeeCode,
        designation: form.designation || undefined,
        departmentId: form.departmentId || undefined,
        managerId: form.managerId || undefined,
        employmentType: form.employmentType,
        workModel: form.workModel,
      });
      setShowOnboard(false);
      setForm({ fullName: '', email: '', password: '', employeeCode: '', designation: '', departmentId: '', managerId: '', employmentType: 'Full-time', workModel: 'Hybrid' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setBusy(false);
    }
  };

  const filtered = employees.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const p = first(e.profile);
    return (
      (p?.full_name ?? '').toLowerCase().includes(q) ||
      (p?.email ?? '').toLowerCase().includes(q) ||
      e.employee_code.toLowerCase().includes(q)
    );
  });

  return (
    <PortalShell
      role="hr"
      title="Employees"
      subtitle="Directory, onboarding, and employee records."
      actions={
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs w-36 focus:outline-none shadow-xs"
          />
          <Button variant="coral" size="sm" onClick={() => setShowOnboard(true)}>
            <Plus className="w-3.5 h-3.5" /> Onboard
          </Button>
        </div>
      }
    >
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No employees" hint="Onboard your first team member." />
      )}
      {!loading && !error && filtered.length > 0 && (
        <TableShell head={['Employee', 'Department', 'Designation', 'Type', 'Status', 'Leave Bal.']}>
          {filtered.map(e => {
            const p = first(e.profile);
            const dept = first(e.department);
            return (
              <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="text-xs font-bold text-[#0B1426] font-display">{p?.full_name ?? '—'}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{e.employee_code} · {p?.email}</div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-600">{dept?.name ?? '—'}</td>
                <td className="px-5 py-3 text-xs text-slate-600">{e.designation || '—'}</td>
                <td className="px-5 py-3 text-[10px] font-mono text-slate-500">{e.employment_type} · {e.work_model}</td>
                <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-5 py-3 text-xs font-mono text-slate-600">{e.annual_leave_balance}d</td>
              </tr>
            );
          })}
        </TableShell>
      )}

      {/* Onboarding dialog */}
      <Modal isOpen={showOnboard} onClose={() => setShowOnboard(false)} title="Onboard Employee" maxWidth="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="inp" /></Field>
          <Field label="Employee code *"><input value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP-003" className="inp" /></Field>
          <Field label="Email (creates account)"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="inp" /></Field>
          <Field label="Temp password"><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="inp" /></Field>
          <Field label="Designation"><input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="inp" /></Field>
          <Field label="Department">
            <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="inp">
              <option value="">—</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Manager">
            <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} className="inp">
              <option value="">—</option>
              {employees.map(e => {
                const p = first(e.profile);
                return <option key={e.id} value={e.id}>{p?.full_name ?? e.employee_code}</option>;
              })}
            </select>
          </Field>
          <Field label="Employment type">
            <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} className="inp">
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option>
            </select>
          </Field>
          <Field label="Work model">
            <select value={form.workModel} onChange={e => setForm({ ...form, workModel: e.target.value })} className="inp">
              <option>Hybrid</option><option>Remote</option><option>Onsite</option>
            </select>
          </Field>
        </div>
        <p className="text-[10px] text-slate-500 font-mono mt-3">
          Providing email + password (min 8 chars) provisions a login account with the employee role.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowOnboard(false)}>Cancel</Button>
          <Button variant="coral" size="sm" disabled={busy || !form.fullName || !form.employeeCode} onClick={onboard}>Create Employee</Button>
        </div>
      </Modal>
    </PortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
