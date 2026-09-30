'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Briefcase, 
  FileCheck, 
  MessageSquare, 
  Megaphone,
  Inbox,
  Sliders, 
  ShieldAlert, 
  LogOut, 
  Globe, 
  Cpu
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase/client';
import { clearToken } from '@/lib/api-base';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Services', href: '/admin/services', icon: Layers },
    { name: 'Careers & Jobs', href: '/admin/careers', icon: Briefcase },
    { name: 'Case Studies', href: '/admin/case-studies', icon: FileCheck },
    { name: 'Enquiries', href: '/admin/enquiries', icon: MessageSquare },
    { name: 'Project Tracking', href: '/admin/tracking', icon: Inbox },
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Site Settings', href: '/admin/settings', icon: Sliders },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    clearToken();
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 md:sticky md:top-0 h-auto md:h-screen md:overflow-y-auto flex flex-col justify-between p-4 shrink-0 shadow-sm z-30">
      <div>
        {/* Brand */}
        <div className="px-2 py-4 mb-6 border-b border-slate-100">
          <Logo size="sm" />
          <div className="text-[10px] font-mono uppercase text-coral-600 font-bold tracking-wider mt-1.5 ml-1">
            Administration Suite
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-coral-50 text-coral-700 font-semibold border border-coral-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-coral-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-4 border-t border-slate-100 space-y-1.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <Globe className="w-4 h-4 text-coral-600" />
          <span>View Live Website</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
