'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  Building2,
  Share2,
  Download,
  Check,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConsultation } from '@/components/ui/ConsultationContext';
import { CaseStudy } from '@/lib/types';
import { mapToServiceOption } from '@/lib/utils';
import { generateCaseStudyPDF } from '@/lib/case-study-pdf';

interface CaseStudyDetailClientProps {
  study: CaseStudy;
}

export function CaseStudyDetailClient({ study }: CaseStudyDetailClientProps) {
  const { openConsultation } = useConsultation();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const matchedService = mapToServiceOption(study.related_service_slug) || mapToServiceOption(study.industry) || 'General Enterprise Consultation';

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const urlToCopy = window.location.href;

    // 1. Try modern Clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (err) {
        console.warn('Clipboard writeText rejected:', err);
      }
    }

    // 2. Fallback using DOM textarea copy
    try {
      const textArea = document.createElement('textarea');
      textArea.value = urlToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch (err) {
      console.error('DOM fallback copy failed:', err);
    }

    // 3. Fallback for mobile / Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: study.title,
          text: study.project_context || study.title,
          url: urlToCopy,
        });
      } catch (e) {
        // User closed native share sheet
      }
    }
  };

  const handleDownloadBrief = async () => {
    try {
      setIsDownloading(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await generateCaseStudyPDF(study);
    } catch (err) {
      console.error('Failed to generate PDF brief:', err);
      alert('Failed to generate PDF brief. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
          <Link href="/" className="hover:text-coral-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/case-studies" className="hover:text-coral-600 transition-colors">Case Studies</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-coral-600 truncate max-w-xs">{study.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="blue">{study.industry}</Badge>
              <Badge variant="coral">Verified Production Outcome</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              {study.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              {study.project_context}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                <Building2 className="w-4 h-4 text-coral-600" />
                <span>Client Partner: <strong className="text-slate-900">{study.client_name}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      <span>Share Study</span>
                    </>
                  )}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadBrief} className="text-xs" disabled={isDownloading}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Brief'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="py-12 bg-slate-50/80 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Verified Telemetry Metrics</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {study.outcome_metrics.map((metric, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-3xl sm:text-4xl font-extrabold text-coral-600 font-display">
                  {metric.metric}
                </div>
                <div className="text-xs text-slate-600 mt-2 font-medium">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Breakdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* The Challenge */}
            <div className="p-8 rounded-3xl bg-red-50/50 border border-red-200">
              <h3 className="text-xl font-bold text-red-800 font-display mb-3">
                The Business & Technical Challenge
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {study.challenge}
              </p>
            </div>

            {/* Engineered Solution */}
            <div className="p-8 rounded-3xl bg-emerald-50/50 border border-emerald-200">
              <h3 className="text-xl font-bold text-emerald-800 font-display mb-3">
                The Engineered Architecture & Solution
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {study.solution}
              </p>
            </div>

            {/* Implementation Details */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm">
              <h3 className="text-2xl font-extrabold text-[#0B1426] font-display mb-4">
                Implementation & Zero-Downtime Deployment
              </h3>
              <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {study.implementation}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="text-sm font-mono uppercase tracking-wider text-slate-800 mb-4 font-bold">
                Technology & Infrastructure Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {study.tech_stack.map((tech, i) => (
                  <span 
                    key={i} 
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B1426] text-white rounded-3xl p-7 border border-slate-800 shadow-xl">
              <h4 className="text-base font-bold font-display mb-2">
                Have a Similar Requirement?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Consult with the CoralSwift architects who designed this solution. We evaluate your current systems and offer actionable blueprints.
              </p>
              <Button 
                variant="primary" 
                size="md" 
                className="w-full text-xs font-semibold"
                onClick={() => openConsultation(matchedService)}
              >
                <span>Start a Technical Discussion</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            {study.related_service_slug && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 text-xs space-y-2 shadow-sm">
                <span className="font-mono text-slate-400 uppercase font-semibold">Related Service</span>
                <p className="text-slate-800 font-semibold">Explore related capabilities for this domain.</p>
                <Link 
                  href={`/services/${study.related_service_slug}`}
                  className="inline-flex items-center gap-1.5 text-coral-600 hover:text-coral-700 transition-colors font-mono font-bold pt-2"
                >
                  <span>View Service Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
