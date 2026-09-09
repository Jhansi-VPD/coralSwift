import React from 'react';
import { Metadata } from 'next';
import { getCaseStudies } from '@/lib/api';
import { CaseStudiesShowcase } from '@/components/sections/CaseStudiesShowcase';
import { CTASection } from '@/components/sections/CTASection';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Enterprise Case Studies | Verified Production Outcomes',
  description: 'Explore verified architecture case studies from CoralSwift: 42,000+ TPS payment systems, AI logistics, and multi-cloud healthcare platforms.'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CaseStudiesPage() {
  const caseStudies = await getCaseStudies(false);

  return (
    <div className="pt-28 pb-20 bg-enterprise-canvas">
      {/* Header */}
      <section className="py-16 bg-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              Verified Production Results
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              Engineering Case Studies &{' '}
              <span className="text-gradient-coral">Enterprise Impact</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Explore how CoralSwift solves complex architectural bottlenecks, eliminates downtime, and builds ultra-resilient distributed platforms for global industry leaders.
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies Showcase */}
      <CaseStudiesShowcase caseStudies={caseStudies} limit={10} />

      {/* CTA */}
      <CTASection />
    </div>
  );
}
