'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Phone, Shield, Github, Linkedin, Twitter, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <footer className="bg-gradient-to-b from-[#0B192C] via-[#0A1424] to-[#060D17] border-t border-blue-900/50 pt-8 pb-6 relative overflow-hidden text-slate-300">
      {/* Ambient Radial Glows */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-6 border-b border-blue-900/50">
          
          {/* Brand & Overview */}
          <div className="lg:col-span-2 flex flex-col gap-3.5">
            <div className="flex flex-col gap-2.5">
              <Link href="/" className="inline-block bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-md w-fit transition-transform hover:scale-[1.01]">
                <Logo size="md" showSponsored={false} showTagline={true} />
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Officially Partnered by</span>
                <span className="font-semibold text-slate-200 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs">
                  VPD Technologies
                </span>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed mt-1">
              Next-generation enterprise software engineering consultancy. We engineer mission-critical cloud architectures, applied AI pipelines, and high-throughput distributed systems for global leaders.
            </p>

            <div className="flex items-center gap-3 mt-3">
              <a
                href="https://linkedin.com/company/coralswift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-2xs flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
                aria-label="CoralSwift on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/coralswift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-2xs flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
                aria-label="CoralSwift on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/coralswift"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-2xs flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
                aria-label="CoralSwift on X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Solutions / Services */}
          <div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-blue-200 mb-4">
              Software Services
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/services/cloud-architecture-modernization" className="hover:text-blue-400 font-medium transition-colors">
                  Cloud Modernization
                </Link>
              </li>
              <li>
                <Link href="/services/ai-applied-machine-learning" className="hover:text-blue-400 font-medium transition-colors">
                  Applied AI & LLMs
                </Link>
              </li>
              <li>
                <Link href="/services/enterprise-devsecops-platform-engineering" className="hover:text-blue-400 font-medium transition-colors">
                  DevSecOps & Platform
                </Link>
              </li>
              <li>
                <Link href="/services/distributed-systems-microservices" className="hover:text-blue-400 font-medium transition-colors">
                  Distributed Systems
                </Link>
              </li>
              <li>
                <Link href="/services/enterprise-data-engineering-analytics" className="hover:text-blue-400 font-medium transition-colors">
                  Data Engineering
                </Link>
              </li>
              <li>
                <Link href="/services/cybersecurity-zero-trust-architecture" className="hover:text-blue-400 font-medium transition-colors">
                  Zero-Trust Defense
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-blue-200 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/about" className="hover:text-blue-400 font-medium transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="hover:text-blue-400 font-medium transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-blue-400 font-medium transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 font-medium transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 font-medium transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Office */}
          <div>
            <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-blue-200 mb-4">
              Corporate Office
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">30 N Gould St Ste #62633<br />Sheridan, WY 82801<br />United States</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:info@coralswift.com" className="hover:text-blue-300 font-semibold transition-colors">
                  info@coralswift.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+13072165154" className="hover:text-blue-300 font-semibold transition-colors">
                  +1 (307) 216-5154
                </a>
              </div>
              
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <p>© {new Date().getFullYear()} CoralSwift Technologies Inc. • Officially Partnered by VPD Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-blue-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-blue-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
