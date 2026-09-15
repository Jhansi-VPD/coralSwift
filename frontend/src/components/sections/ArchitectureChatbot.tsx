'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2,
  PhoneCall,
  Terminal,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConsultation } from '@/components/ui/ConsultationContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionCta?: {
    label: string;
    action: 'consultation' | 'link';
    href?: string;
  };
}

export function ArchitectureChatbot() {
  const { openConsultation } = useConsultation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I am CoralSwift's AI Architecture Assistant. Ask me anything about our zero-downtime cloud migrations, P99 latency guarantees, deterministic AI pipelines, compliance (SOC2/HIPAA), or how our principal squads embed with your team.",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    "How do you guarantee zero-downtime during migrations?",
    "Who owns the intellectual property (IP)?",
    "How are SOC2 and HIPAA compliance enforced?",
    "What are your typical squad engagement models?",
    "Can you build deterministic custom RAG pipelines?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Knowledge base responses
  const getBotResponse = (query: string): { text: string; actionCta?: Message['actionCta'] } => {
    const q = query.toLowerCase();

    if (q.includes('downtime') || q.includes('migration') || q.includes('zero') || q.includes('sla')) {
      return {
        text: "We engineer active-active multi-region topologies with automated canary traffic routing (via Istio/Envoy service mesh) and dual-write database replication. Cutovers occur in phased percentage waves (10% -> 25% -> 50% -> 100%) with continuous telemetry monitoring and automated instant rollback triggers to ensure a 99.999% uptime guarantee.",
        actionCta: { label: "Schedule Architecture Review", action: "consultation" }
      };
    }

    if (q.includes('ip') || q.includes('intellectual property') || q.includes('ownership') || q.includes('source code') || q.includes('code')) {
      return {
        text: "Your enterprise owns 100% of all authored code, architectural RFC blueprints, Terraform IaC repositories, container definitions, and documentation from day one. Commits are pushed directly into your enterprise GitHub/GitLab repositories with transparent history."
      };
    }

    if (q.includes('soc2') || q.includes('hipaa') || q.includes('compliance') || q.includes('security') || q.includes('pci')) {
      return {
        text: "Every system we architect complies with strict defense-in-depth principles: zero-trust network access (ZTNA), automated envelope encryption for data in-transit (TLS 1.3) and at-rest (AES-256), least-privilege IAM matrices, automated vulnerability scanners, and immutable audit logs ready for SOC2 Type II, HIPAA, and ISO 27001 audits.",
        actionCta: { label: "Review Security Specifications", action: "consultation" }
      };
    }

    if (q.includes('rag') || q.includes('ai') || q.includes('llm') || q.includes('machine learning') || q.includes('inference')) {
      return {
        text: "Our Applied AI center of excellence deploys production RAG architectures using hybrid dense/sparse vector search (Qdrant/Pinecone), sub-second inference serving via vLLM/TensorRT-LLM, and deterministic semantic guardrails to eliminate hallucinations and sanitize PII.",
        actionCta: { label: "Discuss Custom AI Pipeline", action: "consultation" }
      };
    }

    if (q.includes('model') || q.includes('engagement') || q.includes('team') || q.includes('embed') || q.includes('pricing') || q.includes('cost') || q.includes('rate')) {
      return {
        text: "Following an initial Technical Discovery & Architecture Audit (3-5 business days), a dedicated pod of Principal Distributed Systems Architects and Staff Engineers embeds directly into your sprints. We operate on sprint milestones with clear RFC deliverables and transparent Git commits.",
        actionCta: { label: "Book Discovery Briefing", action: "consultation" }
      };
    }

    if (q.includes('tps') || q.includes('throughput') || q.includes('latency') || q.includes('speed') || q.includes('performance') || q.includes('kafka')) {
      return {
        text: "We specialize in extreme high-concurrency systems. For Apex Financial Global, we engineered a CQRS Kafka core processing 42,000+ TPS with an 18ms P99 settlement latency—down from 4.2 seconds on their legacy database.",
        actionCta: { label: "Read Apex Financial Case Study", action: "link", href: "/case-studies/fintech-payment-processing-core" }
      };
    }

    return {
      text: `CoralSwift specializes in high-concurrency distributed systems, multi-cloud modernization, and applied enterprise AI pipelines. Would you like to review an architectural blueprint or connect directly with a principal engineer?`,
      actionCta: { label: "Speak With Principal Architect", action: "consultation" }
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCta: response.actionCta
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: "Chat cleared! How can I assist with your enterprise engineering roadmap today?",
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <section className="py-24 bg-slate-50/70 border-t border-slate-200/80 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge variant="coral" className="mb-3 font-semibold">
            Interactive Architecture Assistant
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
            Ask CoralSwift Engineering AI
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Instant insights on zero-downtime migrations, P99 latency guarantees, SOC2 compliance, and enterprise delivery models.
          </p>
        </div>

        {/* Chatbot Interface Window */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[580px]">
          
          {/* Chat Header Bar */}
          <div className="bg-[#0B1426] px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-coral-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-display flex items-center gap-2">
                  <span>CoralSwift Architecture Bot</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Trained on Verified Enterprise RFCs &amp; SLA Blueprints
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono flex items-center gap-1.5"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#FAFBFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-coral-500 text-white shadow-xs'
                      : 'bg-[#0B1426] text-white shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-coral-400" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-coral-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Inline Action CTA if available */}
                  {msg.actionCta && (
                    <div className="pt-1">
                      {msg.actionCta.action === 'consultation' ? (
                        <button
                          type="button"
                          onClick={() => openConsultation()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-coral-50 border border-coral-200 text-coral-700 hover:bg-coral-500 hover:text-white hover:border-coral-500 text-xs font-semibold font-mono transition-all shadow-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{msg.actionCta.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <a
                          href={msg.actionCta.href || '/case-studies'}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-xs font-semibold font-mono transition-all shadow-xs"
                        >
                          <span>{msg.actionCta.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[10px] font-mono text-slate-400 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] items-center">
                <div className="w-8 h-8 rounded-xl bg-[#0B1426] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-coral-400" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel Bar */}
          <div className="px-5 py-2.5 bg-slate-50/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-coral-500" />
              Suggested:
            </span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1 rounded-full bg-white hover:bg-coral-50 hover:border-coral-300 border border-slate-200 text-slate-600 hover:text-coral-700 text-xs font-mono font-medium transition-all shrink-0 shadow-2xs whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about zero-downtime, Kafka P99 latency, SOC2, or engagement model..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:bg-white transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputValue.trim()}
              className="rounded-2xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

        </div>

      </div>
    </section>
  );
}
