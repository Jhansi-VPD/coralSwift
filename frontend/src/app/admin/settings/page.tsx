'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Sliders, Shield } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { getSiteSettings, updateSiteSettings } from '@/lib/api';
import { SiteSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsLoading(true);

    try {
      await Promise.all([
        updateSiteSettings('general', settings.general),
        updateSiteSettings('metrics', settings.metrics),
      ]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Public Website Settings"
        subtitle="Manage public contact info, headquarters, and verified performance trust metrics."
      />

      <div className="p-6 sm:p-8 max-w-4xl">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* General Metadata */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-[#0B1426] font-display flex items-center gap-2">
              <Sliders className="w-4 h-4 text-coral-600" />
              <span>Identity & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  value={settings.general.company_name}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, company_name: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={settings.general.tagline}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, tagline: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.general.contact_email}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, contact_email: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Telephone
                </label>
                <input
                  type="text"
                  value={settings.general.phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, phone: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                Headquarters Address
              </label>
              <input
                type="text"
                value={settings.general.headquarters}
                onChange={(e) => setSettings({
                  ...settings,
                  general: { ...settings.general, headquarters: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              />
            </div>
          </div>

          {/* Performance Trust Metrics */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-[#0B1426] font-display flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Public Trust Metrics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Uptime SLA Metric
                </label>
                <input
                  type="text"
                  value={settings.metrics.uptime_sla}
                  onChange={(e) => setSettings({
                    ...settings,
                    metrics: { ...settings.metrics, uptime_sla: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1.5">
                  Daily TPS / Scale Metric
                </label>
                <input
                  type="text"
                  value={settings.metrics.tps_processed}
                  onChange={(e) => setSettings({
                    ...settings,
                    metrics: { ...settings.metrics, tps_processed: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {isSaved && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Site configuration synchronized with Supabase!</span>
              </div>
            )}
            <div className="ml-auto">
              <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                <Save className="w-4 h-4 mr-1.5" />
                <span>Save Site Settings</span>
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
