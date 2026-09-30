'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, CalendarClock, CalendarDays, FolderKanban,
  ListTodo, ClipboardList, FileText, Bell, LogOut, Globe, Mail, Handshake,
  Building2, TrendingUp, PieChart, type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { portalClient, type SessionUser, type NotificationRecord } from '@/lib/portal-client';
import { clearToken } from '@/lib/api-base';

/**
 * PORTAL SHELL — the shared application shell for all role dashboards.
 * Deliberately mirrors AdminSidebar/AdminHeader's visual language:
 * same Logo block, same nav item styling, same header pattern,
 * same coral/navy palette, same typography.
 *
 * Role gate: verifies the session via /api/auth/me on mount. A user whose
 * role is not in `allowedRoles` (or who is unauthenticated) is redirected —
 * URL entry into another role's area is blocked (backend enforces again).
 */

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  hr: '/hr',
  sales: '/sales',
  manager: '/manager',
  employee: '/employee',
  client: '/client',
};

/** Each portal has its own branded login page; guards bounce there per role. */
export const ROLE_LOGIN: Record<string, string> = {
  admin: '/admin/login',
  hr: '/hr/login',
  sales: '/sales/login',
  manager: '/manager/login',
  employee: '/employee/login',
  client: '/client/login',
};

const NAVS: Record<string, PortalNavItem[]> = {
  hr: [
    { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Attendance', href: '/hr/attendance', icon: CalendarClock },
    { label: 'Leave', href: '/hr/leave', icon: CalendarDays },
  ],
  sales: [
    { label: 'Dashboard', href: '/sales', icon: LayoutDashboard },
    { label: 'Enquiries', href: '/sales/enquiries', icon: Mail },
    { label: 'Leads', href: '/sales/leads', icon: TrendingUp },
    { label: 'Clients', href: '/sales/clients', icon: Building2 },
    { label: 'Follow-ups', href: '/sales/follow-ups', icon: Handshake },
  ],
  manager: [
    { label: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { label: 'Projects', href: '/manager/projects', icon: FolderKanban },
    { label: 'Approvals', href: '/manager/approvals', icon: ClipboardList },
    { label: 'Team', href: '/manager/team', icon: Users },
    { label: 'Reviews', href: '/manager/reviews', icon: PieChart },
  ],
  employee: [
    { label: 'Dashboard', href: '/employee', icon: LayoutDashboard },
    { label: 'My Tasks', href: '/employee/tasks', icon: ListTodo },
    { label: 'Timesheets', href: '/employee/timesheets', icon: CalendarClock },
    { label: 'Leave', href: '/employee/leave', icon: CalendarDays },
    { label: 'Documents', href: '/employee/documents', icon: FileText },
  ],
  client: [
    { label: 'Dashboard', href: '/client', icon: LayoutDashboard },
    { label: 'Projects', href: '/client/projects', icon: FolderKanban },
    { label: 'Invoices', href: '/client/invoices', icon: FileText },
    { label: 'Support', href: '/client/tickets', icon: Mail },
    { label: 'Documents', href: '/client/documents', icon: FileText },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  hr: 'People Operations',
  sales: 'Revenue Suite',
  manager: 'Delivery Command',
  employee: 'My Workspace',
  client: 'Client Portal',
};

interface PortalShellProps {
  role: 'hr' | 'sales' | 'manager' | 'employee' | 'client';
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalShell({ role, title, subtitle, actions, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [unread, setUnread] = useState(0);

  // ---- Role gate + session load ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await portalClient.get<{ authenticated: boolean; user?: SessionUser }>('/api/auth/me');
        if (cancelled) return;
        if (data.authenticated && data.user && (data.user.role === role || data.user.role === 'admin')) {
          setUser(data.user);
          setAuthState('ok');
        } else {
          setAuthState('denied');
          // Unauthenticated visitors of this portal get its own login page;
          // authenticated-but-wrong-role users are sent to their portal home.
          router.replace(
            data.authenticated
              ? (ROLE_HOME[data.user?.role ?? ''] ?? '/')
              : (ROLE_LOGIN[role] ?? '/admin/login')
          );
        }
      } catch {
        if (!cancelled) {
          setAuthState('denied');
          router.replace(ROLE_LOGIN[role] ?? '/admin/login');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [role, router, pathname]);

  // ---- Unread notification count ----
  const refreshUnread = useCallback(async () => {
    try {
      const items = await portalClient.get<NotificationRecord[]>('/api/employee/notifications?unread=true');
      setUnread(items.length);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (authState === 'ok') refreshUnread();
  }, [authState, pathname, refreshUnread]);

  const handleLogout = async () => {
    try {
      await portalClient.post('/api/auth/logout');
    } catch {
      // still redirect
    }
    clearToken();
    router.push(ROLE_LOGIN[role] ?? '/admin/login');
  };

  // ---- States ----
  if (authState === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 flex items-center justify-center text-slate-600 font-mono text-xs">
        <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
          <span>Preparing your workspace…</span>
        </div>
      </div>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center max-w-sm">
          <div className="text-lg font-bold text-[#0B1426] font-display mb-2">Access restricted</div>
          <p className="text-xs text-slate-500 mb-6">Your account does not have access to this workspace.</p>
          <Button variant="dark" size="sm" onClick={() => router.push('/')}>Back to site</Button>
        </div>
      </div>
    );
  }

  const nav = NAVS[role] ?? [];

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Sidebar — mirrors AdminSidebar exactly */}
      <aside className="w-full md:w-64 bg-white md:border-r border-b md:border-b-0 border-slate-200 md:sticky md:top-0 h-auto md:h-[calc(100vh-4.5rem)] md:overflow-y-auto flex flex-col justify-between p-4 shrink-0 shadow-sm z-30">
        <div>
          <div className="px-2 py-4 mb-6 border-b border-slate-100">
            <Logo size="sm" />
            <div className="text-[10px] font-mono uppercase text-coral-600 font-bold tracking-wider mt-1.5 ml-1">
              {ROLE_LABEL[role]}
            </div>
          </div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {nav.map(item => {
              const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-coral-50 text-coral-700 font-semibold border border-coral-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-coral-600' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-1.5 hidden md:block">
          <Link href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <Globe className="w-4 h-4 text-coral-600" />
            <span>View Live Website</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors font-medium">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main column — mirrors AdminHeader exactly */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1426] font-display">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Link
              href={`/${role === 'client' ? 'client' : role}/notifications`}
              className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-coral-500 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-[#0B1426]">{user.fullName || user.email}</div>
                  <Badge variant="coral" size="sm">{user.role}</Badge>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}
