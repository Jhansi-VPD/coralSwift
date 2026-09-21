'use client';

import React from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  Terminal, 
  Zap, 
  Workflow, 
  Layers, 
  Lock,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useConsultation } from '@/components/ui/ConsultationContext';

export function WhyCoralSwift() {
  const { openConsultation } = useConsultation();

  const pillars = [
    {
      icon: <Terminal className="w-6 h-6 text-coral-600" />,
      tag: "Deterministic SLA",
      title: "RFC-First Engineering",
      description: "We don't guess. All architecture decisions are codified in formal Technical RFCs, verified via automated benchmarking, and governed by strict performance SLAs."
    },
    {
      icon: <GitBranch className="w-6 h-6 text-rose-600" />,
      tag: "Zero Downtime",
      title: "Canary Migration Wave",
      description: "Our blue-green and canary migration frameworks allow global enterprises to replatform core billing and database layers without a single millisecond of user-facing downtime."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      tag: "Compliance Baked-In",
      title: "Security & Zero-Trust",
      description: "Defense-in-depth principles embedded from the initial commit. Policy-as-Code, zero-trust IAM boundaries, and automated SOC2 / HIPAA compliance guardrails."
    },
    {
      icon: <Workflow className="w-6 h-6 text-indigo-600" />,
      tag: "Principal Squads",
      title: "Direct Principal Access",
      description: "You collaborate directly with staff and principal software architects who have designed systems for Fortune 500 tech enterprises—no junior hand-offs or intermediary layers."
    }
  ];

  return (
    <section className="py-24 relative bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="rose" className="mb-3 font-semibold">
            The CoralSwift Standard
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
            Engineered for Extreme Reliability
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Enterprise software requires more than just working code. It demands predictable latency, cryptographic data safety, and zero-compromise architectural discipline.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              onClick={() => openConsultation(pillar.title)}
              className="glass-card-light glass-card-hover rounded-2xl p-7 flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-coral-300"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0B1426] mb-3 font-display group-hover:text-coral-600 transition-colors">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 font-semibold flex items-center justify-between">
                <span>Principle 0{i + 1}</span>
                <span className="text-coral-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Inquire <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
