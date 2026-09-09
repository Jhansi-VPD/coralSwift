'use client';

import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  FileCode2,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function CodePreviewTabs() {
  const [activeTab, setActiveTab] = useState<'terraform' | 'golang' | 'python' | 'typescript'>('terraform');
  const [copied, setCopied] = useState(false);

  const snippets = {
    terraform: {
      lang: 'HCL / Terraform',
      filename: 'multi_cloud_mesh.tf',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      code: `# CoralSwift Multi-Cloud Enterprise Mesh Definition
module "zero_trust_kubernetes_cluster" {
  source  = "coralswift/mesh/aws-gcp"
  version = "3.2.0"

  regions = ["us-east-1", "europe-west1"]
  topology = "active-active-canary"

  node_groups = {
    inference_gpu = {
      instance_type = "g5.2xlarge"
      min_size      = 2
      max_size      = 16
      autoscaling_metric = "p99_latency_ms"
    }
  }

  security_posture = {
    zero_trust_ingress   = true
    tls_termination      = "TLS_1_3"
    soc2_compliance_pack = true
  }
}`
    },
    golang: {
      lang: 'Go 1.23',
      filename: 'distributed_ledger.go',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      code: `package ledger

import (
    "context"
    "github.com/coralswift/cqrs-core/v2"
)

// ProcessFinancialSettlement executes idempotent, multi-region ledger mutation
func (e *SettlementEngine) ProcessFinancialSettlement(ctx context.Context, tx *Transaction) (*Receipt, error) {
    lockKey := tx.IdempotencyKey()
    if err := e.redisCluster.AcquireLease(ctx, lockKey, 5*time.Second); err != nil {
        return nil, cqrs.ErrConcurrentExecution
    }
    defer e.redisCluster.ReleaseLease(ctx, lockKey)

    // Parallel deterministic consensus across write-replicas
    return e.raftLeader.CommitWithSLA(ctx, tx, 20*time.Millisecond)
}`
    },
    python: {
      lang: 'Python / PyTorch',
      filename: 'rag_guardrails.py',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      code: `from coralswift_ai.guardrails import EnterprisePIIRedactor, SemanticJudge
from coralswift_ai.retrieval import HybridQdrantReranker

class DeterministicRAGPipeline:
    def __init__(self):
        self.redactor = EnterprisePIIRedactor(strict_mode=True)
        self.retriever = HybridQdrantReranker(top_k=8, dense_weight=0.7)
        self.judge = SemanticJudge(min_hallucination_score=0.98)

    async def execute_safe_synthesis(self, user_query: str, client_context: dict):
        sanitized_query = await self.redactor.mask_sensitive_entities(user_query)
        evidence_chunks = await self.retriever.fetch_verified_corpus(sanitized_query)
        
        # Verify deterministic citation compliance before output
        return await self.judge.synthesize_grounded_response(evidence_chunks)`
    },
    typescript: {
      lang: 'TypeScript / Node',
      filename: 'zero_trust_gateway.ts',
      icon: <FileCode2 className="w-4 h-4 text-blue-400" />,
      code: `import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtZeroTrust, rateLimitTenant } from '@coralswift/security-core';

export async function middleware(req: NextRequest) {
  const token = req.headers.get('x-enterprise-auth-token');
  const tenantId = req.headers.get('x-tenant-id');

  const authSession = await verifyJwtZeroTrust(token, {
    requireMfa: true,
    allowedScopes: ['enterprise:read', 'enterprise:mutate']
  });

  if (!authSession.valid) {
    return new NextResponse('Unauthorized Zero-Trust Boundary', { status: 401 });
  }

  // Sub-millisecond token-bucket tenant throttling
  await rateLimitTenant(tenantId, { burstTps: 5000 });
  return NextResponse.next();
}`
    }
  };

  const current = snippets[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Badge variant="indigo" className="mb-3 font-semibold">
              Production Architecture Specifications
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] tracking-tight font-display">
              Enterprise Engineering Blueprints
            </h2>
            <p className="mt-3 text-slate-600 text-base max-w-2xl leading-relaxed">
              Explore real-world infrastructure blueprints, distributed consensus engines, and deterministic AI pipelines delivered to our clients.
            </p>
          </div>
        </div>

        {/* Code Terminal Box */}
        <div className="rounded-3xl bg-[#0B1426] border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Top Tabs Bar */}
          <div className="bg-[#060B14] px-5 py-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('terraform')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'terraform'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Multi-Cloud IaC</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('golang')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'golang'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Go Distributed Core</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'python'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI RAG Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('typescript')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === 'typescript'
                    ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero-Trust Gateway</span>
              </button>
            </div>

            {/* Right Meta & Copy Button */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-[11px] font-mono text-slate-400">
                {current.filename}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 text-xs font-mono transition-colors border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Spec'}</span>
              </button>
            </div>

          </div>

          {/* Code Area */}
          <div className="p-6 sm:p-8 bg-[#040812] overflow-x-auto">
            <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
              <code>{current.code}</code>
            </pre>
          </div>

          {/* Bottom Verification Note */}
          <div className="px-6 py-3 bg-[#060B14] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standardized under CoralSwift Architecture RFC 2026-B.</span>
            </div>
            <span>Language: {current.lang}</span>
          </div>

        </div>

      </div>
    </section>
  );
}
