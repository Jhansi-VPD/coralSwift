'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  Workflow, 
  PackageCheck, 
  HelpCircle, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles, 
  Cpu, 
  Cloud, 
  Database, 
  Lock, 
  Activity, 
  Gauge, 
  Server, 
  ShieldAlert, 
  Network,
  Boxes
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useConsultation } from '@/components/ui/ConsultationContext';
import { Service, CaseStudy } from '@/lib/types';

interface ServiceDetailClientProps {
  service: Service;
  relatedCaseStudies: CaseStudy[];
}

// Tailored service technical profiles & SLA architectures
interface ServiceProfile {
  heroTagline: string;
  architectureType: string;
  slaMetrics: { label: string; value: string; desc: string }[];
  techStack: { category: string; tools: string[] }[];
  codeSample: { filename: string; language: string; code: string };
  rfcDetails: string;
}

const serviceProfiles: Record<string, ServiceProfile> = {
  'cloud-architecture-modernization': {
    heroTagline: 'Zero-Downtime Multi-Cloud Topology & Resilient Foundation',
    architectureType: 'Multi-Region Kubernetes & Infrastructure as Code (IaC)',
    slaMetrics: [
      { label: 'Uptime SLA', value: '99.999%', desc: 'Global multi-region failover' },
      { label: 'RPO / RTO', value: '< 15 sec', desc: 'Continuous replication state' },
      { label: 'FinOps Savings', value: '38% Avg', desc: 'Compute & spot fleet auto-tuning' }
    ],
    techStack: [
      { category: 'Cloud Providers', tools: ['AWS', 'Google Cloud (GCP)', 'Microsoft Azure'] },
      { category: 'Infrastructure as Code', tools: ['Terraform', 'OpenTofu', 'Pulumi', 'Crossplane'] },
      { category: 'Orchestration & Mesh', tools: ['Kubernetes (EKS/GKE)', 'Istio', 'Cilium eBPF'] },
      { category: 'Disaster Recovery', tools: ['Velero', 'AWS Route53 Global', 'Cloudflare Magic WAN'] }
    ],
    codeSample: {
      filename: 'terraform/clusters/production_mesh.tf',
      language: 'hcl',
      code: `module "multi_region_cluster" {
  source             = "git::https://github.com/coralswift/terraform-modules.git//eks-zero-trust"
  cluster_name       = "coralswift-prod-useast1"
  kubernetes_version = "1.30"
  enable_ebpf_cilium = true
  multi_az_subnets   = module.vpc.private_subnets
  
  node_groups = {
    compute_spot = { min_size = 6, max_size = 48, instance_types = ["c6i.2xlarge", "c7g.2xlarge"] }
    stateful_db  = { min_size = 3, max_size = 6,  instance_types = ["r6i.4xlarge"] }
  }
}`
    },
    rfcDetails: `# RFC-01: Multi-Region High Availability Standard
Topology: Dual-Active AWS us-east-1 + eu-west-1
Routing: Anycast Global Latency-based DNS
Data Layer: Aurora Global Database with asynchronous read-replicas (< 100ms lag)`
  },

  'ai-applied-machine-learning': {
    heroTagline: 'Deterministic Enterprise RAG, Custom LLMs & High-Throughput Inference',
    architectureType: 'Hybrid Vector Mesh & Low-Latency LLM Serving',
    slaMetrics: [
      { label: 'P95 Inference', value: '< 45 ms', desc: 'Token streaming latency' },
      { label: 'RAG Precision', value: '99.2%', desc: 'Context relevance & reranking' },
      { label: 'PII Protection', value: '100% Guarded', desc: 'Zero data exfiltration layer' }
    ],
    techStack: [
      { category: 'Model Runtimes', tools: ['vLLM', 'TensorRT-LLM', 'Ollama', 'PyTorch'] },
      { category: 'Vector Indexing', tools: ['Qdrant', 'Pinecone', 'pgvector', 'Milvus'] },
      { category: 'Orchestration & RAG', tools: ['LangChain', 'LlamaIndex', 'DSPy', 'Semantic Kernel'] },
      { category: 'Safety & Guardrails', tools: ['NeMo Guardrails', 'Guardrails AI', 'Presidio PII'] }
    ],
    codeSample: {
      filename: 'services/inference/rag_pipeline.py',
      language: 'python',
      code: `from coralswift_ai.guardrails import EnterpriseSafetyGuard
from coralswift_ai.vector_engine import HybridDenseSparseRetriever
from vllm import AsyncLLMEngine, SamplingParams

retriever = HybridDenseSparseRetriever(index_name="enterprise-corpus-v3")
guardrail = EnterpriseSafetyGuard(redact_pii=True, enforce_rbac=True)

async def generate_grounded_response(user_query: str, tenant_id: str):
    sanitized_prompt = guardrail.filter_input(user_query, tenant=tenant_id)
    relevant_chunks = await retriever.retrieve_with_rerank(sanitized_prompt, top_k=5)
    return await llm_engine.stream_tokens(prompt=sanitized_prompt, context=relevant_chunks)`
    },
    rfcDetails: `# RFC-02: Enterprise AI Safety & Vector Ingestion Standard
Context Window: 128k Tokens with Late Interaction Reranker (ColBERTv2)
Isolation: Multi-tenant tenant-level vector namespace encryption (AES-GCM-256)
Auditability: 100% prompt-response cryptographic hashing into immutable audit storage`
  },

  'enterprise-devsecops-platform-engineering': {
    heroTagline: 'Self-Service Developer Platforms with Policy-as-Code Governance',
    architectureType: 'GitOps Continuous Delivery & Zero-Trust Supply Chain',
    slaMetrics: [
      { label: 'Lead Time', value: '< 12 mins', desc: 'From commit to production rollout' },
      { label: 'Security Gate', value: '100% Automated', desc: 'SAST/DAST & SBOM signing' },
      { label: 'Deployment Success', value: '99.98%', desc: 'Automated canary & rollback' }
    ],
    techStack: [
      { category: 'GitOps & CI/CD', tools: ['ArgoCD', 'GitHub Actions Enterprise', 'GitLab CI', 'Flux'] },
      { category: 'Policy as Code', tools: ['Open Policy Agent (OPA)', 'Kyverno', 'Trivy'] },
      { category: 'Secrets & Identity', tools: ['HashiCorp Vault', 'SPIFFE/SPIRE', 'AWS Secrets Manager'] },
      { category: 'Observability Mesh', tools: ['OpenTelemetry', 'Prometheus', 'Grafana', 'Datadog'] }
    ],
    codeSample: {
      filename: 'gitops/policies/security_gate.rego',
      language: 'rego',
      code: `package enterprise.admission.security

default allow = false

# Enforce non-root containers and signed cosign artifacts
allow {
  input.request.kind.kind == "Deployment"
  not container_runs_as_root(input.request.object)
  has_verified_cosign_signature(input.request.object)
  has_approved_sbom_scan(input.request.object)
}

container_runs_as_root(deployment) {
  some container
  container := deployment.spec.template.spec.containers[_]
  container.securityContext.runAsNonRoot != true
}`
    },
    rfcDetails: `# RFC-03: Golden Path Engineering & Automated Guardrails
Artifact Verification: Sigstore Cosign verification required on all cluster admissions
Release Strategy: Automated Canary Analysis using Prometheus Error Budget thresholds
Ephemeral Staging: Dynamic on-demand PR preview environments with automatic TTL expiry`
  },

  'distributed-systems-microservices': {
    heroTagline: 'Ultra-High Concurrency Microservices & Event-Driven Backends',
    architectureType: 'Event Sourcing, CQRS & Distributed Transaction Engine',
    slaMetrics: [
      { label: 'Peak TPS', value: '500,000+', desc: 'Deterministic sub-millisecond throughput' },
      { label: 'P99 Latency', value: '< 6.8 ms', desc: 'End-to-end API gateway turnaround' },
      { label: 'Data Consistency', value: 'Strict ACID', desc: 'Transactional outbox & distributed sagas' }
    ],
    techStack: [
      { category: 'Languages & Runtimes', tools: ['Go 1.23', 'Rust (Tokio)', 'Node.js / TypeScript'] },
      { category: 'Event Streaming', tools: ['Apache Kafka', 'Redpanda', 'RabbitMQ', 'NATS.io'] },
      { category: 'Data & Cache', tools: ['PostgreSQL 16', 'Redis Cluster', 'CockroachDB', 'Dragonfly'] },
      { category: 'Protocols & RPC', tools: ['gRPC / Protobuf', 'GraphQL Federation', 'HTTP/3'] }
    ],
    codeSample: {
      filename: 'services/order-engine/handler.go',
      language: 'go',
      code: `package engine

import (
  "context"
  "github.com/coralswift/core/events"
  "github.com/coralswift/core/storage"
)

type TransactionEngine struct {
  outbox storage.TransactionalOutbox
  bus    events.StreamProducer
}

func (e *TransactionEngine) ProcessOrderBatch(ctx context.Context, batch []OrderEvent) error {
  return e.outbox.ExecuteTransaction(ctx, func(tx storage.Tx) error {
    for _, order := range batch {
      if err := tx.PersistState(order); err != nil {
        return err
      }
      e.bus.EmitEvent("orders.processed.v1", order.EventID, order)
    }
    return nil
  })
}`
    },
    rfcDetails: `# RFC-04: High-Concurrency Event Streaming & Distributed Sagas
Isolation: Strict distributed locking using Redlock and optimistic concurrency counters
Message Delivery: Exactly-once processing semantics backed by transactional outbox
Partitioning: Consistent hashing ring with automated shard rebalancing`
  },

  'enterprise-data-engineering-analytics': {
    heroTagline: 'Unified Lakehouse Architecture & Real-Time Analytics Mesh',
    architectureType: 'Decentralized Data Mesh with Sub-Second Analytical Queries',
    slaMetrics: [
      { label: 'Ingestion Speed', value: 'Real-time', desc: 'Event stream to queryable analytics in < 2s' },
      { label: 'Query Latency', value: '250 ms', desc: 'Columnar warehouse query response' },
      { label: 'Data Quality', value: '100% Tested', desc: 'Automated dbt schema assertions' }
    ],
    techStack: [
      { category: 'Warehouse & Lakehouse', tools: ['Snowflake', 'ClickHouse', 'Apache Iceberg', 'Databricks'] },
      { category: 'Streaming Engines', tools: ['Apache Flink', 'Apache Spark', 'Kafka Streams'] },
      { category: 'Transformation & Mesh', tools: ['dbt Core', 'Apache Airflow', 'Dagster'] },
      { category: 'BI & Reverse ETL', tools: ['Metabase', 'Tableau', 'Census', 'Hightouch'] }
    ],
    codeSample: {
      filename: 'analytics/models/core/fct_enterprise_revenue.sql',
      language: 'sql',
      code: `{{ config(
    materialized = 'incremental',
    unique_key = 'transaction_id',
    cluster_by = ['event_date', 'organization_id']
) }}

WITH source_events AS (
    SELECT 
        transaction_id,
        organization_id,
        amount_usd,
        processed_timestamp::DATE AS event_date,
        currency,
        status
    FROM {{ ref('stg_payment_events') }}
    {% if is_incremental() %}
        WHERE processed_timestamp >= (SELECT MAX(processed_timestamp) FROM {{ this }})
    {% endif %}
)
SELECT * FROM source_events WHERE status = 'SETTLED';`
    },
    rfcDetails: `# RFC-05: Real-Time Stream Ingestion & Columnar Data Partitioning
Format: Apache Iceberg on S3 with Z-Order indexing and partition pruning
Transformation: Incremental micro-batching via dbt with automated Great Expectations assertions
Governance: Column-level RBAC and automated data catalog lineage updates`
  },

  'cybersecurity-zero-trust-architecture': {
    heroTagline: 'Cryptographic Identity-First Perimeter & Defense-in-Depth',
    architectureType: 'Zero-Trust Network Architecture (ZTNA) & Continuous Compliance',
    slaMetrics: [
      { label: 'Identity Verification', value: '100% mTLS', desc: 'Short-lived X.509 cert validation' },
      { label: 'Threat MTTD', value: '< 60 sec', desc: 'Automated anomaly detection & isolation' },
      { label: 'Compliance Posture', value: 'SOC2 / ISO', desc: 'Continuous evidence collection' }
    ],
    techStack: [
      { category: 'Identity & Secrets', tools: ['HashiCorp Vault', 'SPIFFE/SPIRE', 'Okta / Azure AD'] },
      { category: 'Cloud Security & CSPM', tools: ['Wiz', 'Prisma Cloud', 'Falco Runtime', 'Trivy'] },
      { category: 'Network Security', tools: ['WireGuard', 'Tailscale Enterprise', 'Cloudflare Zero Trust'] },
      { category: 'SIEM & Threat Intel', tools: ['Wazuh', 'Elastic Security', 'Splunk', 'AWS GuardDuty'] }
    ],
    codeSample: {
      filename: 'security/spiffe/workload_attestation.yaml',
      language: 'yaml',
      code: `apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterSPIFFEID
metadata:
  name: coralswift-secure-workload
spec:
  spiffeIDTemplate: "spiffe://coralswift.internal/ns/{{ .PodMeta.Namespace }}/sa/{{ .PodSpec.ServiceAccountName }}"
  podSelector:
    matchLabels:
      security.coralswift.com/zero-trust: "enforced"
  ttl: "1h"
  jwtTTL: "15m"`
    },
    rfcDetails: `# RFC-06: Cryptographic Workload Attestation & Key Management
Attestation: Hardware-backed SPIFFE identity generation with 1-hour automated rotation
Secrets: Envelope encryption with hardware security modules (HSM) and strict zero-standing-privilege
Runtime Defense: eBPF-based kernel system call filtering and automated anomalous container termination`
  }
};

