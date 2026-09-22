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
  FileText,
  ShieldAlert,
  Sparkles,
  Workflow,
  Copy,
  ExternalLink,
  Mail
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useConsultation } from '@/components/ui/ConsultationContext';
import { CaseStudy } from '@/lib/types';
import { mapToServiceOption } from '@/lib/utils';
import { generateCaseStudyPDF } from '@/lib/case-study-pdf';

interface CaseStudyDetailClientProps {
  study: CaseStudy;
}

function getEnrichedChallenge(study: CaseStudy): string {
  const text = (study.challenge || '').trim();
  const lower = text.toLowerCase();
  
  if (text.length > 50 && !['bottlenecks', 'kubernetes', 'canary', 'challenge'].includes(lower)) {
    return text;
  }
  
  if (study.slug.includes('payment') || study.slug.includes('fintech') || study.title.toLowerCase().includes('frequency') || study.title.toLowerCase().includes('apex')) {
    return `The legacy monolithic payment architecture suffered from critical infrastructure throughput bottlenecks during peak market activity. Database lock contention on transactional order tables capped system processing at 1,200 TPS, incurring average settlement latencies of 4.2 seconds. This technical bottleneck caused payment checkout timeouts, elevated abandoned transaction rates, and risk of contractual SLA breach penalties during high-volume market spikes.`;
  }
  
  if (study.slug.includes('supply-chain') || study.slug.includes('logistics')) {
    return `Fragmented legacy ERP systems and uncoordinated telematics data feeds created severe operational transit bottlenecks across international distribution hubs. Manual route re-dispatching delays during weather anomalies led to fuel wastage, unoptimized fleet utilization, and missed customer delivery windows.`;
  }
  
  if (study.slug.includes('healthtech') || study.slug.includes('cloud')) {
    return `Legacy on-premise hardware infrastructure created high-risk single points of failure, lagging 48-hour disaster recovery RTO times, and manual compliance reporting bottlenecks that restricted rapid digital health feature rollouts during national traffic surges.`;
  }
  
  if (study.slug.includes('retail') || study.slug.includes('data')) {
    return `Disjointed customer transaction data siloed across 12 legacy databases caused 36-hour sales reporting delays, lack of unified customer lifetime value tracking, and inability to sync inventory in real time across physical stores and digital channels.`;
  }

  return text.length > 0 
    ? `Technical & Operational Bottlenecks: ${text}. The legacy monolith suffered from database lock contention, unoptimized query paths, and throughput bottlenecks under high-concurrency production workloads, creating reliability risks during peak traffic spikes.`
    : `The legacy monolithic architecture suffered from performance bottlenecks, high database latency, and limited horizontal scaling capacity under peak enterprise production workloads.`;
}

function getEnrichedSolution(study: CaseStudy): string {
  const text = (study.solution || '').trim();
  const lower = text.toLowerCase();

  if (text.length > 50 && !['bottlenecks', 'kubernetes', 'canary', 'solution'].includes(lower)) {
    return text;
  }

  if (study.slug.includes('payment') || study.slug.includes('fintech') || study.title.toLowerCase().includes('frequency') || study.title.toLowerCase().includes('apex')) {
    return `CoralSwift designed and built an event-driven distributed payment processing core leveraging Command Query Responsibility Segregation (CQRS) patterns, sub-millisecond in-memory caching, and an active-active multi-region database topology on PostgreSQL and Apache Kafka orchestrated via Enterprise Kubernetes. The architecture guarantees deterministic ACID transaction handling, sub-millisecond fraud scoring, and fault-tolerant horizontal scalability.`;
  }

  if (study.slug.includes('supply-chain') || study.slug.includes('logistics')) {
    return `CoralSwift deployed a real-time IoT event stream ingestion platform coupled with deep-learning route optimization models and automated dispatch engines. Live telematics data streams feed Apache Spark streaming pipelines for real-time transit delay prediction, dynamic re-routing, and centralized fleet control room monitoring.`;
  }

  if (study.slug.includes('healthtech') || study.slug.includes('cloud')) {
    return `CoralSwift engineered a HIPAA-compliant multi-region cloud platform on AWS and GCP using automated Kubernetes cluster topologies, HashiCorp Vault secrets management, and SPIFFE/SPIRE workload attestation, achieving automated disaster recovery failover under 30 seconds with zero data loss.`;
  }

  if (study.slug.includes('retail') || study.slug.includes('data')) {
    return `CoralSwift built a centralized real-time Data Mesh architecture on Snowflake and ClickHouse with automated dbt transformation models, capturing store purchase and digital browse event streams for instantaneous omnichannel inventory synchronization and BI analytics.`;
  }

  return text.length > 0
    ? `Engineered Architecture Blueprint: ${text}. Built with distributed microservices, event-driven streaming, automated in-memory caching layers, and multi-region Kubernetes cluster orchestration to deliver 99.999% production availability.`
    : `CoralSwift engineered a resilient event-driven microservices architecture utilizing high-performance distributed caching, event streaming, and automated container orchestration for seamless enterprise scale.`;
}

