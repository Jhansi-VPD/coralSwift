import React from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { ClientLogoMarquee } from '@/components/sections/ClientLogoMarquee';
import { ServicesGrid } from '@/components/sections/ServicesGrid';
import { WhyCoralSwift } from '@/components/sections/WhyCoralSwift';
import { CaseStudiesShowcase } from '@/components/sections/CaseStudiesShowcase';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { getServices, getCaseStudies } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const services = await getServices('published');
  const caseStudies = await getCaseStudies(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section with Interactive Network Topology Canvas */}
      <HeroSection />

      {/* 2. Client Logo Marquee */}
      <ClientLogoMarquee />

      {/* 3. Core Capabilities & Services */}
      <ServicesGrid 
        services={services} 
        title="Enterprise Software Capabilities"
        subtitle="End-to-end engineering excellence across modern cloud, artificial intelligence, and distributed architectures."
        limit={6}
      />

      {/* 4. Why CoralSwift Verified Engineering Standard */}
      <WhyCoralSwift />

      {/* 5. Featured Case Studies Showcase */}
      <CaseStudiesShowcase caseStudies={caseStudies} limit={3} />

      {/* 6. Executive Client Social Proof & Testimonials */}
      <TestimonialsSection />

      {/* 7. Enterprise CTA */}
      <CTASection />
    </div>
  );
}
