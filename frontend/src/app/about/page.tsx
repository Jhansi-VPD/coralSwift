import React from 'react';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Users, 
  Award, 
  Globe2, 
  ArrowRight,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ClientLogoMarquee } from '@/components/sections/ClientLogoMarquee';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Enterprise Engineering & Systems Leadership',
  description: 'Learn about CoralSwift mission, verified engineering principles, leadership framework, and enterprise delivery standards.'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AboutPage() {
  const values = [
    {
      title: 'Architectural Rigor',
      description: 'We believe that architectural shortcuts create exponential downstream debt. Every system we design is documented in formal RFCs and verified with stress benchmarks.'
    },
    {
      title: 'Zero-Downtime Guarantee',
      description: 'We engineer migrations and systems with active-active topologies and canary routing so that enterprise operations remain completely uninterrupted.'
    },
    {
      title: 'Transparent Collaboration',
      description: 'Our principal architects embed directly with client engineering squads, providing transparent Git commits, architecture reviews, and knowledge transfer.'
    },
    {
      title: 'Security & Privacy Sovereignty',
      description: 'From zero-trust network policies to strict data isolation, defense-in-depth is our non-negotiable default for every layer of the technology stack.'
    }
  ];

  const milestones = [
    { year: '2020', title: 'Founded in San Francisco', desc: 'Established with a core squad of distributed systems architects.' },
    { year: '2022', title: 'Expanded Multi-Cloud Practice', desc: 'Delivered zero-downtime migrations for Fortune 500 financial and retail enterprises.' },
    { year: '2024', title: 'Applied AI & LLM Center of Excellence', desc: 'Pioneered deterministic RAG pipelines and enterprise GPU inference infrastructure.' },
    { year: '2026', title: 'Global Enterprise Scale', desc: 'Over 100M+ daily transactions processed across client platforms with 99.999% verified uptime.' }
  ];

  return (
    <div className="pt-28 pb-20 bg-enterprise-canvas">
      {/* Header */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              About CoralSwift Technologies
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              Engineering Mission-Critical Systems for the{' '}
              <span className="text-gradient-brand">Global Economy</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              CoralSwift is an enterprise software services consultancy specializing in high-concurrency distributed systems, multi-cloud modernization, and applied generative AI pipelines. We bridge theoretical computer science with resilient, production-grade reality.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white border-y border-slate-200/80 relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Our Mission Card */}
            <div className="glass-card-light group rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-coral-300 cursor-default">
              {/* Top Accent Gradient Border on Hover */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral-500 via-rose-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Subtle radial corner glow on hover */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-coral-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-coral-50 border border-coral-200 flex items-center justify-center mb-6 text-coral-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-coral-100 group-hover:shadow-md">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] font-display mb-3 group-hover:text-coral-600 transition-colors duration-200">
                Our Mission
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                To empower forward-thinking global enterprises to out-innovate their competitors by designing, delivering, and operating ultra-resilient, deterministic software systems that never fail under pressure.
              </p>
            </div>

            {/* Our Vision Card */}
            <div className="glass-card-light group rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-rose-300 cursor-default">
              {/* Top Accent Gradient Border on Hover */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Subtle radial corner glow on hover */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6 text-rose-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-rose-100 group-hover:shadow-md">
                <Globe2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] font-display mb-3 group-hover:text-rose-600 transition-colors duration-200">
                Our Vision
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                To be the world’s most trusted technical authority for mission-critical enterprise platforms, setting the global benchmark for architectural discipline, zero-downtime operations, and ethical AI engineering.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="indigo" className="mb-3 font-semibold">
              Engineering Principles
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] font-display">
              Core Pillars That Guide Our Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div 
                key={i} 
                className="glass-card-light group rounded-2xl p-7 border border-slate-200 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-coral-300 cursor-default"
              >
                {/* Left vertical highlight strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-coral-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-coral-50 text-coral-600 font-mono text-xs font-bold mb-4 border border-coral-200/80 group-hover:scale-110 group-hover:bg-coral-500 group-hover:text-white transition-all duration-300">
                    0{i + 1}
                  </div>
                  <h4 className="text-lg font-bold text-[#0B1426] font-display mb-2 group-hover:text-coral-600 transition-colors">
                    {v.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white border-t border-slate-200/80 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <Badge variant="coral" className="mb-3 font-semibold">
                Our Evolution
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
                Our Journey & Milestones
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-xl mx-auto">
                A timeline of architectural breakthroughs and enterprise engineering impact.
              </p>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-gradient-to-b before:from-coral-500/30 before:via-rose-500/20 before:to-transparent">
              {milestones.map((m, i) => (
                <div 
                  key={i} 
                  className="group flex flex-col sm:flex-row gap-5 sm:gap-6 p-6 sm:p-7 rounded-3xl bg-slate-50/70 border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-coral-300 hover:bg-white cursor-default"
                >
                  {/* Left accent gradient bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-coral-500 via-rose-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Subtle top-right ambient glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-coral-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Year & Icon Pill */}
                  <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-start gap-3">
                    <div className="font-mono text-base sm:text-lg font-extrabold text-coral-600 bg-white group-hover:bg-gradient-to-r group-hover:from-coral-500 group-hover:to-rose-500 group-hover:text-white px-4 py-2 rounded-2xl border border-slate-200/90 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-transparent">
                      {m.year}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-[#0B1426] font-display group-hover:text-coral-600 transition-colors duration-200 mb-1.5">
                      {m.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>

                  {/* Right side next symbol indicator */}
                  <div className="shrink-0 flex items-center self-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-400 group-hover:bg-gradient-to-r group-hover:from-coral-500 group-hover:to-rose-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-md flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Partnership */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300 hover:shadow-xl hover:border-coral-200">
            <div className="max-w-2xl">
              <span className="text-xs font-mono uppercase tracking-wider text-coral-600 font-bold mb-2 block">
                Strategic Global Alliance
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] font-display mb-3">
                Officially Partnered by VPD Technologies
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                CoralSwift is officially partnered with VPD Technologies to co-deliver accelerated enterprise modernization, resilient zero-trust platforms, and high-performance engineering infrastructure across international markets.
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/contact">
                <Button variant="outline" size="md">
                  Explore Partnership Solutions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Client Logos */}
      <ClientLogoMarquee />

      {/* Leadership CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="rounded-3xl bg-[#0B1426] p-10 sm:p-14 text-white border border-slate-800 shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display mb-4">
              Collaborate With Principal Engineers
            </h3>
            <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              Discuss your technical roadmap, legacy bottlenecks, or AI initiative directly with our architecture leadership team.
            </p>
            <Link href="/contact">
              <Button variant="primary" size="md">
                <span>Request Executive Briefing</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