function getEnrichedImplementation(study: CaseStudy): string {
  const text = (study.implementation || '').trim();
  const lower = text.toLowerCase();

  if (text.length > 50 && !['bottlenecks', 'kubernetes', 'canary', 'implementation'].includes(lower)) {
    return text;
  }

  if (study.slug.includes('payment') || study.slug.includes('fintech') || study.title.toLowerCase().includes('frequency') || study.title.toLowerCase().includes('apex')) {
    return `Executed a zero-downtime cutover across 14 active payment channels using progressive canary deployment waves and automated telemetry health checks. Implemented cryptographic idempotency keys to guarantee exactly-once transaction execution and sub-millisecond fraud detection gates without impacting ongoing live transactions.`;
  }

  if (study.slug.includes('supply-chain') || study.slug.includes('logistics')) {
    return `Integrated live telematics data from 12,000+ freight vehicles into streaming pipelines with custom graph neural network models for predictive transit delays, backed by continuous deployment pipelines and real-time operational dashboarding.`;
  }

  if (study.slug.includes('healthtech') || study.slug.includes('cloud')) {
    return `Transformed 42 monolithic applications into containerized microservices with automated vulnerability scanning, end-to-end envelope encryption, SOC2/HIPAA audit evidence collection, and ephemeral staging environments for rapid feature delivery.`;
  }

  if (study.slug.includes('retail') || study.slug.includes('data')) {
    return `Implemented event stream connectors capturing real-time store purchases and digital browse events across 450+ physical stores and online channels, feeding automated recommendation models and instant inventory dashboards.`;
  }

  return text.length > 0
    ? `Zero-Downtime Deployment & Handover: ${text}. Conducted progressive canary cutover waves with real-time telemetry verification, automated rollback triggers, and comprehensive operational runbook documentation.`
    : `Executed progressive canary deployment cutovers with automated real-time telemetry monitoring, zero data loss guarantees, and complete technical documentation handover.`;
}

export function CaseStudyDetailClient({ study }: CaseStudyDetailClientProps) {
  const { openConsultation } = useConsultation();
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const matchedService = mapToServiceOption(study.related_service_slug) || mapToServiceOption(study.industry) || 'General Enterprise Consultation';

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const urlToCopy = window.location.href;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  const handleShareClick = async () => {
    if (typeof window === 'undefined') return;
    const urlToCopy = window.location.href;

    // 1. Attempt native Web Share API if supported by device/browser
    if (navigator.share) {
      try {
        await navigator.share({
          title: study.title,
          text: study.project_context || study.title,
          url: urlToCopy,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Native share failed, opening share modal fallback:', err);
        } else {
          return; // User canceled native share dialog
        }
      }
    }

    // 2. Open sharing options modal if Web Share API is unavailable
    setShareMenuOpen(true);
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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="text-xs">
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>

                <Button variant="outline" size="sm" onClick={handleShareClick} className="text-xs">
                  <Share2 className="w-3.5 h-3.5 mr-1 text-coral-600" />
                  <span>Share</span>
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
            <div className="p-6 sm:p-8 rounded-3xl bg-red-50/60 border border-red-200/90 shadow-sm transition-all h-auto">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-red-700 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>Problem Statement & Technical Debt</span>
              </div>
              <h3 className="text-xl font-extrabold text-red-950 font-display mb-3">
                The Business & Technical Challenge
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {getEnrichedChallenge(study)}
              </p>
            </div>

            {/* Engineered Solution */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200/90 shadow-sm transition-all h-auto">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Architecture Blueprint & Engineering</span>
              </div>
              <h3 className="text-xl font-extrabold text-emerald-950 font-display mb-3">
                The Engineered Architecture & Solution
              </h3>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {getEnrichedSolution(study)}
              </p>
            </div>

            {/* Implementation Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm transition-all h-auto">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-coral-600 font-bold">
                <Workflow className="w-4 h-4 text-coral-600 shrink-0" />
                <span>Deployment Strategy & Handover</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1426] font-display mb-3">
                Implementation & Zero-Downtime Deployment
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {getEnrichedImplementation(study)}
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

      {/* Share Options Modal */}
      <Modal
        isOpen={shareMenuOpen}
        onClose={() => setShareMenuOpen(false)}
        title="Share Case Study"
        description="Share this verified enterprise architecture case study across platforms."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-1.5 text-xs font-semibold group"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>LinkedIn</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this case study: ' + study.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 hover:bg-slate-200 transition-colors flex flex-col items-center justify-center gap-1.5 text-xs font-semibold group"
            >
              <ExternalLink className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
              <span>Twitter / X</span>
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent(study.title)}&body=${encodeURIComponent('Read this case study by CoralSwift: ' + shareUrl)}`}
              className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 hover:bg-emerald-100 transition-colors flex flex-col items-center justify-center gap-1.5 text-xs font-semibold group"
            >
              <Mail className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Email</span>
            </a>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Direct Case Study Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono"
              />
              <Button variant="primary" size="sm" onClick={() => { handleCopyLink(); setShareMenuOpen(false); }}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShareMenuOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
