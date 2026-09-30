'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { apiUrl, authHeaders, clearToken } from '@/lib/api-base';

/**
 * FIX (ISSUES_REPORT #1): the previous gate trusted
 * localStorage('coralswift_admin_auth') which anyone can forge in devtools.
 * The layout now verifies the real session via /api/auth/me (Supabase session
 * or legacy HMAC cookie) before rendering the portal.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/me'), { headers: authHeaders() });
        const data = await res.json().catch(() => ({ authenticated: false }));
        const authed = res.ok && data.authenticated === true && data.user?.role === 'admin';
        if (!authed) clearToken();

        if (cancelled) return;

        if (authed) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          if (!isLoginPage) {
            router.push('/admin/login');
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          if (!isLoginPage) router.push('/admin/login');
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 text-slate-900">{children}</div>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 flex items-center justify-center text-slate-600 font-mono text-xs">
        <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Admin Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-slate-50 flex flex-col md:flex-row text-slate-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-slate-50">
        {children}
      </div>
    </div>
  );
}