export function ServiceDetailClient({ service, relatedCaseStudies }: ServiceDetailClientProps) {
  const { openConsultation } = useConsultation();
  const [rfcModalOpen, setRfcModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Retrieve service specific profile or fallback to defaults
  const profile = serviceProfiles[service.slug] || {
    heroTagline: 'Enterprise-Grade Software Architecture & Engineering',
    architectureType: 'Cloud-Native & Distributed High-Resilience Systems',
    slaMetrics: [
      { label: 'Availability', value: '99.99%', desc: 'Production SLA commitment' },
      { label: 'P99 Latency', value: '< 25 ms', desc: 'Target turnaround time' },
      { label: 'Zero Trust', value: '100% Enforced', desc: 'Strict security isolation' }
    ],
    techStack: [
      { category: 'Core Stack', tools: ['Next.js', 'Node.js', 'PostgreSQL', 'Docker'] },
      { category: 'Cloud & Mesh', tools: ['AWS', 'Kubernetes', 'Terraform', 'Datadog'] }
    ],
    codeSample: {
      filename: 'architecture/specification.yaml',
      language: 'yaml',
      code: `service_name: ${service.slug}\nstatus: production_ready\nsla: 99.99%\ncompliance: [SOC2, ISO27001]`
    },
    rfcDetails: `# RFC: ${service.title}\nDomain: ${service.category}\nStatus: PRODUCTION READY`
  };

  const rfcSnippet = `# CoralSwift Architecture RFC: ${service.title}
Version: 2.6-LTS
Domain: ${service.category}
Architecture Type: ${profile.architectureType}
Compliance: SOC2 Type II, ISO27001, HIPAA Certified
Status: APPROVED & PRODUCTION READY

## Executive Summary
${service.short_description}

## In-Depth Overview
${service.overview}

## Core Capabilities & Deliverables
${service.capabilities.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Target Production SLAs & Benchmarks
${profile.slaMetrics.map(m => `- ${m.label}: ${m.value} (${m.desc})`).join('\n')}

## Phased Delivery Framework
${service.approach ? service.approach.map(a => `[${a.step || 'PHASE'}] ${a.phase}: ${a.description}`).join('\n') : 'Standard 4-Wave Migration Framework'}

## Concrete Handover Artifacts
${service.deliverables ? service.deliverables.map(d => `- ${d}`).join('\n') : '- Full production codebase & IaC blueprints'}

${profile.rfcDetails}`;

  const handleCopyRFC = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rfcSnippet);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = rfcSnippet;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Primary copy failed, executing fallback:', e);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = rfcSnippet;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }
  };

  const handleDownloadRFC = () => {
    try {
      const blob = new Blob([rfcSnippet], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `coralswift-rfc-${service.slug || 'baseline'}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to download RFC file:', err);
    }
  };

  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
          <Link href="/" className="hover:text-coral-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/services" className="hover:text-coral-600 transition-colors">Services</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-coral-600 truncate max-w-xs">{service.title}</span>
        </nav>
      </div>

      {/* Hero Header */}
      <section className="py-14 bg-white border-b border-slate-200/80 relative overflow-hidden">
        {/* Subtle background ambient mesh glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="coral" className="font-semibold px-3 py-1">
                {service.category}
              </Badge>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-bold">
                {profile.architectureType}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-4">
              {service.title}
            </h1>
            
            <p className="text-sm font-mono text-coral-600 font-bold uppercase tracking-wide mb-4">
              {profile.heroTagline}
            </p>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {service.short_description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                variant="primary" 
                size="md"
                onClick={() => openConsultation(service.title)}
                className="shadow-lg shadow-coral-500/20"
              >
                <span>{service.cta_text || 'Schedule Architecture Review'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button 
                variant="secondary" 
                size="md"
                onClick={() => setRfcModalOpen(true)}
              >
                <FileText className="w-4 h-4 mr-1.5 text-coral-600" />
                <span>View Architecture RFC Baseline</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Production SLA & Engineering Target Metrics Bar */}
      <div className="bg-[#0B1426] text-white border-y border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {profile.slaMetrics.map((sla, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 enterprise-dark-card-interactive cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-coral-500/20 text-coral-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight">{sla.value}</div>
                  <div className="text-xs font-bold text-coral-400 uppercase tracking-wider">{sla.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sla.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Top Grid: Overview + Sidebar Consultation Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Architectural Scope & Overview (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm interactive-card h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-wider text-coral-600 font-bold">
                <Layers className="w-4 h-4" />
                <span>Architectural Overview</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1426] font-display mb-4">
                Service Scope & Engineering Context
              </h2>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {service.overview}
              </p>
            </div>
            
            {service.requirements && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                <HelpCircle className="w-4 h-4 text-coral-600 shrink-0" />
                <span><strong>Engagement Note:</strong> {service.requirements}</span>
              </div>
            )}
          </div>

          {/* Right Sidebar: Consultation + Case Studies (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Consultation Card */}
            <div className="bg-[#0B1426] text-white rounded-3xl p-7 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/10 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg font-bold font-display mb-2">
                Need This Capability?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Connect with our principal architecture team to evaluate your current setup and receive a tailored roadmap.
              </p>
              <Button 
                variant="primary" 
                size="md" 
                className="w-full text-xs font-semibold shadow-md shadow-coral-500/20"
                onClick={() => openConsultation(service.title)}
              >
                <span>Inquire About This Service</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            {/* Related Case Studies */}
            {relatedCaseStudies.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-800 font-bold px-1">
                  Proven Production Work
                </h4>
                {relatedCaseStudies.map((cs) => (
                  <Link 
                    key={cs.id} 
                    href={`/case-studies/${cs.slug}`}
                    className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-coral-300 transition-colors group shadow-sm"
                  >
                    <span className="text-[10px] font-mono text-coral-600 font-bold uppercase">{cs.industry}</span>
                    <h5 className="text-sm font-bold text-[#0B1426] group-hover:text-coral-600 transition-colors mt-1 font-display">
                      {cs.title}
                    </h5>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Client: {cs.client_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-coral-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 1. Full Width Section: Technologies & Protocols */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-coral-600 font-bold">
            <Boxes className="w-4 h-4" />
            <span>Curated Enterprise Stack</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B1426] font-display mb-6">
            Technologies & Protocols
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {profile.techStack.map((tech, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm interactive-card flex flex-col justify-between h-full hover:border-coral-300 transition-all">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-coral-600 block mb-3">
                    {tech.category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tech.tools.map((tool, tIdx) => (
                      <span key={tIdx} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold font-mono border border-slate-200 group-hover:border-coral-300 transition-colors">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Full Width Section: What We Build & Optimize (Capabilities) */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-coral-600 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Technical Deliverables & Capabilities</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B1426] font-display mb-6">
            What We Build & Optimize
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {service.capabilities.map((cap, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white border border-slate-200/90 flex items-start gap-4 shadow-sm interactive-card cursor-pointer group h-full min-h-[5.5rem] hover:border-coral-300 hover:shadow-md transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Full Width Section: Our Phased Delivery Framework */}
        {service.approach && service.approach.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-coral-600 font-bold">
              <Workflow className="w-4 h-4" />
              <span>Execution Methodology</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0B1426] font-display mb-6">
              Our Phased Delivery Framework
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {service.approach.map((step, idx) => (
                <div 
                  key={idx} 
                  className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-4 shadow-sm interactive-card cursor-pointer h-full min-h-[13rem] hover:border-coral-300 transition-all"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-coral-600 bg-coral-50 px-3 py-1 rounded-lg border border-coral-200/80 w-fit mb-3">
                      {step.step || `PHASE 0${idx + 1}`}
                    </div>
                    <h4 className="text-base font-bold text-[#0B1426] font-display mb-2">
                      {step.phase}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Full Width Section: Handover Artifacts & Repositories */}
        {service.deliverables && service.deliverables.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold">
              <PackageCheck className="w-4 h-4" />
              <span>Tangible Deliverables</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0B1426] font-display mb-6">
              Handover Artifacts & Repositories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {service.deliverables.map((item, i) => (
                <div key={i} className="flex items-center gap-3.5 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 h-full min-h-[5.5rem] shadow-2xs hover:bg-emerald-50 transition-all">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 shrink-0 shadow-xs" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* RFC Baseline Modal */}
      <Modal 
        isOpen={rfcModalOpen} 
        onClose={() => setRfcModalOpen(false)} 
        title={`Architecture RFC: ${service.title}`}
        maxWidth="2xl"
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-600 font-semibold">Specification Format: Markdown (RFC-2119 compliant)</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopyRFC} className="text-xs text-slate-800 border-slate-300 hover:bg-slate-100">
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Copy RFC</span>
                  </>
                )}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownloadRFC} className="text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Download .md</span>
              </Button>
            </div>
          </div>

          <pre className="p-5 bg-[#0B1426] text-slate-100 rounded-2xl text-xs font-mono overflow-y-auto max-h-96 border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-coral-500 selection:text-white">
            {rfcSnippet}
          </pre>

          <div className="pt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setRfcModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
