import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'coral' | 'rose' | 'indigo' | 'emerald' | 'amber' | 'slate' | 'cyan' | 'blue';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'coral', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    coral: 'bg-coral-50 text-coral-700 border-coral-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3.5 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono tracking-tight select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
