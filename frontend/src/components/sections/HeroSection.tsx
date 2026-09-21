'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Server, 
  ChevronRight, 
  Activity 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConsultation } from '@/components/ui/ConsultationContext';
import { NetworkCanvas } from '@/components/interactive/NetworkCanvas';

export function HeroSection() {
  const { openConsultation } = useConsultation();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#F8FAFC]">
      {/* Background Flowing Data Particles Video - Light Shade Blend */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover opacity-45 mix-blend-multiply filter contrast-125"
        >
          <source src="/Data_particles_flowing_no_audio_gwr_video_mvp.mp4" type="video/mp4" />
        </video>
        {/* Soft Light Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/80 via-transparent to-[#F8FAFC]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/60 via-transparent to-[#F8FAFC]/60" />
      </div>

      {/* Interactive Global Traffic Network Canvas */}
      <NetworkCanvas />

      {/* Subtle Mesh Glow & Grid */}
      <div className="absolute inset-0 bg-grid-subtle opacity-60 pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-mesh-hero pointer-events-none blur-3xl opacity-75 z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-8">
          <Link href="/services" className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-mono text-slate-700 hover:border-coral-400 transition-colors group cursor-pointer">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coral-500"></span>
            </span>
            <span className="font-semibold text-slate-900">Officially Partnered by VPD Technologies</span>
            <span className="text-slate-300">|</span>
            <span className="text-coral-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Explore 2026 Capabilities <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#0B1426] tracking-tight leading-[1.1] font-display">
            Mission-Critical Software for the{' '}
            <span className="text-gradient-brand">Global Enterprise</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CoralSwift designs, modernizes, and operates resilient cloud architectures, custom generative AI pipelines, and ultra-high-throughput distributed systems.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              id="hero-cta-btn"
              data-testid="hero-consultation-cta"
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto text-sm sm:text-base shadow-lg shadow-coral-500/15 consultation-cta-btn"
              onClick={() => openConsultation()}
              aria-label="Start Architecture Consultation"
            >
              <span>Start Architecture Consultation</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            
            <Link href="/case-studies" className="w-full sm:w-auto">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto text-sm sm:text-base bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm"
              >
                <span>Explore Verified Outcomes</span>
              </Button>
            </Link>
          </div>

          {/* Trust Verification Badges */}
          <div className="mt-12 pt-6 border-t border-slate-200/90 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Officially Partnered by VPD Technologies</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Activity className="w-4 h-4 text-coral-600" />
              <span>99.999% SLA Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Zero-Downtime Migration</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Server className="w-4 h-4 text-rose-600" />
              <span>SOC2 Type II & HIPAA</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
