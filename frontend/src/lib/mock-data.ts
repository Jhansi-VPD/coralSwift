import { Service, Job, CaseStudy, Enquiry, SiteSettings, AuditLog, Application } from './types';

export const initialServices: Service[] = [
  {
    id: 's1',
    title: 'Cloud Architecture & Modernization',
    slug: 'cloud-architecture-modernization',
    category: 'Cloud & Infrastructure',
    short_description: 'Architect, migrate, and modernize mission-critical systems onto highly resilient, cost-optimized multi-cloud environments.',
    overview: 'CoralSwift empowers global enterprises to transition legacy monoliths into cloud-native, scalable architectures. We design fault-tolerant topologies on AWS, GCP, and Azure with automated disaster recovery, zero-trust network boundaries, and elastic auto-scaling infrastructure.',
    capabilities: [
      'Multi-cloud and hybrid infrastructure design',
      'Legacy application containerization & replatforming',
      'Zero-downtime database & state migration',
      'Cost optimization & FinOps operational excellence',
      'Serverless & event-driven compute design'
    ],
    approach: [
      { step: '01', phase: 'Discovery & Well-Architected Audit', description: 'Deep-dive assessment of current workloads, technical debt, dependencies, and SLA requirements.' },
      { step: '02', phase: 'Target Architecture Design', description: 'Creation of comprehensive RFC blueprints, infrastructure as code (IaC) templates, and security postures.' },
      { step: '03', phase: 'Iterative Migration Wave', description: 'Execution of phased cutovers with canary traffic routing, automated rollback mechanisms, and real-time telemetry.' },
      { step: '04', phase: 'Optimization & Day-2 Support', description: 'Continuous FinOps tuning, chaos engineering validation, and operational handoff.' }
    ],
    requirements: 'Existing architecture topology, workload profiles, compliance boundaries (SOC2, HIPAA, PCI-DSS), and SLA/RTO/RPO targets.',
    deliverables: [
      'Terraform/OpenTofu & Pulumi IaC repository',
      'Production multi-region Kubernetes cluster deployment',
      'Automated CI/CD deployment pipelines',
      'Complete architectural runbooks & disaster recovery blueprints'
    ],
    cta_text: 'Schedule Cloud Architecture Review',
    icon: 'Cloud',
    order_index: 1,
    status: 'published',
    meta_title: 'Enterprise Cloud Architecture & Modernization Services | CoralSwift',
    meta_description: 'Modernize legacy monoliths into scalable, resilient multi-cloud architectures with CoralSwift enterprise engineering.',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 's2',
    title: 'AI & Applied Machine Learning Solutions',
    slug: 'ai-applied-machine-learning',
    category: 'Artificial Intelligence',
    short_description: 'Turn proprietary enterprise data into competitive advantage with custom LLMs, RAG pipelines, and high-throughput inference engines.',
    overview: 'From intelligent document understanding to automated decision support systems, CoralSwift designs and deploys secure, scalable enterprise AI pipelines. We bridge cutting-edge generative AI models with deterministic enterprise guardrails.',
    capabilities: [
      'Enterprise Retrieval-Augmented Generation (RAG) architectures',
      'Custom LLM fine-tuning & domain adaptation',
      'High-performance vector search & embedding infrastructure',
      'MLOps pipelines: automated model evaluation, deployment & monitoring',
      'AI Governance, safety guardrails & PII redaction'
    ],
    approach: [
      { step: '01', phase: 'Data Readiness & Feasibility', description: 'Evaluating structured/unstructured corpus quality, latency tolerances, and accuracy metrics.' },
      { step: '02', phase: 'RAG & Pipeline Prototyping', description: 'Benchmarking embedding models, retrieval rerankers, and contextual chunking strategies.' },
      { step: '03', phase: 'Enterprise Integration & Guardrails', description: 'Connecting internal IAM, hallucination prevention layers, and telemetry logging.' },
      { step: '04', phase: 'Production MLOps Scaling', description: 'Distributed GPU inference serving with vLLM / TensorRT, continuous accuracy drift tracking.' }
    ],
    requirements: 'Domain knowledge corpus, data access permissions, security categorization, and baseline accuracy benchmarks.',
    deliverables: [
      'End-to-end containerized inference API service',
      'Vector database schema & automated synchronization pipelines',
      'Prompt evaluation & benchmark testing harness',
      'Administrative observability dashboard for LLM costs and latency'
    ],
    cta_text: 'Explore Enterprise AI Capabilities',
    icon: 'Cpu',
    order_index: 2,
    status: 'published',
    meta_title: 'Enterprise AI & Applied Machine Learning Services | CoralSwift',
    meta_description: 'Build reliable, secure, and production-ready enterprise AI and LLM solutions with CoralSwift.',
    created_at: '2026-08-05T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 's3',
    title: 'Enterprise DevSecOps & Platform Engineering',
    slug: 'enterprise-devsecops-platform-engineering',
    category: 'DevOps & Security',
    short_description: 'Accelerate engineering velocity and build internal developer platforms with automated compliance, security, and continuous delivery.',
    overview: 'We engineer Internal Developer Platforms (IDPs) that eliminate friction for developer teams while ensuring uncompromised security. Automated SAST/DAST, policy-as-code, and automated canary deployments empower engineering teams to deploy 10x faster with 99.99% reliability.',
    capabilities: [
      'Internal Developer Platform (IDP) architecture',
      'Policy-as-Code & automated regulatory compliance (OPA/Kyverno)',
      'Zero-trust CI/CD pipelines with ephemeral test environments',
      'Secret management & cryptographic key lifecycle systems',
      'Observability mesh (OpenTelemetry, Prometheus, Grafana, Datadog)'
    ],
    approach: [
      { step: '01', phase: 'Velocity & Bottleneck Analysis', description: 'Mapping deployment frequency, lead time for changes, and security gates.' },
      { step: '02', phase: 'Platform Foundation Build', description: 'Implementing unified developer CLI, GitOps workflows (ArgoCD/Flux), and cluster baselines.' },
      { step: '03', phase: 'Security Automation', description: 'Integrating automated vulnerability scanning, SBOM generation, and artifact signing into CI/CD.' },
      { step: '04', phase: 'Team Enablement & Golden Paths', description: 'Providing self-service service templates and automated scaffolding for engineering squads.' }
    ],
    requirements: 'Existing source control repositories, deployment targets, security policies, and team structure.',
    deliverables: [
      'Full GitOps repository with automated promotion stages',
      'Golden path application templates with pre-configured CI/CD',
      'Centralized log, metric, and distributed trace dashboards',
      'Comprehensive security compliance audit report'
    ],
    cta_text: 'Elevate Your Platform Velocity',
    icon: 'ShieldCheck',
    order_index: 3,
    status: 'published',
    meta_title: 'DevSecOps & Platform Engineering | CoralSwift',
    meta_description: 'Build resilient internal developer platforms with automated security and compliance at scale.',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 's4',
    title: 'Distributed Systems & High-Throughput Microservices',
    slug: 'distributed-systems-microservices',
    category: 'Engineering',
    short_description: 'High-concurrency, low-latency microservice architectures capable of processing millions of transactions per second with deterministic consistency.',
    overview: 'CoralSwift engineers robust distributed backends designed for extreme scalability. Utilizing event sourcing, CQRS patterns, Kafka/RabbitMQ messaging, and high-performance Go/Rust/TypeScript runtimes, we deliver backends that never miss a beat under peak workloads.',
    capabilities: [
      'Event-driven architecture & asynchronous messaging topologies',
      'CQRS and Event Sourcing system implementation',
      'Database sharding, partitioning & distributed caching',
      'gRPC, GraphQL, and high-performance REST API gateways',
      'Resilience patterns: circuit breakers, bulkhead isolation, and rate limiters'
    ],
    approach: [
      { step: '01', phase: 'Domain-Driven Design (DDD)', description: 'Decomposing business domains into bounded contexts and clear API contracts.' },
      { step: '02', phase: 'Event Bus & Gateway Architecture', description: 'Configuring event backbones, schema registries, and high-concurrency API gateways.' },
      { step: '03', phase: 'Core Service Development', description: 'Engineering stateless microservices with transactional outbox patterns and distributed locks.' },
      { step: '04', phase: 'Load & Chaos Simulation', description: 'Conducting distributed load testing and network partition chaos experiments.' }
    ],
    requirements: 'Business domain logic specifications, transaction volume expectations, and consistency requirements.',
    deliverables: [
      'Production-grade microservices codebase with full test coverage',
      'Event streaming schemas with Protobuf/Avro contracts',
      'Distributed tracing and latency profiling setup',
      'Architecture reference documentation & API specifications'
    ],
    cta_text: 'Architect High-Throughput Systems',
    icon: 'Layers',
    order_index: 4,
    status: 'published',
    meta_title: 'Distributed Systems & Microservices Engineering | CoralSwift',
    meta_description: 'Ultra-reliable, high-concurrency microservices and distributed systems engineered by CoralSwift.',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 's5',
    title: 'Enterprise Data Engineering & Real-time Analytics',
    slug: 'enterprise-data-engineering-analytics',
    category: 'Data & Analytics',
    short_description: 'Unified data lakes, real-time stream processing, and analytical warehouses for instantaneous business intelligence.',
    overview: 'Transform disparate data silos into unified, governed data meshes. We build streaming and batch data pipelines using Snowflake, ClickHouse, Apache Spark, and dbt, turning raw telemetry and transactional data into actionable insights in real-time.',
    capabilities: [
      'Modern Data Stack (MDS) implementation & migration',
      'Real-time stream processing with Apache Flink & Kafka',
      'Data mesh architecture & decentralized domain ownership',
      'Automated data quality testing & anomaly detection',
      'Executive BI dashboards and reverse-ETL integrations'
    ],
    approach: [
      { step: '01', phase: 'Data Source Mapping & Schema Cataloging', description: 'Inventorying databases, SaaS feeds, and event logs with lineage tracking.' },
      { step: '02', phase: 'Warehouse & Lakehouse Provisioning', description: 'Designing columnar warehouse schema, partition keys, and access roles.' },
      { step: '03', phase: 'Pipeline & Transformation Engineering', description: 'Building dbt models, Airflow DAGs, and real-time streaming connectors.' },
      { step: '04', phase: 'Data Governance & BI Activation', description: 'Implementing data quality alerts, SLA monitoring, and BI visualization layers.' }
    ],
    requirements: 'Data source connectivity, volume growth projections, and reporting cadence requirements.',
    deliverables: [
      'Production data pipelines with automated health checks',
      'Data catalog with automated lineage and documentation',
      'Curated data mart tables optimized for sub-second BI queries',
      'Data retention and GDPR/CCPA compliance scripts'
    ],
    cta_text: 'Modernize Your Data Pipeline',
    icon: 'Database',
    order_index: 5,
    status: 'published',
    meta_title: 'Enterprise Data Engineering & Analytics | CoralSwift',
    meta_description: 'Transform enterprise data into actionable intelligence with modern data platforms built by CoralSwift.',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 's6',
    title: 'Cybersecurity & Zero-Trust Architecture',
    slug: 'cybersecurity-zero-trust-architecture',
    category: 'Security & Governance',
    short_description: 'Comprehensive enterprise defense, identity-first access control, and continuous security compliance.',
    overview: 'CoralSwift implements defense-in-depth engineering from infrastructure layers to application code. We establish zero-trust network access, secrets lifecycle automation, automated cloud security posture management (CSPM), and comprehensive threat modeling.',
    capabilities: [
      'Zero-Trust Network Access (ZTNA) & IAM architecture',
      'Cloud Security Posture Management (CSPM) & automated remediation',
      'Application vulnerability remediation & threat modeling',
      'Penetration testing & red-team simulation support',
      'Compliance preparation (ISO 27001, SOC2 Type II, HIPAA)'
    ],
    approach: [
      { step: '01', phase: 'Threat Landscape & Vulnerability Audit', description: 'Comprehensive security posture assessment across code, cloud, and IAM.' },
      { step: '02', phase: 'Zero-Trust Architecture Blueprint', description: 'Designing least-privilege IAM matrices, network segmentation, and encryption standards.' },
      { step: '03', phase: 'Implementation & Tooling Integration', description: 'Deploying automated security scanners, CSPM, and centralized SIEM logging.' },
      { step: '04', phase: 'Compliance Validation & Handover', description: 'Conducting verification audits and delivering operational security runbooks.' }
    ],
    requirements: 'Infrastructure access, network topology diagrams, compliance target frameworks.',
    deliverables: [
      'Hardened infrastructure configurations & IAM policies',
      'Automated vulnerability scanning pipeline integration',
      'SIEM alerting rules and incident response playbooks',
      'Third-party audit-ready compliance documentation pack'
    ],
    cta_text: 'Strengthen Your Security Posture',
    icon: 'Lock',
    order_index: 6,
    status: 'published',
    meta_title: 'Cybersecurity & Zero-Trust Architecture | CoralSwift',
    meta_description: 'Protect enterprise assets with zero-trust architectures and continuous security engineering.',
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  }
];

