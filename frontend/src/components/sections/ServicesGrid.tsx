'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cloud, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Database, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Service } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface ServicesGridProps {
  services: Service[];
  title?: string;
  subtitle?: string;
  limit?: number;
  cardVariant?: 'default' | 'compact';
}

const iconMap: Record<string, React.ReactNode> = {
  Cloud: <Cloud className="w-6 h-6 text-coral-500" />,
  Cpu: <Cpu className="w-6 h-6 text-rose-500" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
  Layers: <Layers className="w-6 h-6 text-indigo-500" />,
  Database: <Database className="w-6 h-6 text-amber-500" />,
  Lock: <Lock className="w-6 h-6 text-purple-500" />,
};

export function ServicesGrid({ 
  services, 
  title = "Enterprise Software Capabilities", 
  subtitle = "End-to-end engineering excellence across modern cloud, artificial intelligence, and high-concurrency distributed architectures.",
  limit,
  cardVariant = 'default'
}: ServicesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category === selectedCategory);

  const displayServices = limit ? filteredServices.slice(0, limit) : filteredServices;

  return (
    <section className="py-24 relative bg-[#FAFBFC] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              Software Services & Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
              {title}
            </h2>
            <p className="mt-3 text-slate-600 text-base leading-relaxed">
              {subtitle}
            </p>
          </div>

          {limit && services.length > limit && (
            <Link 
              href="/services" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-coral-600 hover:text-coral-700 transition-colors group self-start md:self-auto"
            >
              <span>Explore All Capabilities</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Category Pill Filter */}
        {!limit && (
          <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-slate-200">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B1426] text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="glass-card-light glass-card-hover rounded-2xl p-8 flex flex-col justify-between h-full group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-coral-200"
            >
              {/* Subtle top ambient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-coral-500 via-rose-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Header Icon + Category Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      {iconMap[service.icon] || <Cpu className="w-6 h-6 text-coral-500" />}
                    </div>
                    <Badge variant="slate" size="sm">
                      {service.category}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#0B1426] group-hover:text-coral-600 transition-colors font-display mb-3 min-h-[3.25rem] flex items-center">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm text-slate-600 leading-relaxed line-clamp-3 ${
                    cardVariant === 'compact' ? '' : 'mb-6 min-h-[4.25rem]'
                  }`}>
                    {service.short_description}
                  </p>
                </div>

                {/* Capabilities list */}
                {cardVariant !== 'compact' && (
                  <div className="space-y-2.5 mb-6 pt-5 border-t border-slate-100 mt-auto min-h-[7.5rem]">
                    {service.capabilities.slice(0, 3).map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="font-medium line-clamp-2">{cap}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Link */}
              {cardVariant !== 'compact' && (
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <div className="inline-flex items-center justify-between w-full text-xs font-mono font-bold text-coral-600 group-hover:text-coral-700 transition-colors">
                    <span>Explore Deliverables & RFC</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
