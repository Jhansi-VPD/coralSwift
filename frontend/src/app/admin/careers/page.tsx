'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, Users, Briefcase, FileText, CheckCircle, ExternalLink, Mail, Phone, Globe } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { JobEditorModal } from '@/components/forms/JobEditorModal';
import { getJobs, getApplications, deleteJob, updateApplicationStatus } from '@/lib/api';
import { Job, Application } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function AdminCareersPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (tabParam === 'applications') {
      setActiveTab('applications');
    } else if (tabParam === 'jobs') {
      setActiveTab('jobs');
    }
  }, [tabParam]);

  const loadData = async () => {
    const [jData, aData] = await Promise.all([getJobs(), getApplications()]);
    setJobs(jData);
    setApplications(aData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCreateJob = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm('Delete this career opening?')) {
      await deleteJob(id);
      loadData();
    }
  };

  const handleAppStatusChange = async (appId: string, status: Application['status']) => {
    await updateApplicationStatus(appId, status);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Careers & Candidate Talent Pipeline"
        subtitle="Manage job openings and review candidate applications."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'jobs' ? 'bg-[#0B1426] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Openings ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'applications' ? 'bg-[#0B1426] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Applications ({applications.length})
              </button>
            </div>
            {activeTab === 'jobs' && (
              <Button variant="primary" size="sm" onClick={handleCreateJob}>
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Post Job</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl">
        {activeTab === 'jobs' ? (
          <>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="table-scroll-container">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-mono uppercase font-bold shadow-xs">
                    <tr>
                      <th className="px-6 py-4 min-w-[280px]">Title &amp; Location</th>
                      <th className="px-6 py-4 whitespace-nowrap">Department</th>
                      <th className="px-6 py-4 whitespace-nowrap">Type / Model</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap w-[140px]">Actions</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 align-middle">
                        <div className="font-bold text-[#0B1426] text-sm font-display leading-snug">{j.title}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">{j.location}</div>
                      </td>
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <Badge variant="blue" size="sm">{j.department}</Badge>
                      </td>
                      <td className="px-6 py-4 align-middle whitespace-nowrap text-slate-600 font-mono">
                        {j.work_model} • {j.employment_type}
                      </td>
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <Badge variant={j.status === 'active' ? 'emerald' : 'slate'} size="sm">
                          {j.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <a
                            href={`/careers/${j.slug || j.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-coral-600 hover:bg-slate-200 transition-colors"
                            title="View Public Role"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleEditJob(j)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Edit Job"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(j.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
          /* Applications Tab */
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                No candidate applications recorded yet.
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-bold text-[#0B1426] font-display">{app.full_name}</h4>
                        <Badge variant="blue" size="sm">{app.status}</Badge>
                      </div>
                      <p className="text-xs font-mono text-coral-600 font-semibold mt-0.5">
                        Applied for: {app.job_title} • {formatDate(app.created_at)}
                      </p>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 font-bold">Status:</span>
                      <select
                        value={app.status}
                        onChange={(e) => handleAppStatusChange(app.id, e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-coral-600 shrink-0" />
                      <a href={`mailto:${app.email}`} className="text-coral-600 hover:underline font-medium">{app.email}</a>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-coral-600 shrink-0" />
                        <span>{app.phone}</span>
                      </div>
                    )}
                    {app.linkedin_url && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Globe className="w-4 h-4 text-coral-600 shrink-0" />
                        <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-coral-600 hover:underline font-medium">LinkedIn Profile</a>
                      </div>
                    )}
                  </div>

                  {app.cover_note && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong className="block font-mono text-slate-500 uppercase text-[10px] mb-1 font-bold">Candidate Cover Note:</strong>
                      <p className="leading-relaxed">{app.cover_note}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Resume File: <strong>{app.resume_filename}</strong></span>
                    </div>
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-coral-50 text-coral-700 hover:bg-coral-100 border border-coral-200 font-semibold transition-colors"
                      >
                        Download CV
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <JobEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSaved={loadData}
      />
    </div>
  );
}

export default function AdminCareersPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-8 text-slate-500 font-mono text-xs">Loading Careers &amp; Talent Pipeline...</div>}>
      <AdminCareersPageContent />
    </Suspense>
  );
}
