'use client';

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does CoralSwift guarantee zero-downtime during multi-cloud migrations?",
      a: "We engineer active-active and active-passive disaster recovery topologies with automated canary traffic routing (via Istio/Envoy service mesh) and dual-write database replication. Cutovers occur in phased percentage waves (10% -> 25% -> 50% -> 100%) with continuous telemetry monitoring and automated instant rollback triggers."
    },
    {
      q: "Who owns the Intellectual Property (IP) and source code produced during engagements?",
      a: "The client owns 100% of all authored code, architectural RFCs, Terraform IaC repositories, container definitions, and documentation from day one. Commits are pushed directly into your enterprise GitHub/GitLab repositories with transparent history."
    },
    {
      q: "How are compliance standards (SOC2 Type II, HIPAA, PCI-DSS) enforced?",
      a: "Every architecture blueprint complies with strict defense-in-depth principles: zero-trust network access (ZTNA), automated envelope encryption for data in-transit (TLS 1.3) and at-rest (AES-256), least-privilege IAM matrices, automated vulnerability scanners, and immutable audit logs."
    },
    {
      q: "How quickly can a CoralSwift principal architecture squad embed with our team?",
      a: "Following an initial Technical Discovery & Architecture Audit (typically 3 to 5 business days), a dedicated pod composed of Principal Distributed Systems Architects and Staff Engineers can embed directly into your sprint cycles within 1 to 2 weeks."
    },
    {
      q: "What guardrails are implemented for enterprise Generative AI and custom LLMs?",
      a: "Our Applied AI pipelines incorporate automated PII/PHI redaction layers, vector database tenant isolation, deterministic output schema validation, and semantic hallucination scoring benchmarks before returning generated responses to users."
    }
  ];

  return (
    <section className="py-24 bg-slate-50/70 border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="slate" className="mb-3 font-semibold">
            Enterprise FAQs
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
            Frequently Asked Technical Questions
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Essential operational, architectural, and security considerations for prospective enterprise clients.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-base font-bold text-[#0B1426] font-display">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-coral-50 text-coral-600' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-7 pt-1 sm:px-7 text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 animate-in fade-in-0 duration-200">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
