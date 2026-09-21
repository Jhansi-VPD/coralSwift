'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Building2, TrendingUp, ShieldCheck } from 'lucide-react';
import { CaseStudy } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CaseStudiesShowcaseProps {
  caseStudies: CaseStudy[];
  limit?: number;
  variant?: 'slider' | 'list';
}

export function CaseStudiesShowcase({ caseStudies, limit, variant = 'slider' }: CaseStudiesShowcaseProps) {
  const publishedStudies = (caseStudies || []).filter(c => c.status === 'published');
  const displayStudies = limit ? publishedStudies.slice(0, limit) : publishedStudies;
  const [currentIndex, setCurrentIndex] = useState(0);

  if (displayStudies.length === 0) return null;

  const currentStudy = displayStudies[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayStudies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayStudies.length - 1 ? 0 : prev + 1));
  };

  if (variant === 'list') {
    return (
      <section className="py-24 relative bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <Badge variant="indigo" className="mb-3 font-semibold">
                Verified Production Outcomes
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
                Enterprise Case Studies
              </h2>
              <p className="mt-3 text-slate-600 text-base max-w-2xl leading-relaxed">
                Proven architecture and engineering transformations delivering measurable latency reductions, multi-million dollar efficiencies, and 99.999% availability.
              </p>
            </div>
          </div>

          {/* Case Studies Cards List */}
          <div className="space-y-10">
            {displayStudies.map((study) => (
              <div
                key={study.id}
                className="glass-card-light glass-card-hover rounded-3xl p-7 sm:p-10 border border-slate-200/90 relative overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                  {/* Left Column: Context, Challenge, Solution */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                      {/* Header Badges */}
                      <div className="flex flex-wrap items-center gap-2.5 mb-4">
                        <Badge variant="blue" size="sm">
                          {study.industry}
                        </Badge>
                        <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-coral-600" />
                          Client: <strong className="text-slate-900">{study.client_name}</strong>
                        </span>
                      </div>

                      <Link href={`/case-studies/${study.slug}`} className="group/title block">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] mb-4 font-display group-hover/title:text-coral-600 transition-colors">
                          {study.title}
                        </h3>
                      </Link>

                      <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
                        {study.project_context}
                      </p>

                      {/* Challenge & Solution Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-100">
                        <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/60">
                          <p className="text-xs font-mono font-bold uppercase text-red-700 mb-1.5">
                            The Bottleneck
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                            {study.challenge}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                          <p className="text-xs font-mono font-bold uppercase text-emerald-700 mb-1.5">
                            Engineered Architecture
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                            {study.solution}
                          </p>
                        </div>
                      </div>

                      {/* Tech Stack Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-mono text-slate-400 font-semibold mr-1">Stack:</span>
                        {study.tech_stack.map((tech, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <Link href={`/case-studies/${study.slug}`}>
                        <Button variant="outline" size="sm">
                          <span>Read Full Architectural RFC & Case Study</span>
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Verified Outcome Metrics Banner */}
                  <div className="lg:col-span-5 bg-[#0B1426] rounded-2xl p-7 border border-slate-800 text-white flex flex-col justify-center shadow-xl">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Verified Production Impact</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {study.outcome_metrics.map((metric, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-coral-500/40 transition-colors"
                        >
                          <div className="text-2xl sm:text-3xl font-extrabold text-coral-400 font-display">
                            {metric.metric}
                          </div>
                          <div className="text-xs text-slate-300 mt-1 font-medium leading-snug">
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Post-launch telemetry verified under zero-downtime SLA.</span>
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

  return (
    <section className="pt-20 pb-12 relative bg-[#FAFBFC] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Badge variant="indigo" className="mb-3 font-semibold">
              Verified Production Outcomes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
              Enterprise Case Studies
            </h2>
            <p className="mt-3 text-slate-600 text-base max-w-2xl leading-relaxed">
              Proven architecture and engineering transformations delivering measurable latency reductions, multi-million dollar efficiencies, and 99.999% availability.
            </p>
          </div>

          <Link href="/case-studies">
            <Button variant="secondary" size="md" className="self-start md:self-auto">
              <span>View All Case Studies</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Single Active Case Study Card */}
        <div className="glass-card-light glass-card-hover rounded-3xl p-8 sm:p-10 border border-slate-200/90 relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-xl group">
          {/* Top ambient accent bar - ONLY highlights on mouse hover */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral-500 via-rose-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div>
            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <Badge variant="blue" size="sm">
                {currentStudy.industry}
              </Badge>
              <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-coral-600" />
                Client: <strong className="text-slate-900">{currentStudy.client_name}</strong>
              </span>
            </div>

            {/* Title */}
            <Link href={`/case-studies/${currentStudy.slug}`} className="group/title block mb-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] font-display group-hover/title:text-coral-600 transition-colors leading-snug">
                {currentStudy.title}
              </h3>
            </Link>

            {/* Context Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed max-w-4xl">
              {currentStudy.project_context}
            </p>

            {/* Challenge & Solution Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-slate-100">
              <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200/60">
                <p className="text-xs font-mono font-bold uppercase text-red-700 mb-2">
                  THE BOTTLENECK
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {currentStudy.challenge}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                <p className="text-xs font-mono font-bold uppercase text-emerald-700 mb-2">
                  ENGINEERED ARCHITECTURE
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {currentStudy.solution}
                </p>
              </div>
            </div>

            {/* Card Footer Action */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <Link href={`/case-studies/${currentStudy.slug}`}>
                <Button variant="outline" size="sm">
                  <span>Read Full Architectural RFC & Case Study</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Arrow Navigation Controls - Centered BELOW the card */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
            aria-label="Previous case study"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
            aria-label="Next case study"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}

