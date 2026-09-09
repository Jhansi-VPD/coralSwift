'use client';

import React from 'react';
import { 
  Quote, 
  ShieldCheck, 
  Star, 
  Building2, 
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "CoralSwift re-architected our core clearing pipeline from the ground up. We compressed P99 latency from 4.2 seconds to 18 milliseconds while scaling to 42,000+ TPS with zero downtime.",
      author: "Marcus Brody",
      role: "VP of Core Infrastructure",
      company: "Apex Financial Global",
      industry: "FinTech & Banking",
      verifiedOutcome: "99.999% SLA Verified",
      impactMetric: "42,000+ TPS",
      avatarInitials: "MB",
      avatarBg: "bg-coral-500"
    },
    {
      quote: "The deterministic RAG pipelines engineered by CoralSwift gave our clinicians sub-second trial synthesis with zero hallucinations. Their adherence to HIPAA security and PII guardrails is unparalleled.",
      author: "Dr. Elena Rostova",
      role: "Chief Technology Officer",
      company: "OmniHealth Global",
      industry: "Healthcare & Life Sciences",
      verifiedOutcome: "SOC2 & HIPAA Compliant",
      impactMetric: "6M+ Records",
      avatarInitials: "ER",
      avatarBg: "bg-rose-500"
    },
    {
      quote: "Migrating 42 monolithic logistics microservices across AWS and GCP in live production without dropping a single packet was an engineering masterclass. CoralSwift is our highest-trust technical partner.",
      author: "David Vance",
      role: "Head of Distributed Systems",
      company: "Vanguard Logistics",
      industry: "Supply Chain & IoT",
      verifiedOutcome: "< 30s Disaster Recovery",
      impactMetric: "$14.2M Saved",
      avatarInitials: "DV",
      avatarBg: "bg-indigo-600"
    }
  ];

  return (
    <section className="py-24 bg-white border-t border-slate-200/80 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="emerald" className="mb-3 font-semibold">
            Executive Social Proof
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
            Endorsed by Engineering Leadership
          </h2>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Direct feedback from CTOs and VPs of Engineering operating mission-critical platforms built by CoralSwift.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="glass-card-light group rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-coral-300 cursor-default"
            >
              {/* Top Accent Gradient Bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral-500 via-rose-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Badge & Impact Metric */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t.verifiedOutcome}
                  </span>
                  <span className="text-xs font-mono font-extrabold text-coral-600">
                    {t.impactMetric}
                  </span>
                </div>

                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-coral-500/25 mb-4" />

                {/* Quote Body */}
                <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl ${t.avatarBg} text-white font-bold font-mono text-sm flex items-center justify-center shadow-sm`}>
                  {t.avatarInitials}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0B1426] font-display group-hover:text-coral-600 transition-colors">
                    {t.author}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {t.role} • {t.company}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
