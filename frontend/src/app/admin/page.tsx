'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Briefcase, 
  FileCheck, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAdminStats, getEnquiries, getApplications, updateEnquiryStatus } from '@/lib/api';
import { AdminStats, Enquiry, Application } from '@/lib/types';
import { formatDate, formatTimeAgo } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, enqs, apps] = await Promise.all([
        getAdminStats(),
        getEnquiries(),
        getApplications(),
      ]);
      setStats(s);
      setRecentEnquiries(enqs.slice(0, 5));
      setRecentApplications(apps.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (enquiryId: string, newStatus: Enquiry['status']) => {
    await updateEnquiryStatus(enquiryId, newStatus);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Administrative Overview"
        subtitle="Live metrics, recent inbound enquiries, and candidate applications."
        actions={
          <Button variant="secondary" size="sm" onClick={loadData}>
            Refresh Data
          </Button>
        }
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
        
        {/* KPI Stat Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Services */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-mono uppercase font-bold tracking-wider">Services Catalogue</span>
                <div className="w-8 h-8 rounded-lg bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0B1426] font-display">
                {stats.published_services}{' '}
                <span className="text-xs font-mono font-normal text-slate-500">/ {stats.total_services} active</span>
              </div>
              <div className="mt-2 text-xs text-coral-600 font-mono font-semibold">
                <Link href="/admin/services" className="hover:underline">Manage Services →</Link>
              </div>
            </div>

            {/* Active Careers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-mono uppercase font-bold tracking-wider">Open Positions</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0B1426] font-display">
                {stats.active_jobs}
              </div>
              <div className="mt-2 text-xs text-indigo-600 font-mono font-semibold">
                <Link href="/admin/careers" className="hover:underline">{stats.total_applications} Applications →</Link>
              </div>
            </div>

            {/* Case Studies */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-mono uppercase font-bold tracking-wider">Case Studies</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0B1426] font-display">
                {stats.total_case_studies}
              </div>
              <div className="mt-2 text-xs text-blue-600 font-mono font-semibold">
                <Link href="/admin/case-studies" className="hover:underline">Manage Portfolio →</Link>
              </div>
            </div>

            {/* Enquiries */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-mono uppercase font-bold tracking-wider">Client Enquiries</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0B1426] font-display">
                {stats.total_enquiries}{' '}
                {stats.new_enquiries > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                    {stats.new_enquiries} New
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold">
                <Link href="/admin/enquiries" className="hover:underline">Review Pipeline →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Section: Recent Enquiries & Recent Job Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent Inquiries */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-coral-600" />
                <h3 className="text-base font-bold text-[#0B1426] font-display">
                  Recent Inbound Inquiries
                </h3>
              </div>
              <Link href="/admin/enquiries" className="text-xs font-mono text-coral-600 hover:underline font-semibold">
                View All
              </Link>
            </div>

            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No enquiries recorded yet.</p>
            ) : (
              <div className="space-y-3.5">
                {recentEnquiries.map((enq) => (
                  <div key={enq.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#0B1426] font-display">{enq.full_name}</span>
                          <span className="text-xs text-slate-500 font-mono">• {enq.company}</span>
                        </div>
                        <div className="text-xs text-coral-600 font-mono font-medium">{enq.email}</div>
                      </div>
                      <Badge 
                        variant={enq.status === 'new' ? 'emerald' : enq.status === 'in_review' ? 'amber' : 'slate'}
                        size="sm"
                      >
                        {enq.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {enq.message}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200/60">
                      <span>{formatTimeAgo(enq.created_at)} • Service: {enq.service_interest}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStatusChange(enq.id, 'in_review')}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors font-medium shadow-2xs"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleStatusChange(enq.id, 'contacted')}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors font-medium shadow-2xs"
                        >
                          Contacted
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-[#0B1426] font-display">
                  Recent Applications
                </h3>
              </div>
              <Link href="/admin/careers" className="text-xs font-mono text-indigo-600 hover:underline font-semibold">
                View All
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No applications submitted yet.</p>
            ) : (
              <div className="space-y-3.5">
                {recentApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-[#0B1426] font-display">{app.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{app.job_title}</div>
                      </div>
                      <Badge variant="blue" size="sm">{app.status}</Badge>
                    </div>

                    <div className="text-xs font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>CV: {app.resume_filename}</span>
                      <span>{formatDate(app.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
