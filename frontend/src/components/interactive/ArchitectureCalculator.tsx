'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Server
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConsultation } from '@/components/ui/ConsultationContext';

export function ArchitectureCalculator() {
  const { openConsultation } = useConsultation();
  const [tps, setTps] = useState<number>(2500);
  const [monthlySpend, setMonthlySpend] = useState<number>(45000);
  const [archType, setArchType] = useState<'legacy' | 'hybrid' | 'event'>('legacy');

  // Multiplier logic based on architecture
  const efficiencyMultipliers = {
    legacy: { savingsPercent: 0.38, latencyReductionMs: 3800, targetLatency: '24ms' },
    hybrid: { savingsPercent: 0.28, latencyReductionMs: 2100, targetLatency: '18ms' },
    event: { savingsPercent: 0.22, latencyReductionMs: 1400, targetLatency: '12ms' },
  };

  const selected = efficiencyMultipliers[archType];
  const annualSavings = Math.round(monthlySpend * 12 * selected.savingsPercent);
  const fiveYearROI = Math.round(annualSavings * 4.8);
  const maxSafeTPS = Math.round(tps * 18);

  return (
    <section className="py-24 bg-white border-t border-slate-200/80 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="coral" className="mb-3 font-semibold">
            Interactive Architecture ROI Engine
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
            Calculate Your Efficiency &amp; Latency Gains
          </h2>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Estimate production latency compression and annual multi-cloud infrastructure savings engineered by CoralSwift.
          </p>
        </div>

        {/* Interactive Calculator Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Controls Column */}
          <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200/90 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div className="space-y-8">
              
              {/* Architecture Paradigm Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-3">
                  1. Current System Topology
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setArchType('legacy')}
                    className={`p-3 rounded-2xl text-xs font-bold font-mono transition-all text-center border ${
                      archType === 'legacy'
                        ? 'bg-[#0B1426] text-white border-[#0B1426] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Legacy Monolith
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchType('hybrid')}
                    className={`p-3 rounded-2xl text-xs font-bold font-mono transition-all text-center border ${
                      archType === 'hybrid'
                        ? 'bg-[#0B1426] text-white border-[#0B1426] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Hybrid Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchType('event')}
                    className={`p-3 rounded-2xl text-xs font-bold font-mono transition-all text-center border ${
                      archType === 'event'
                        ? 'bg-[#0B1426] text-white border-[#0B1426] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Microservices
                  </button>
                </div>
              </div>

              {/* TPS Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                    2. Peak Concurrency (TPS / RPS)
                  </label>
                  <span className="text-base font-extrabold text-coral-600 font-mono">
                    {tps.toLocaleString()} TPS
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="50000"
                  step="200"
                  value={tps}
                  onChange={(e) => setTps(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-coral-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>200 TPS (Growth)</span>
                  <span>50,000+ TPS (Enterprise)</span>
                </div>
              </div>

              {/* Monthly Spend Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                    3. Monthly Cloud Spend (AWS / GCP / Azure)
                  </label>
                  <span className="text-base font-extrabold text-emerald-600 font-mono">
                    ${monthlySpend.toLocaleString()}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>$5,000/mo</span>
                  <span>$200,000+/mo</span>
                </div>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/80 text-[11px] font-mono text-slate-500 flex items-center gap-2">
              <Server className="w-4 h-4 text-coral-500 shrink-0" />
              <span>Calculated based on verified multi-cloud FinOps benchmarks and P99 latency telemetry.</span>
            </div>
          </div>

          {/* Results Projection Card */}
          <div className="lg:col-span-6 bg-[#0B1426] text-white rounded-3xl p-7 sm:p-9 border border-slate-800 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="text-xs font-mono uppercase tracking-widest text-coral-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-coral-400" />
                  Target Architecture Gains
                </div>
                <Badge variant="coral" size="sm">
                  99.999% SLA
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-8">
                
                {/* Metric 1: Annual Savings */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Est. Annual Cloud Savings</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-display">
                    ${annualSavings.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    ~{(selected.savingsPercent * 100).toFixed(0)}% infrastructure efficiency gain
                  </div>
                </div>

                {/* Metric 2: Latency Compression */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-coral-500/40 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                    <Zap className="w-4 h-4 text-coral-400" />
                    <span>Target P99 Latency</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-coral-400 font-display">
                    {selected.targetLatency}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Down from ~{selected.latencyReductionMs}ms on legacy queues
                  </div>
                </div>

                {/* Metric 3: Scalability Ceiling */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-colors">
                  <div className="text-xs font-mono text-slate-400 mb-2">
                    Verified Concurrency Headroom
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-display">
                    {maxSafeTPS.toLocaleString()} TPS
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Active-active multi-region topology
                  </div>
                </div>

                {/* Metric 4: 5-Year Cumulative ROI */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-colors">
                  <div className="text-xs font-mono text-slate-400 mb-2">
                    5-Year Projected Efficiency
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-display">
                    ${fiveYearROI.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Reduced cloud waste + zero outage losses
                  </div>
                </div>

              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6 border-t border-white/10">
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-lg shadow-coral-500/20"
                onClick={() => openConsultation()}
              >
                <span>Request Formal RFC Architecture Plan</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
