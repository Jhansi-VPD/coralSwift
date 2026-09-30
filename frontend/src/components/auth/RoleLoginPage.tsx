'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { apiUrl, storeToken, clearToken } from '@/lib/api-base';

/**
 * SHARED ROLE LOGIN — one implementation, six branded entry points.
 *
 * Each portal has its own login page (/admin/login, /hr/login, /sales/login,
 * /manager/login, /employee/login, /client/login) rendered by this component
 * with role-specific copy and theming. Authentication itself is shared: the
 * FastAPI /api/auth/login endpoint validates every role, and after sign-in the
 * user is routed to their own portal home (redirectTo from the backend).
 *
 * Note: the backend still logs any valid role in — role/portal separation is
 * enforced by the PortalShell role gate and the backend RBAC matrix, not by
 * which login page was used.
 */

export interface RoleLoginConfig {
  role: 'admin' | 'hr' | 'sales' | 'manager' | 'employee' | 'client';
  /** Suite name shown under the logo, e.g. "People Operations". */
  suiteLabel: string;
  /** Field label for the email input. */
  emailLabel: string;
  /** Placeholder for the email input. */
  emailPlaceholder: string;
  /** Success button label. */
  submitLabel: string;
  /** Where to send this role after a successful login (fallback for backend redirectTo). */
  roleHome: string;
  /** Portal URL segment used to bounce an already-authenticated wrong-role user. */
}

const ROLE_HOME_FALLBACK: Record<string, string> = {
  admin: '/admin',
  hr: '/hr',
  sales: '/sales',
  manager: '/manager',
  employee: '/employee',
  client: '/client',
};

export function RoleLoginPage({ config }: { config: RoleLoginConfig }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setError(data.detail || data.error || 'Invalid email or password. Please try again.');
        return;
      }

      // Persist the FastAPI bearer token (attached by api-base.ts on every call).
      clearToken();
      storeToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('coralswift_admin_email', data.user?.email || email);
        localStorage.setItem('coralswift_admin_role', data.user?.role || config.role);
      }
      // Audit logging happens server-side in the FastAPI login endpoint.
      // Route each role to its own portal home (backend supplies redirectTo).
      setTimeout(() => {
        const backendRedirect = data.redirectTo || '';
        const intended = ROLE_HOME_FALLBACK[config.role] || config.roleHome;
        // Honor the backend's redirect only when it matches this portal's role,
        // otherwise land on the portal this login page is for.
        router.push(backendRedirect === intended ? backendRedirect : intended);
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setError('Unable to authenticate. Please check your network connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-coral-500/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Logo size="lg" />
          <p className="text-xs font-mono uppercase tracking-widest text-coral-600 font-bold mt-2">
            {config.suiteLabel}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-600 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-mono uppercase text-slate-700 font-bold mb-2">
                {config.emailLabel} <span className="text-coral-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  placeholder={config.emailPlaceholder}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.email
                      ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-mono uppercase text-slate-700 font-bold mb-2">
                Password <span className="text-coral-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => {
                        const copy = { ...prev };
                        delete copy.password;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.password
                      ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full"
            >
              <span>{config.submitLabel}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
