'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Layers, 
  FileText, 
  Briefcase, 
  Building2, 
  PhoneCall, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Terminal,
  X
} from 'lucide-react';
import { useConsultation } from '@/components/ui/ConsultationContext';

interface SearchItem {
  id: string;
  title: string;
  category: string;
  url: string;
  icon: React.ReactNode;
  description?: string;
  action?: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { openConsultation } = useConsultation();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const items: SearchItem[] = [
    // Capabilities
    {
      id: 's1',
      title: 'Cloud Architecture & Modernization',
      category: 'Services',
      url: '/services/cloud-architecture-modernization',
      icon: <Layers className="w-4 h-4 text-coral-500" />,
      description: 'Multi-cloud, Kubernetes, Terraform IaC, zero-downtime migrations'
    },
    {
      id: 's2',
      title: 'AI & Applied Machine Learning Solutions',
      category: 'Services',
      url: '/services/ai-applied-machine-learning',
      icon: <Layers className="w-4 h-4 text-rose-500" />,
      description: 'Enterprise RAG, custom LLMs, vector search, MLOps guardrails'
    },
    {
      id: 's3',
      title: 'Distributed Systems & Microservices',
      category: 'Services',
      url: '/services/distributed-systems-microservices',
      icon: <Layers className="w-4 h-4 text-indigo-500" />,
      description: 'High-throughput CQRS, Kafka event streaming, sub-20ms P99 latency'
    },
    {
      id: 's4',
      title: 'Cybersecurity & Zero-Trust Architecture',
      category: 'Services',
      url: '/services/cybersecurity-zero-trust-architecture',
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      description: 'ZTNA, defense-in-depth, SOC2 Type II, HIPAA compliance'
    },
    // Case Studies
    {
      id: 'cs1',
      title: 'Next-Gen High-Frequency Payment Processing Core',
      category: 'Case Studies',
      url: '/case-studies/fintech-payment-processing-core',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      description: 'Apex Financial: 42,000+ TPS, 18ms latency, 99.999% uptime'
    },
    {
      id: 'cs2',
      title: 'Autonomous AI Supply Chain Platform',
      category: 'Case Studies',
      url: '/case-studies/autonomous-supply-chain-analytics',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      description: 'Vanguard Logistics: 31% route delay reduction, $14.2M fuel savings'
    },
    {
      id: 'cs3',
      title: 'Zero-Downtime Multi-Cloud for HealthTech',
      category: 'Case Studies',
      url: '/case-studies/healthtech-cloud-modernization',
      icon: <FileText className="w-4 h-4 text-sky-500" />,
      description: 'OmniHealth: 6M+ patient records secured, < 30s disaster recovery'
    },
    // Careers & Navigation
    {
      id: 'c1',
      title: 'Principal Distributed Systems Architect',
      category: 'Careers',
      url: '/careers',
      icon: <Briefcase className="w-4 h-4 text-coral-500" />,
      description: 'San Francisco, CA / Remote ($220k - $280k USD)'
    },
    {
      id: 'c2',
      title: 'Senior Full-Stack Engineer (Next.js & TypeScript)',
      category: 'Careers',
      url: '/careers',
      icon: <Briefcase className="w-4 h-4 text-indigo-500" />,
      description: 'New York, NY / Remote ($160k - $205k USD)'
    },
    {
      id: 'nav1',
      title: 'About CoralSwift & VPD Strategic Alliance',
      category: 'Navigation',
      url: '/about',
      icon: <Building2 className="w-4 h-4 text-slate-500" />
    },
    {
      id: 'act1',
      title: 'Schedule Architecture Review & Consultation',
      category: 'Actions',
      url: '#',
      icon: <PhoneCall className="w-4 h-4 text-coral-500" />,
      action: () => openConsultation()
    },
    {
      id: 'act2',
      title: 'Enterprise Admin Suite & Portal',
      category: 'Actions',
      url: '/admin',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />
    }
  ];

  const filtered = items.filter((item) => {
    const text = `${item.title} ${item.category} ${item.description || ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setQuery('');
    if (item.action) {
      item.action();
    } else if (item.url && item.url !== '#') {
      router.push(item.url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search capabilities, RFC blueprints, case studies, roles (e.g. 'Kafka', 'RAG', 'Cloud')..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              No matching architecture records found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0B1426] group-hover:text-coral-600 transition-colors truncate font-display">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase">
                        {item.category}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-coral-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">↵ Enter</kbd></span>
          <span>Close with <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">Esc</kbd></span>
        </div>

      </div>
    </div>
  );
}
