'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const [adminEmail, setAdminEmail] = useState<string>('admin@coralswift.com');

  useEffect(() => {
    async function loadAdminUser() {
      // 1. Try Supabase Client directly
      const supabase = createClient();
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            setAdminEmail(user.email);
            return;
          }
        } catch {
          // ignore error and fallback
        }
      }

      // 2. Fetch from session endpoint
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            setAdminEmail(data.email);
          }
        }
      } catch {
        // keep fallback
      }
    }

    loadAdminUser();
  }, []);

  const initials = adminEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0B1426] font-display">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <div className="w-6 h-6 rounded-full bg-coral-500/15 text-coral-600 flex items-center justify-center font-mono font-bold text-[10px]">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-slate-900 font-semibold leading-none">Admin</span>
            <span className="text-[10px] text-slate-500 font-mono">{adminEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