export const initialJobs: Job[] = [
  {
    id: 'j1',
    title: 'Principal Distributed Systems Architect',
    slug: 'principal-distributed-systems-architect',
    department: 'Engineering',
    location: 'San Francisco, CA / Remote (US/Global)',
    work_model: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Principal / Staff (8+ yrs)',
    short_description: 'Lead the technical vision, architectural blueprints, and engineering execution for mission-critical client platforms.',
    description: 'At CoralSwift, the Principal Distributed Systems Architect serves as the primary technical authority for high-scale client engagements. You will design ultra-resilient distributed architectures, mentor staff engineers, and collaborate directly with enterprise CTOs and VPs of Engineering.',
    responsibilities: [
      'Design scalable, fault-tolerant distributed system architectures for enterprise client engagements',
      'Author comprehensive Technical RFCs, architecture blueprints, and API contract specifications',
      'Lead technical discovery sessions with enterprise leadership and conduct deep-dive audits',
      'Guide and mentor senior engineering squads through complex implementation milestones',
      'Evangelize engineering best practices around reliability, observability, and performance'
    ],
    requirements: [
      '8+ years of hands-on experience designing and operating high-throughput distributed systems in production',
      'Deep mastery of Go, Rust, or modern Node.js/TypeScript backend systems',
      'Extensive experience with event streaming (Kafka, RabbitMQ, Redpanda) and distributed storage (PostgreSQL, Cassandra, DynamoDB)',
      'Proven track record of designing multi-region cloud topologies on AWS, GCP, or Azure',
      'Exceptional verbal and written communication skills for executive client presentations'
    ],
    benefits: [
      'Competitive top-tier base salary + equity options',
      '100% remote flexibility with home office stipend ($3,000)',
      'Comprehensive health, dental, and vision insurance coverage',
      'Unlimited PTO with mandatory annual minimum',
      'Annual $5,000 professional learning & conference budget'
    ],
    salary_range: '$220,000 - $280,000 USD + Equity',
    status: 'active',
    applications_count: 8,
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'j2',
    title: 'Senior Full-Stack Engineer (Next.js & TypeScript)',
    slug: 'senior-fullstack-engineer-nextjs',
    department: 'Product Engineering',
    location: 'New York, NY / Remote',
    work_model: 'Hybrid',
    employment_type: 'Full-time',
    experience_level: 'Senior (5+ yrs)',
    short_description: 'Build high-performance, polished web applications and client dashboards with Next.js, React, and modern cloud databases.',
    description: 'We are looking for an exceptional Senior Full-Stack Engineer who obsesses over UI elegance, frontend performance, and robust API design. You will build user-facing platforms and internal developer tools that power enterprise operations.',
    responsibilities: [
      'Develop ultra-fast, accessible, and responsive user interfaces using Next.js App Router and React',
      'Design clean RESTful and GraphQL backend endpoints integrated with Supabase/PostgreSQL',
      'Implement end-to-end state management, authentication flows, and real-time event updates',
      'Collaborate closely with UI/UX designers to translate Figma design systems into pixel-perfect components',
      'Write unit, integration, and E2E tests to ensure flawless software quality'
    ],
    requirements: [
      '5+ years of software engineering experience with strong proficiency in TypeScript, React, and Next.js',
      'Solid experience with relational databases (PostgreSQL, Supabase, SQLAlchemy, Prisma)',
      'Deep understanding of web vitals, server-side rendering (SSR), and performance optimization',
      'Experience building modular design systems and Tailwind CSS styling architectures',
      'Strong debugging skills across client and server environments'
    ],
    benefits: [
      'Competitive compensation package with bonus incentives',
      'Modern Mac or Linux developer hardware of your choice',
      'Flexible working hours and hybrid office access',
      'Full health and wellness benefits',
      'Collaborative and engineering-first company culture'
    ],
    salary_range: '$160,000 - $205,000 USD',
    status: 'active',
    applications_count: 14,
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'j3',
    title: 'Lead Cloud Platform & DevSecOps Engineer',
    slug: 'lead-cloud-platform-devsecops',
    department: 'Infrastructure',
    location: 'Austin, TX / Remote',
    work_model: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Lead (6+ yrs)',
    short_description: 'Architect automated infrastructure, Kubernetes clusters, and zero-trust CI/CD delivery pipelines.',
    description: 'Join our Infrastructure team to build resilient, automated cloud platforms. You will engineer self-healing Kubernetes clusters, automate security compliance guardrails, and build internal developer platforms that 10x team productivity.',
    responsibilities: [
      'Architect and maintain production Kubernetes clusters on AWS (EKS) and GCP (GKE)',
      'Write modular, reusable Infrastructure as Code using Terraform, OpenTofu, and Pulumi',
      'Implement automated DevSecOps pipelines with GitOps (ArgoCD), SAST/DAST, and artifact signing',
      'Establish unified observability meshes using Prometheus, Grafana, OpenTelemetry, and Datadog',
      'Lead incident response post-mortems and automate self-healing remediation routines'
    ],
    requirements: [
      '6+ years experience in cloud infrastructure, site reliability engineering, or platform engineering',
      'Deep expertise with Kubernetes orchestration, service mesh (Istio/Linkerd), and Helm',
      'Demonstrated mastery of Terraform/IaC and modern CI/CD orchestration engines',
      'Strong knowledge of cloud networking, VPC peering, TLS termination, and ZTNA principles',
      'Experience achieving SOC2, HIPAA, or ISO 27001 infrastructure compliance'
    ],
    benefits: [
      'Top-of-market salary with equity participation',
      'Comprehensive health & wellness coverage',
      'Home office setup budget ($3,000)',
      'Generous parental leave and family support',
      'Annual team offsites in premier global locations'
    ],
    salary_range: '$180,000 - $230,000 USD',
    status: 'active',
    applications_count: 6,
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'j4',
    title: 'Senior AI / Applied Machine Learning Engineer',
    slug: 'senior-ai-ml-engineer',
    department: 'AI & Data',
    location: 'San Francisco, CA / Remote',
    work_model: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Senior (4+ yrs)',
    short_description: 'Deploy production enterprise LLM pipelines, RAG systems, and distributed GPU inference architectures.',
    description: 'CoralSwift is expanding its Applied AI practice. In this role, you will build production-ready LLM pipelines, implement domain-specific fine-tuning, and optimize low-latency vector search systems for global enterprises.',
    responsibilities: [
      'Build enterprise-grade RAG architectures with advanced chunking, reranking, and semantic search',
      'Fine-tune and evaluate open-source foundation models (Llama, Mistral, DeepSeek) for specific domains',
      'Deploy high-throughput inference endpoints using vLLM, TensorRT-LLM, and Triton',
      'Implement automated LLM evaluation benchmarks, guardrails, and toxicity filtering',
      'Collaborate with client stakeholders to identify high-ROI AI automation opportunities'
    ],
    requirements: [
      '4+ years experience in machine learning and software engineering with strong Python/PyTorch skills',
      'Hands-on experience deploying LLMs, vector databases (Qdrant, Pinecone, pgvector), and LangChain/LlamaIndex in production',
      'Solid understanding of distributed GPU computing, CUDA fundamentals, and quantization techniques',
      'Strong foundation in data structures, API design, and cloud deployments',
      'Passion for keeping up with the rapid evolution of generative AI research'
    ],
    benefits: [
      'Competitive salary + equity package',
      'Access to dedicated GPU clusters for R&D',
      'Remote work freedom with top tier benefits',
      'Conference attendance and paper publishing support'
    ],
    salary_range: '$175,000 - $225,000 USD',
    status: 'active',
    applications_count: 11,
    created_at: '2026-08-22T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  }
];

export const initialCaseStudies: CaseStudy[] = [
  {
    id: 'cs1',
    title: 'Next-Gen High-Frequency Payment Processing Core',
    slug: 'fintech-payment-processing-core',
    client_name: 'Apex Financial Global',
    industry: 'Financial Services & FinTech',
    project_context: 'Apex Financial processes over $40B in annual volume across 18 currencies. Their legacy monolith struggled to handle peak black-swan trading volume spikes and incurred excessive settlement latency.',
    challenge: 'Sub-optimal throughput capped at 1,200 TPS, occasional database lock contention, and 4.2-second average transaction settlement latency resulting in high abandoned checkout rates and SLA penalties.',
    solution: 'CoralSwift designed an event-driven distributed payment core leveraging CQRS, distributed in-memory caching, and an active-active multi-region database topology on PostgreSQL and Apache Kafka.',
    implementation: 'Migrated 14 distinct payment channels in zero-downtime canary waves. Implemented cryptographic idempotency keys to guarantee exactly-once transaction processing, and sub-millisecond fraud scoring pipelines.',
    outcome_metrics: [
      { metric: '42,000+', label: 'Peak Transactions / Sec (TPS)' },
      { metric: '99.999%', label: 'Production Uptime Verified' },
      { metric: '18ms', label: 'P99 Settlement Latency (Down from 4.2s)' },
      { metric: '$8.4M', label: 'Annual Operational Cost Savings' }
    ],
    tech_stack: ['PostgreSQL', 'Next.js', 'Apache Kafka', 'Go', 'Kubernetes', 'Redis', 'Terraform', 'AWS'],
    related_service_slug: 'distributed-systems-microservices',
    is_featured: true,
    status: 'published',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'cs2',
    title: 'Autonomous AI-Driven Supply Chain Logistics Platform',
    slug: 'autonomous-supply-chain-analytics',
    client_name: 'Vanguard Freight & Logistics',
    industry: 'Logistics & Supply Chain',
    project_context: 'Vanguard operates a fleet of 12,000+ freight vehicles and 85 international distribution hubs, managing intricate cross-border cargo schedules across North America and Europe.',
    challenge: 'Fragmented legacy ERP systems created unpredictable transit bottlenecks, manual route re-dispatching delays during weather anomalies, and high fuel wastage.',
    solution: 'CoralSwift deployed a real-time IoT event stream ingestion platform coupled with deep-learning route optimization models and automated dispatch recommendation engines.',
    implementation: 'Integrated live telematics data with Apache Spark streaming, custom graph neural network models for predictive transit delays, and an intuitive executive control room web dashboard.',
    outcome_metrics: [
      { metric: '31%', label: 'Reduction in Route Delays' },
      { metric: '$14.2M', label: 'Fuel & Maintenance Savings Year 1' },
      { metric: '2.4M+', label: 'Daily IoT Telematics Events Ingested' },
      { metric: '4.8x', label: 'Faster Dispatch Decision Time' }
    ],
    tech_stack: ['Python', 'Apache Spark', 'Next.js', 'Supabase', 'TimescaleDB', 'Docker', 'GCP'],
    related_service_slug: 'ai-applied-machine-learning',
    is_featured: true,
    status: 'published',
    created_at: '2026-08-12T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'cs3',
    title: 'Zero-Downtime Multi-Cloud Modernization for HealthTech',
    slug: 'healthtech-cloud-modernization',
    client_name: 'OmniHealth Global',
    industry: 'Healthcare & Life Sciences',
    project_context: 'OmniHealth serves 6 million active patients across 240 hospital systems. Their legacy on-premise infrastructure was unable to scale during nationwide telehealth surges and faced stringent HIPAA/SOC2 audits.',
    challenge: 'Legacy bare-metal hardware failure risks, 48-hour disaster recovery RTO, and complex compliance auditing preventing rapid feature rollouts.',
    solution: 'Engineered a multi-region, HIPAA-compliant Kubernetes platform on AWS and GCP with automated disaster recovery failover under 30 seconds and zero data loss.',
    implementation: 'Transformed 42 monolithic services into containerized micro-applications with automated vulnerability scanning, end-to-end envelope encryption, and ephemeral dev environments.',
    outcome_metrics: [
      { metric: '< 30s', label: 'Disaster Recovery RTO (Down from 48h)' },
      { metric: '100%', label: 'HIPAA & SOC2 Type II Audit Compliance' },
      { metric: '14x', label: 'Increase in Deployment Frequency' },
      { metric: '6M+', label: 'Active Patient Records Secured' }
    ],
    tech_stack: ['Kubernetes', 'AWS EKS', 'Terraform', 'PostgreSQL', 'Next.js', 'Vault', 'OpenTelemetry'],
    related_service_slug: 'cloud-architecture-modernization',
    is_featured: true,
    status: 'published',
    created_at: '2026-08-18T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'cs4',
    title: 'Unified Enterprise Data Mesh & Real-Time Intelligence',
    slug: 'retail-data-mesh-intelligence',
    client_name: 'Starlight Retail Enterprises',
    industry: 'Retail & E-Commerce',
    project_context: 'Starlight operates 450+ physical stores and a top-tier digital marketplace. Disjointed customer data across in-store POS, mobile apps, and warehouse inventory impeded personalized marketing.',
    challenge: 'Data siloed across 12 legacy databases, 36-hour delay in sales reporting, and no unified single view of customer lifetime value.',
    solution: 'Built a centralized real-time Data Mesh architecture on Snowflake and ClickHouse with automated dbt transformation models and sub-second analytical query capability.',
    implementation: 'Implemented event stream connectors capturing real-time store purchases and digital browse events, feeding automated omnichannel recommendation models.',
    outcome_metrics: [
      { metric: 'Sub-second', label: 'Analytics Query Response Time' },
      { metric: '+24%', label: 'Increase in Average Order Value (AOV)' },
      { metric: 'Real-time', label: 'Inventory Sync Across 450 Stores' },
      { metric: '350M+', label: 'Monthly Customer Touchpoints Processed' }
    ],
    tech_stack: ['Snowflake', 'ClickHouse', 'dbt', 'Next.js', 'Kafka', 'Python', 'Supabase'],
    related_service_slug: 'enterprise-data-engineering-analytics',
    is_featured: false,
    status: 'published',
    created_at: '2026-08-25T10:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  }
];

export const initialEnquiries: Enquiry[] = [
  {
    id: 'e1',
    full_name: 'David Vance',
    email: 'dvance@quantumlogix.io',
    company: 'Quantum Logix Corp',
    phone: '+1 (415) 892-3001',
    service_interest: 'Cloud Architecture & Modernization',
    message: 'We are seeking architectural consulting to decouple our core billing monolith into event-driven microservices on AWS before Q4 peak shopping traffic.',
    consent: true,
    source_page: '/services/cloud-architecture-modernization',
    status: 'new',
    created_at: '2026-09-08T14:15:00Z',
    updated_at: '2026-09-08T14:15:00Z'
  },
  {
    id: 'e2',
    full_name: 'Elena Rostova',
    email: 'elena@novapharma.ch',
    company: 'Nova Pharma Labs',
    phone: '+41 22 700 8192',
    service_interest: 'AI & Applied Machine Learning Solutions',
    message: 'We need enterprise RAG pipelines deployed on private GPUs with strict GDPR and medical safety guardrails to assist clinical trials analysis.',
    consent: true,
    source_page: '/contact',
    status: 'in_review',
    admin_notes: 'Initial screening scheduled for Thursday 10 AM EST.',
    created_at: '2026-09-07T09:30:00Z',
    updated_at: '2026-09-07T16:00:00Z'
  },
  {
    id: 'e3',
    full_name: 'Marcus Brody',
    email: 'mbrody@meridianfin.com',
    company: 'Meridian Financial Group',
    phone: '+1 (212) 555-0199',
    service_interest: 'Distributed Systems & High-Throughput Microservices',
    message: 'Looking for distributed systems experts to benchmark and improve our trade execution engine to achieve sub-20ms settlement guarantees.',
    consent: true,
    source_page: '/case-studies/fintech-payment-processing-core',
    status: 'qualified',
    admin_notes: 'NDA executed. Architecture RFC presentation scheduled.',
    created_at: '2026-09-05T11:20:00Z',
    updated_at: '2026-09-06T10:00:00Z'
  }
];

export const initialApplications: Application[] = [
  {
    id: 'app1',
    job_id: 'j1',
    full_name: 'Sarah Chen',
    email: 'sarah.chen@devmail.org',
    phone: '+1 (510) 901-4432',
    portfolio_url: 'https://github.com/sarahchen-arch',
    linkedin_url: 'https://linkedin.com/in/sarahchen-systems',
    cover_note: 'Over 9 years scaling distributed Kafka backends and designing multi-region cloud infrastructures. Excited about CoralSwift engineering principles.',
    resume_path: '/uploads/resumes/sarah_chen_resume.pdf',
    resume_filename: 'sarah_chen_resume.pdf',
    status: 'reviewing',
    job_title: 'Principal Distributed Systems Architect',
    admin_notes: 'Impressive track record at Stripe and Uber infrastructure teams.',
    created_at: '2026-09-06T08:00:00Z',
    updated_at: '2026-09-07T11:00:00Z'
  },
  {
    id: 'app2',
    job_id: 'j2',
    full_name: 'Alexander Wright',
    email: 'awright@engineer.io',
    phone: '+1 (646) 332-9018',
    portfolio_url: 'https://alexwright.dev',
    linkedin_url: 'https://linkedin.com/in/alexwright-dev',
    cover_note: 'Specialized in Next.js App Router performance, TypeScript design systems, and Supabase full-stack development.',
    resume_path: '/uploads/resumes/alex_wright_cv.pdf',
    resume_filename: 'alex_wright_cv.pdf',
    status: 'shortlisted',
    job_title: 'Senior Full-Stack Engineer (Next.js & TypeScript)',
    admin_notes: 'Excellent design sense and clean code samples.',
    created_at: '2026-09-05T14:30:00Z',
    updated_at: '2026-09-07T14:00:00Z'
  }
];

export const initialSiteSettings: SiteSettings = {
  general: {
    company_name: 'CoralSwift',
    tagline: 'Enterprise Software Engineering & High-Scale Systems',
    contact_email: 'info@coralswift.com',
    support_email: 'info@coralswift.com',
    phone: '+1 (307) 216-5154',
    headquarters: '30 N Gould St Ste #62633, Sheridan, WY 82801, United States',
    established_year: '2020',
    social_links: {
      linkedin: 'https://linkedin.com/company/coralswift',
      github: 'https://github.com/coralswift',
      twitter: 'https://twitter.com/coralswift'
    }
  },
  metrics: {
    uptime_sla: '99.999%',
    tps_processed: '100M+',
    enterprise_clients: '45+',
    client_satisfaction: '98%'
  }
};

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'a1',
    user_email: 'admin@coralswift.com',
    action: 'ADMIN_LOGIN_SUCCESS',
    entity_type: 'AUTH',
    entity_id: 'usr_admin',
    details: { method: 'password', browser: 'Chrome 128 (Windows)' },
    ip_address: '198.51.100.42',
    created_at: '2026-09-08T15:30:00Z'
  },
  {
    id: 'a2',
    user_email: 'admin@coralswift.com',
    action: 'UPDATE_SERVICE',
    entity_type: 'SERVICE',
    entity_id: 'cloud-architecture-modernization',
    details: { changes: ['updated capabilities', 'published status'] },
    ip_address: '198.51.100.42',
    created_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'a3',
    user_email: 'admin@coralswift.com',
    action: 'REVIEW_ENQUIRY',
    entity_type: 'ENQUIRY',
    entity_id: 'e2',
    details: { previous_status: 'new', new_status: 'in_review' },
    ip_address: '198.51.100.42',
    created_at: '2026-09-07T16:00:00Z'
  }
];
