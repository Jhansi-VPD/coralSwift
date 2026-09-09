import React from 'react';
import { Metadata } from 'next';
import { getServices } from '@/lib/api';
import { ServicesGrid } from '@/components/sections/ServicesGrid';
import { CTASection } from '@/components/sections/CTASection';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Software Services Catalogue | Cloud, AI & Distributed Systems',
  description: 'Explore CoralSwift enterprise software engineering catalogue: cloud architecture, applied AI, platform engineering, and high-throughput systems.'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ServicesPage() {
  const services = await getServices('published');

  return (
    <div className="pt-28 pb-20 bg-enterprise-canvas">
      {/* Page Header */}
      <section className="py-16 bg-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              Software Services Catalogue
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              Engineering Capabilities Built for{' '}
              <span className="text-gradient-coral">Extreme Scale</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              We architect, implement, and maintain high-performance software systems. Explore our core services below to review our delivery approach, prerequisites, and tangible deliverables.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid (Full Catalogue with Category Filters) */}
      <ServicesGrid 
        services={services}
        title="All Approved Services"
        subtitle="Select any service to view architectural specifications, delivery stages, and engagement prerequisites."
      />

      {/* CTA */}
      <CTASection />
    </div>
  );
}
