'use client';

import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Globe2, 
  Cpu, 
  Layers, 
  Database, 
  TrendingUp,
  CreditCard,
  Truck,
  HeartPulse
} from 'lucide-react';

export function ClientLogoMarquee() {
  const clients = [
    { name: 'Apex Financial Global', icon: <CreditCard className="w-5 h-5 text-coral-500" />, sub: 'FinTech & Banking' },
    { name: 'VPD Technologies', icon: <Globe2 className="w-5 h-5 text-indigo-500" />, sub: 'Strategic Partner' },
    { name: 'OmniHealth Systems', icon: <HeartPulse className="w-5 h-5 text-rose-500" />, sub: 'HealthTech Scale' },
    { name: 'Vanguard Logistics', icon: <Truck className="w-5 h-5 text-amber-500" />, sub: 'Global Freight IoT' },
    { name: 'Starlight Retail', icon: <Database className="w-5 h-5 text-emerald-500" />, sub: 'Omnichannel Mesh' },
    { name: 'JurisGlobal Analytics', icon: <Cpu className="w-5 h-5 text-purple-500" />, sub: 'Applied AI & RAG' },
    { name: 'Meridian Capital', icon: <TrendingUp className="w-5 h-5 text-sky-500" />, sub: 'High-Frequency Core' },
  ];

  // Double the array for seamless infinite loop
  const marqueeItems = [...clients, ...clients];

  return (
    <div className="py-12 bg-white border-y border-slate-200/80 overflow-hidden relative">
      {/* Background ambient gradient overlays on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
          Trusted By Engineering Leadership Across High-Concurrency Platforms
        </p>
      </div>

      {/* Auto-Scrolling Continuous Tracks */}
      <div className="marquee-wrapper flex w-full overflow-hidden select-none">
        <div className="animate-marquee-track pr-8">
          {clients.map((client, idx) => (
            <div
              key={`track1-${idx}`}
              className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-xs hover:border-coral-300 hover:bg-white hover:shadow-md transition-all cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:shadow-sm transition-all duration-300">
                {client.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#0B1426] font-display group-hover:text-coral-600 transition-colors whitespace-nowrap">
                  {client.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 font-medium whitespace-nowrap">
                  {client.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="animate-marquee-track pr-8" aria-hidden="true">
          {clients.map((client, idx) => (
            <div
              key={`track2-${idx}`}
              className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-xs hover:border-coral-300 hover:bg-white hover:shadow-md transition-all cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:shadow-sm transition-all duration-300">
                {client.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#0B1426] font-display group-hover:text-coral-600 transition-colors whitespace-nowrap">
                  {client.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 font-medium whitespace-nowrap">
                  {client.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
