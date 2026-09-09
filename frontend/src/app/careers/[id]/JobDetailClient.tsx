'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  Send, 
  Clock, 
  HeartHandshake 
} from 'lucide-react';
import { Job } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JobApplicationModal } from '@/components/forms/JobApplicationModal';

interface JobDetailClientProps {
  job: Job;
}

export function JobDetailClient({ job }: JobDetailClientProps) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
          <Link href="/" className="hover:text-coral-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/careers" className="hover:text-coral-600 transition-colors">Careers</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-coral-600 truncate max-w-xs">{job.title}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="py-12 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="blue" size="sm">{job.department}</Badge>
                <Badge variant="indigo" size="sm">{job.work_model}</Badge>
                <Badge variant="slate" size="sm">{job.employment_type}</Badge>
                <Badge variant="coral" size="sm">{job.experience_level}</Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-4">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-mono text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-coral-600" />
                  <span>{job.location}</span>
                </div>
                {job.salary_range && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{job.salary_range}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <Button
                variant="coral"
                size="lg"
                onClick={() => setIsApplyModalOpen(true)}
              >
                <span>Apply for this Position</span>
                <Send className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main info */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Overview */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#0B1426] font-display mb-4">
                About the Role & Mission
              </h2>
              <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-[#0B1426] font-display mb-4">
                  What You Will Do
                </h2>
                <div className="space-y-3">
                  {job.responsibilities.map((resp, i) => (
                    <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-coral-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-[#0B1426] font-display mb-4">
                  Qualifications & Requirements
                </h2>
                <div className="space-y-3">
                  {job.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-[#0B1426] font-display mb-4">
                  Compensation & Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.benefits.map((b, i) => (
                    <div key={i} className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center gap-2.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B1426] text-white rounded-3xl p-7 border border-slate-800 shadow-xl space-y-5">
              <h3 className="text-base font-bold font-display">
                Ready to Join CoralSwift?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Submit your CV/resume. Our technical hiring team reviews every engineering application carefully.
              </p>
              <Button
                variant="coral"
                size="md"
                className="w-full text-xs font-semibold"
                onClick={() => setIsApplyModalOpen(true)}
              >
                <span>Submit Application</span>
                <Send className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 text-xs space-y-3 shadow-sm">
              <h4 className="font-mono text-slate-900 uppercase font-bold">Hiring Process</h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>CV / Technical Portfolio Review</li>
                <li>30-Min Initial Scope & Culture Sync</li>
                <li>Architectural Deep Dive with Principal Engineer</li>
                <li>Executive Offer & Leadership Meet</li>
              </ol>
            </div>
          </div>

        </div>
      </div>

      <JobApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={job}
      />
    </div>
  );
}
