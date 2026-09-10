import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getJobs } from '@/lib/api';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Building2,
  HeartHandshake,
  Globe,
  Award,
  GraduationCap,
  Laptop
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Careers & Engineering Roles | CoralSwift',
  description: 'Join CoralSwift as a principal engineer, cloud architect, or AI specialist. Build high-concurrency systems for global enterprises.'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CareersPage() {
  const jobs = await getJobs('active');

  const perks = [
    { 
      title: 'Remote-First Culture', 
      desc: 'Work from anywhere with top-tier hardware and a $3,000 home office stipend.',
      icon: <Globe className="w-6 h-6 text-coral-500" />,
      color: 'bg-coral-500/10 text-coral-600 border-coral-200'
    },
    { 
      title: 'Principal-Level Impact', 
      desc: 'Collaborate directly with enterprise leadership and architect high-scale distributed backends.',
      icon: <Award className="w-6 h-6 text-rose-500" />,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200'
    },
    { 
      title: 'Comprehensive Benefits', 
      desc: '100% health/dental coverage, 401(k) matching, and unlimited PTO with mandatory minimums.',
      icon: <HeartHandshake className="w-6 h-6 text-indigo-500" />,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
    },
    { 
      title: 'Continuous Growth', 
      desc: '$5,000 annual budget for conferences, technical research, and certifications.',
      icon: <GraduationCap className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    }
  ];

  return (
    <div className="pt-28 pb-20 bg-enterprise-canvas">
      {/* Page Header */}
      <section className="py-16 bg-white border-b border-slate-200/80 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              We Are Hiring
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              Build Systems That Power{' '}
              <span className="text-gradient-coral">Global Commerce</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Join an elite consultancy of distributed systems architects, cloud platform engineers, and applied AI specialists. We tackle high-concurrency challenges with extreme architectural rigor.
            </p>
          </div>
        </div>
      </section>

      {/* Perks Grid with Interactive Hover Animations */}
      <section className="py-14 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, idx) => (
              <div 
                key={idx} 
                className="glass-card-light group rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-coral-300 cursor-default"
              >
                {/* Top Accent Gradient Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-coral-500 via-rose-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon Container with Scale and Bounce effect */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md ${perk.color}`}>
                  {perk.icon}
                </div>

                <h4 className="text-base font-bold text-[#0B1426] font-display mb-2 group-hover:text-coral-600 transition-colors">
                  {perk.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions List with Rich Interactive Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1426] font-display">
                Active Openings ({jobs.length})
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore open engineering and architecture roles across our practices.
              </p>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-[#0B1426] mb-2 font-display">
                No Active Openings Currently
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                We are not actively recruiting for open roles right now, but we are always excited to connect with exceptional distributed systems engineers, cloud architects, and AI specialists.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-coral-500 text-white font-semibold text-sm shadow-md shadow-coral-500/20 hover:bg-coral-600 transition-all duration-300"
              >
                <span>Get in Touch with Talent Team</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/careers/${job.slug || job.id}`}
                  className="glass-card-light glass-card-hover rounded-2xl p-7 sm:p-8 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-coral-300 relative overflow-hidden block"
                >
                  {/* Left vertical accent on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-coral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="max-w-2xl pl-1">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="blue" size="sm">
                        {job.department}
                      </Badge>
                      <Badge variant="indigo" size="sm">
                        {job.work_model}
                      </Badge>
                      <Badge variant="slate" size="sm">
                        {job.experience_level}
                      </Badge>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B1426] group-hover:text-coral-600 transition-colors font-display mb-2">
                      {job.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {job.short_description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-coral-600" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3 self-start lg:self-center pt-2 lg:pt-0">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-500 text-white font-semibold text-xs shadow-md shadow-coral-500/20 group-hover:bg-coral-600 group-hover:shadow-lg transition-all duration-300">
                      <span>View Role & Apply</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

