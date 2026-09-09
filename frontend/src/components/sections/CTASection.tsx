'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Mail, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConsultation } from '@/components/ui/ConsultationContext';

export function CTASection() {
  const { openConsultation } = useConsultation();

  return (
    <section className="py-24 relative bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#0B1426] p-8 sm:p-14 lg:p-18 border border-slate-800 overflow-hidden shadow-2xl">
          
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-coral-500/15 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/15 blur-[120px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-coral-400 font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-coral-400" />
              <span>Let's Build Something Resilient Together</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display leading-tight">
              Ready to Modernize Your Enterprise Platform?
            </h2>

            <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Schedule a confidential architecture briefing with our principal systems engineers. We will review your topology and provide an actionable blueprint.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => openConsultation()}
              >
                <span>Start Technical Consultation</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Link href="/services" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  <span>Explore Service Catalogue</span>
                </Button>
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>NDA & Strict Confidentiality</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-coral-400" />
                <span>Response within 1 business day</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span>Direct Principal Access</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
