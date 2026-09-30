'use client';

import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Shared portal primitives — built strictly on the existing CoralSwift
 * design language: white rounded-3xl cards, slate borders, coral accents,
 * font-mono uppercase labels, font-display headings.
 */

// ---- Stat card (matches admin KPI card pattern) ----
export function StatCard({ label, value, icon, accent = 'coral', sub }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'coral' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'cyan';
  sub?: string;
}) {
  const accents: Record<string, string> = {
    coral: 'bg-coral-50 border-coral-200 text-coral-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    rose: 'bg-rose-50 border-rose-200 text-rose-600',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-600',
  };
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between text-slate-500 mb-3">
        <span className="text-xs font-mono uppercase font-bold tracking-wider">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center', accents[accent])}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-[#0B1426] font-display">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

// ---- Status badge (maps workflow states to the existing Badge variants) ----
const STATUS_MAP: Record<string, { variant: 'emerald' | 'amber' | 'rose' | 'slate' | 'coral' | 'indigo' | 'cyan' | 'blue'; label: string }> = {
  // enquiries
  new: { variant: 'emerald', label: 'New' },
  under_review: { variant: 'amber', label: 'Under Review' },
  assigned_to_sales: { variant: 'blue', label: 'Assigned to Sales' },
  sales_review: { variant: 'amber', label: 'Sales Review' },
  accepted: { variant: 'emerald', label: 'Accepted' },
  rejected: { variant: 'rose', label: 'Rejected' },
  in_review: { variant: 'amber', label: 'In Review' },
  contacted: { variant: 'cyan', label: 'Contacted' },
  qualified: { variant: 'indigo', label: 'Qualified' },
  closed: { variant: 'slate', label: 'Closed' },
  // projects
  planning: { variant: 'slate', label: 'Planning' },
  active: { variant: 'emerald', label: 'Active' },
  on_hold: { variant: 'amber', label: 'On Hold' },
  completed: { variant: 'indigo', label: 'Completed' },
  cancelled: { variant: 'rose', label: 'Cancelled' },
  on_track: { variant: 'emerald', label: 'On Track' },
  at_risk: { variant: 'amber', label: 'At Risk' },
  critical: { variant: 'rose', label: 'Critical' },
  not_submitted: { variant: 'slate', label: 'Not Submitted' },
  submitted: { variant: 'amber', label: 'Awaiting Review' },
  changes_requested: { variant: 'rose', label: 'Changes Requested' },
  approved: { variant: 'emerald', label: 'Approved' },
  // tasks
  todo: { variant: 'slate', label: 'To Do' },
  in_progress: { variant: 'cyan', label: 'In Progress' },
  done: { variant: 'emerald', label: 'Done' },
  blocked: { variant: 'rose', label: 'Blocked' },
  // generic
  pending: { variant: 'amber', label: 'Pending' },
  approved_leave: { variant: 'emerald', label: 'Approved' },
  draft: { variant: 'slate', label: 'Draft' },
  sent: { variant: 'cyan', label: 'Sent' },
  paid: { variant: 'emerald', label: 'Paid' },
  overdue: { variant: 'rose', label: 'Overdue' },
  open: { variant: 'amber', label: 'Open' },
  resolved: { variant: 'emerald', label: 'Resolved' },
  present: { variant: 'emerald', label: 'Present' },
  remote: { variant: 'cyan', label: 'Remote' },
  absent: { variant: 'rose', label: 'Absent' },
  leave: { variant: 'indigo', label: 'On Leave' },
  holiday: { variant: 'slate', label: 'Holiday' },
};

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const conf = STATUS_MAP[status] ?? { variant: 'slate' as const, label: status.replace(/_/g, ' ') };
  return <Badge variant={conf.variant} size={size}>{conf.label}</Badge>;
}

// ---- Section card ----
export function SectionCard({ title, action, children, className }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-3xl border border-slate-200 shadow-sm', className)}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-[#0B1426] font-display">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ---- Empty state ----
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
      <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
      <div className="text-sm font-bold text-[#0B1426] font-display mb-1">{title}</div>
      {hint && <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">{hint}</p>}
      {action}
    </div>
  );
}

// ---- Error state ----
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-10 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <div className="text-sm font-bold text-[#0B1426] font-display mb-1">Something went wrong</div>
      <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// ---- Loading state ----
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-6 h-6 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <div className="text-xs text-slate-500 font-mono">{label}</div>
    </div>
  );
}

// ---- Progress bar (client tracker + manager projects) ----
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn('h-2.5 w-full bg-slate-100 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-gradient-to-r from-coral-500 to-rose-600 rounded-full transition-all"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

// ---- Data table shell (responsive: cards collapse on mobile) ----
export function TableShell({ head, children, className }: {
  head: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {head.map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
