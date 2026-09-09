'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  X, 
  MessageSquare,
  ChevronDown,
  PhoneCall,
  ChevronRight
} from 'lucide-react';
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

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const { openConsultation } = useConsultation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hi! I'm CoralSwift's AI Architecture Assistant. Ask me anything about our 99.999% uptime migrations, Kafka P99 latency, SOC2 compliance, or team onboarding.",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    "How do you guarantee zero-downtime?",
    "Who owns the source code / IP?",
    "How are SOC2 and HIPAA enforced?",
    "What are your team engagement models?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [isOpen, messages, isTyping]);

  const getBotResponse = (query: string): { text: string; actionCta?: Message['actionCta'] } => {
    const q = query.toLowerCase().trim();

    // 1. Greetings & Intro
    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|what\s*can\s*you\s*do)/i.test(q)) {
      return {
        text: "Hello! I am CoralSwift's AI Architecture Assistant. I can answer questions about:\n\n• Why choose CoralSwift vs other consultancies\n• 99.999% SLA & zero-downtime migrations\n• Applied AI & deterministic RAG pipelines\n• Full 100% IP & source code ownership\n• Team embedding models & pricing structure\n\nWhat would you like to explore?",
        actionCta: { label: "Explore Capabilities", action: "consultation" }
      };
    }

    // 2. Why Choose CoralSwift / Why Need This / Benefits
    if (q.includes('why') || q.includes('choose') || q.includes('need') || q.includes('benefit') || q.includes('advantage') || q.includes('differen')) {
      return {
        text: "Here is why leading enterprises choose CoralSwift:\n\n1. 99.999% SLA Guarantee: Active-active topologies and canary routing ensure zero customer disruption.\n2. Senior Staff & Principal Only: We don't bill for junior bench learning on your dime. You work with vetted systems architects.\n3. 100% IP Sovereignty: You own every line of code, RFC, and Terraform blueprint from day one.\n4. Official VPD Partnership: Co-engineered enterprise modernization backed by global alliance standards.\n5. Deterministic AI: Guardrailed RAG architectures that prevent LLM hallucinations.",
        actionCta: { label: "Schedule Architecture Review", action: "consultation" }
      };
    }

    // 3. Services & Capabilities
    if (q.includes('service') || q.includes('capabilit') || q.includes('offer') || q.includes('what do you do') || q.includes('solution')) {
      return {
        text: "CoralSwift delivers 6 core enterprise engineering capabilities:\n\n1. Cloud Modernization (Kubernetes, AWS/GCP, multi-cloud active-active)\n2. Applied AI & LLMs (Deterministic RAG, GPU inference, guardrails)\n3. DevSecOps & Platform (GitOps, Terraform IaC, automated CI/CD)\n4. Distributed Systems (High-throughput CQRS, Kafka, Go/Rust microservices)\n5. Enterprise Data Engineering (Sub-millisecond data lakes & stream processing)\n6. Zero-Trust Security (SOC2 Type II, HIPAA, ZTNA)",
        actionCta: { label: "Review All Services", action: "link", href: "/services" }
      };
    }

    // 4. Zero-Downtime Migrations & SLAs
    if (q.includes('downtime') || q.includes('migration') || q.includes('zero') || q.includes('sla') || q.includes('uptime') || q.includes('latency') || q.includes('failover')) {
      return {
        text: "We engineer active-active multi-region topologies with automated canary traffic routing (via Istio/Envoy) and dual-write database replication. Cutovers occur in phased waves (10% -> 25% -> 50% -> 100%) with automated instant rollback triggers to guarantee 99.999% uptime and sub-20ms P99 latency.",
        actionCta: { label: "Schedule Architecture Review", action: "consultation" }
      };
    }

    // 5. Code Ownership & IP
    if (q.includes('ip') || q.includes('intellectual property') || q.includes('ownership') || q.includes('code') || q.includes('github') || q.includes('license')) {
      return {
        text: "Your enterprise owns 100% of all authored code, architectural RFC blueprints, Terraform IaC repositories, and documentation from day one. Commits are pushed directly into your enterprise GitHub/GitLab repositories with complete transparency."
      };
    }

    // 6. Security, Compliance & Privacy
    if (q.includes('soc2') || q.includes('hipaa') || q.includes('compliance') || q.includes('security') || q.includes('zero-trust') || q.includes('privacy') || q.includes('audit')) {
      return {
        text: "Every system complies with defense-in-depth principles: zero-trust network access (ZTNA), automated envelope encryption for data in-transit (TLS 1.3) and at-rest (AES-256), least-privilege IAM, automated vulnerability scans, and immutable audit logs.",
        actionCta: { label: "Review Security Specifications", action: "consultation" }
      };
    }

    // 7. Applied AI & LLMs / RAG
    if (q.includes('rag') || q.includes('ai') || q.includes('llm') || q.includes('inference') || q.includes('vector') || q.includes('qdrant') || q.includes('hallucination')) {
      return {
        text: "We deploy production RAG architectures using hybrid vector search (Qdrant), sub-second inference serving via vLLM, and deterministic semantic guardrails to eliminate hallucinations and sanitize PII for regulatory compliance.",
        actionCta: { label: "Discuss Custom AI Pipeline", action: "consultation" }
      };
    }

    // 8. Engagement Models & How We Work
    if (q.includes('model') || q.includes('engagement') || q.includes('team') || q.includes('embed') || q.includes('how do you work') || q.includes('process') || q.includes('onboard')) {
      return {
        text: "Following an initial Technical Discovery & Architecture Audit (3-5 business days), a dedicated pod of Principal Distributed Systems Architects and Staff Engineers embeds directly into your sprints with clear RFC milestones and transparent sprint tracking.",
        actionCta: { label: "Book Discovery Briefing", action: "consultation" }
      };
    }

    // 9. Pricing & Costs
    if (q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('rate') || q.includes('fee') || q.includes('budget')) {
      return {
        text: "We offer tailored enterprise engagement models:\n\n1. Fixed-Scope Discovery & RFC Audit (3-5 business days)\n2. Dedicated Principal Engineering Squads (Monthly sprint-based retainer)\n3. Critical System Migration & Cutover SOWs with verified SLA delivery milestones.",
        actionCta: { label: "Request Custom SOW Estimate", action: "consultation" }
      };
    }

    // 10. VPD Technologies Partnership
    if (q.includes('vpd') || q.includes('partner') || q.includes('alliance')) {
      return {
        text: "CoralSwift is officially partnered with VPD Technologies to co-deliver accelerated enterprise modernization, resilient zero-trust platforms, and high-performance engineering infrastructure globally.",
        actionCta: { label: "Explore Partnership Solutions", action: "consultation" }
      };
    }

    // 11. Contact & Corporate Office
    if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('address') || q.includes('location') || q.includes('office') || q.includes('reach')) {
      return {
        text: "You can reach our leadership team directly:\n\n• Email: info@coralswift.com\n• Phone: +1 (307) 216-5154\n• Corporate Office: 30 N Gould St Ste #62633, Sheridan, WY 82801, United States",
        actionCta: { label: "Open Contact Form", action: "link", href: "/contact" }
      };
    }

    // 12. Careers & Hiring
    if (q.includes('career') || q.includes('job') || q.includes('hiring') || q.includes('apply') || q.includes('work with') || q.includes('role')) {
      return {
        text: "We are currently hiring Principal Distributed Systems Architects and Lead Platform Engineers. We offer competitive compensation, remote-first global teams, and cutting-edge engineering challenges.",
        actionCta: { label: "View Open Roles", action: "link", href: "/careers" }
      };
    }

    // 13. Case Studies & Proof
    if (q.includes('case study') || q.includes('case studies') || q.includes('client') || q.includes('proof') || q.includes('portfolio') || q.includes('project')) {
      return {
        text: "Our verified engineering case studies include:\n\n• Tier-1 FinTech: 42,000+ TPS CQRS trading ledger\n• Fortune 500 Retail: Zero-downtime cloud migration during Black Friday\n• HealthTech: Sub-second deterministic AI diagnostic pipeline (HIPAA compliant)",
        actionCta: { label: "View Verified Case Studies", action: "link", href: "/case-studies" }
      };
    }

    // 14. Intelligent Contextual Fallback
    return {
      text: `Regarding "${query.trim()}": CoralSwift specializes in mission-critical distributed systems, zero-downtime multi-cloud modernization, and applied generative AI pipelines. Would you like to review an architectural RFC blueprint or speak with a principal engineer?`,
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Popup Window */}
      {isOpen && (
        <div className="mb-4 w-[92vw] sm:w-[410px] h-[530px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-[#0B1426] px-5 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-coral-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-display flex items-center gap-1.5">
                  <span>Architecture AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Verified Enterprise RFC Blueprints
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFBFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[90%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-coral-500 text-white shadow-xs'
                      : 'bg-[#0B1426] text-white shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-coral-400" />}
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-coral-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {msg.actionCta && (
                    <div className="pt-0.5">
                      {msg.actionCta.action === 'consultation' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            openConsultation();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-coral-50 border border-coral-200 text-coral-700 hover:bg-coral-500 hover:text-white hover:border-coral-500 text-[11px] font-semibold font-mono transition-all shadow-xs"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{msg.actionCta.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <a
                          href={msg.actionCta.href || '/case-studies'}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white text-[11px] font-semibold font-mono transition-all shadow-xs"
                        >
                          <span>{msg.actionCta.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[9px] font-mono text-slate-400 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%] items-center">
                <div className="w-7 h-7 rounded-lg bg-[#0B1426] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-coral-400" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-coral-50 hover:border-coral-300 border border-slate-200 text-slate-600 hover:text-coral-700 text-[11px] font-mono transition-all shrink-0 whitespace-nowrap shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a technical question..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:bg-white transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputValue.trim()}
              className="rounded-xl px-3 py-2"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>

        </div>
      )}

      {/* Floating Chatbot Launch Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-coral-500 via-rose-500 to-indigo-600 text-white shadow-2xl shadow-coral-500/30 hover:shadow-coral-500/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/80 cursor-pointer"
        aria-label="Open AI Architecture Chatbot"
      >
        {/* Soft Radial Ambient Halo Glow */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-coral-500 to-rose-500 opacity-40 group-hover:opacity-80 blur-md transition-opacity duration-300 pointer-events-none" />

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 rotate-0 group-hover:rotate-90" />
          ) : (
            <Bot className="w-7 h-7 transition-transform duration-200 group-hover:scale-110" />
          )}
        </div>

        {/* Unread live indicator pulse dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}
