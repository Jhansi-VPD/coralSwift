-- CORALSWIFT SEED DATA
-- Baseline sample dataset for immediate production-like demonstration

-- 1. Insert Services
INSERT INTO public.services (
    title, slug, category, short_description, overview, 
    capabilities, approach, requirements, deliverables, 
    cta_text, icon, order_index, status, meta_title, meta_description
) VALUES 
(
    'Cloud Architecture & Modernization',
    'cloud-architecture-modernization',
    'Cloud & Infrastructure',
    'Architect, migrate, and modernize mission-critical systems onto highly resilient, cost-optimized multi-cloud environments.',
    'CoralSwift empowers global enterprises to transition legacy monoliths into cloud-native, scalable architectures. We design fault-tolerant topologies on AWS, GCP, and Azure with automated disaster recovery, zero-trust network boundaries, and elastic auto-scaling infrastructure.',
    '[
        "Multi-cloud and hybrid infrastructure design",
        "Legacy application containerization & replatforming",
        "Zero-downtime database & state migration",
        "Cost optimization & FinOps operational excellence",
        "Serverless & event-driven compute design"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Discovery & Well-Architected Audit", "description": "Deep-dive assessment of current workloads, technical debt, dependencies, and SLA requirements."},
        {"step": "02", "phase": "Target Architecture Design", "description": "Creation of comprehensive RFC blueprints, infrastructure as code (IaC) templates, and security postures."},
        {"step": "03", "phase": "Iterative Migration Wave", "description": "Execution of phased cutovers with canary traffic routing, automated rollback mechanisms, and real-time telemetry."},
        {"step": "04", "phase": "Optimization & Day-2 Support", "description": "Continuous FinOps tuning, chaos engineering validation, and operational handoff."}
    ]'::jsonb,
    'Existing architecture topology, workload profiles, compliance boundaries (SOC2, HIPAA, PCI-DSS), and SLA/RTO/RPO targets.',
    '[
        "Terraform/OpenTofu & Pulumi IaC repository",
        "Production multi-region Kubernetes cluster deployment",
        "Automated CI/CD deployment pipelines",
        "Complete architectural runbooks & disaster recovery blueprints"
    ]'::jsonb,
    'Schedule Cloud Architecture Review',
    'Cloud',
    1,
    'published',
    'Enterprise Cloud Architecture & Modernization Services | CoralSwift',
    'Modernize legacy monoliths into scalable, resilient multi-cloud architectures with CoralSwift enterprise engineering.'
),
(
    'AI & Applied Machine Learning Solutions',
    'ai-applied-machine-learning',
    'Artificial Intelligence',
    'Turn proprietary enterprise data into competitive advantage with custom LLMs, RAG pipelines, and high-throughput inference engines.',
    'From intelligent document understanding to automated decision support systems, CoralSwift designs and deploys secure, scalable enterprise AI pipelines. We bridge cutting-edge generative AI models with deterministic enterprise guardrails.',
    '[
        "Enterprise Retrieval-Augmented Generation (RAG) architectures",
        "Custom LLM fine-tuning & domain adaptation",
        "High-performance vector search & embedding infrastructure",
        "MLOps pipelines: automated model evaluation, deployment & monitoring",
        "AI Governance, safety guardrails & PII redaction"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Data Readiness & Feasibility", "description": "Evaluating structured/unstructured corpus quality, latency tolerances, and accuracy metrics."},
        {"step": "02", "phase": "RAG & Pipeline Prototyping", "description": "Benchmarking embedding models, retrieval rerankers, and contextual chunking strategies."},
        {"step": "03", "phase": "Enterprise Integration & Guardrails", "description": "Connecting internal IAM, hallucination prevention layers, and telemetry logging."},
        {"step": "04", "phase": "Production MLOps Scaling", "description": "Distributed GPU inference serving with vLLM / TensorRT, continuous accuracy drift tracking."}
    ]'::jsonb,
    'Domain knowledge corpus, data access permissions, security categorization, and baseline accuracy benchmarks.',
    '[
        "End-to-end containerized inference API service",
        "Vector database schema & automated synchronization pipelines",
        "Prompt evaluation & benchmark testing harness",
        "Administrative observability dashboard for LLM costs and latency"
    ]'::jsonb,
    'Explore Enterprise AI Capabilities',
    'Cpu',
    2,
    'published',
    'Enterprise AI & Applied Machine Learning Services | CoralSwift',
    'Build reliable, secure, and production-ready enterprise AI and LLM solutions with CoralSwift.'
),
(
    'Enterprise DevSecOps & Platform Engineering',
    'enterprise-devsecops-platform-engineering',
    'DevOps & Security',
    'Accelerate engineering velocity and build internal developer platforms with automated compliance, security, and continuous delivery.',
    'We engineer Internal Developer Platforms (IDPs) that eliminate friction for developer teams while ensuring uncompromised security. Automated SAST/DAST, policy-as-code, and automated canary deployments empower engineering teams to deploy 10x faster with 99.99% reliability.',
    '[
        "Internal Developer Platform (IDP) architecture",
        "Policy-as-Code & automated regulatory compliance (OPA/Kyverno)",
        "Zero-trust CI/CD pipelines with ephemeral test environments",
        "Secret management & cryptographic key lifecycle systems",
        "Observability mesh (OpenTelemetry, Prometheus, Grafana, Datadog)"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Velocity & Bottleneck Analysis", "description": "Mapping deployment frequency, lead time for changes, and security gates."},
        {"step": "02", "phase": "Platform Foundation Build", "description": "Implementing unified developer CLI, GitOps workflows (ArgoCD/Flux), and cluster baselines."},
        {"step": "03", "phase": "Security Automation", "description": "Integrating automated vulnerability scanning, SBOM generation, and artifact signing into CI/CD."},
        {"step": "04", "phase": "Team Enablement & Golden Paths", "description": "Providing self-service service templates and automated scaffolding for engineering squads."}
    ]'::jsonb,
    'Existing source control repositories, deployment targets, security policies, and team structure.',
    '[
        "Full GitOps repository with automated promotion stages",
        "Golden path application templates with pre-configured CI/CD",
        "Centralized log, metric, and distributed trace dashboards",
        "Comprehensive security compliance audit report"
    ]'::jsonb,
    'Elevate Your Platform Velocity',
    'ShieldCheck',
    3,
    'published',
    'DevSecOps & Platform Engineering | CoralSwift',
    'Build resilient internal developer platforms with automated security and compliance at scale.'
),
(
    'Distributed Systems & High-Throughput Microservices',
    'distributed-systems-microservices',
    'Engineering',
    'High-concurrency, low-latency microservice architectures capable of processing millions of transactions per second with deterministic consistency.',
    'CoralSwift engineers robust distributed backends designed for extreme scalability. Utilizing event sourcing, CQRS patterns, Kafka/RabbitMQ messaging, and high-performance Go/Rust/TypeScript runtimes, we deliver backends that never miss a beat under peak workloads.',
    '[
        "Event-driven architecture & asynchronous messaging topologies",
        "CQRS and Event Sourcing system implementation",
        "Database sharding, partitioning & distributed caching",
        "gRPC, GraphQL, and high-performance REST API gateways",
        "Resilience patterns: circuit breakers, bulkhead isolation, and rate limiters"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Domain-Driven Design (DDD)", "description": "Decomposing business domains into bounded contexts and clear API contracts."},
        {"step": "02", "phase": "Event Bus & Gateway Architecture", "description": "Configuring event backbones, schema registries, and high-concurrency API gateways."},
        {"step": "03", "phase": "Core Service Development", "description": "Engineering stateless microservices with transactional outbox patterns and distributed locks."},
        {"step": "04", "phase": "Load & Chaos Simulation", "description": "Conducting distributed load testing and network partition chaos experiments."}
    ]'::jsonb,
    'Business domain logic specifications, transaction volume expectations, and consistency requirements.',
    '[
        "Production-grade microservices codebase with full test coverage",
        "Event streaming schemas with Protobuf/Avro contracts",
        "Distributed tracing and latency profiling setup",
        "Architecture reference documentation & API specifications"
    ]'::jsonb,
    'Architect High-Throughput Systems',
    'Layers',
    4,
    'published',
    'Distributed Systems & Microservices Engineering | CoralSwift',
    'Ultra-reliable, high-concurrency microservices and distributed systems engineered by CoralSwift.'
),
(
    'Enterprise Data Engineering & Real-time Analytics',
    'enterprise-data-engineering-analytics',
    'Data & Analytics',
    'Unified data lakes, real-time stream processing, and analytical warehouses for instantaneous business intelligence.',
    'Transform disparate data silos into unified, governed data meshes. We build streaming and batch data pipelines using Snowflake, ClickHouse, Apache Spark, and dbt, turning raw telemetry and transactional data into actionable insights in real-time.',
    '[
        "Modern Data Stack (MDS) implementation & migration",
        "Real-time stream processing with Apache Flink & Kafka",
        "Data mesh architecture & decentralized domain ownership",
        "Automated data quality testing & anomaly detection",
        "Executive BI dashboards and reverse-ETL integrations"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Data Source Mapping & Schema Cataloging", "description": "Inventorying databases, SaaS feeds, and event logs with lineage tracking."},
        {"step": "02", "phase": "Warehouse & Lakehouse Provisioning", "description": "Designing columnar warehouse schema, partition keys, and access roles."},
        {"step": "03", "phase": "Pipeline & Transformation Engineering", "description": "Building dbt models, Airflow DAGs, and real-time streaming connectors."},
        {"step": "04", "phase": "Data Governance & BI Activation", "description": "Implementing data quality alerts, SLA monitoring, and BI visualization layers."}
    ]'::jsonb,
    'Data source connectivity, volume growth projections, and reporting cadence requirements.',
    '[
        "Production data pipelines with automated health checks",
        "Data catalog with automated lineage and documentation",
        "Curated data mart tables optimized for sub-second BI queries",
        "Data retention and GDPR/CCPA compliance scripts"
    ]'::jsonb,
    'Modernize Your Data Pipeline',
    'Database',
    5,
    'published',
    'Enterprise Data Engineering & Analytics | CoralSwift',
    'Transform enterprise data into actionable intelligence with modern data platforms built by CoralSwift.'
),
(
    'Cybersecurity & Zero-Trust Architecture',
    'cybersecurity-zero-trust-architecture',
    'Security & Governance',
    'Comprehensive enterprise defense, identity-first access control, and continuous security compliance.',
    'CoralSwift implements defense-in-depth engineering from infrastructure layers to application code. We establish zero-trust network access, secrets lifecycle automation, automated cloud security posture management (CSPM), and comprehensive threat modeling.',
    '[
        "Zero-Trust Network Access (ZTNA) & IAM architecture",
        "Cloud Security Posture Management (CSPM) & automated remediation",
        "Application vulnerability remediation & threat modeling",
        "Penetration testing & red-team simulation support",
        "Compliance preparation (ISO 27001, SOC2 Type II, HIPAA)"
    ]'::jsonb,
    '[
        {"step": "01", "phase": "Threat Landscape & Vulnerability Audit", "description": "Comprehensive security posture assessment across code, cloud, and IAM."},
        {"step": "02", "phase": "Zero-Trust Architecture Blueprint", "description": "Designing least-privilege IAM matrices, network segmentation, and encryption standards."},
        {"step": "03", "phase": "Implementation & Tooling Integration", "description": "Deploying automated security scanners, CSPM, and centralized SIEM logging."},
        {"step": "04", "phase": "Compliance Validation & Handover", "description": "Conducting verification audits and delivering operational security runbooks."}
    ]'::jsonb,
    'Infrastructure access, network topology diagrams, compliance target frameworks.',
    '[
        "Hardened infrastructure configurations & IAM policies",
        "Automated vulnerability scanning pipeline integration",
        "SIEM alerting rules and incident response playbooks",
        "Third-party audit-ready compliance documentation pack"
    ]'::jsonb,
    'Strengthen Your Security Posture',
    'Lock',
    6,
    'published',
    'Cybersecurity & Zero-Trust Architecture | CoralSwift',
    'Protect enterprise assets with zero-trust architectures and continuous security engineering.'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Case Studies
INSERT INTO public.case_studies (
    title, slug, client_name, industry, project_context,
    challenge, solution, implementation, outcome_metrics,
    tech_stack, related_service_slug, is_featured, status
) VALUES
(
    'Next-Gen High-Frequency Payment Processing Core',
    'fintech-payment-processing-core',
    'Apex Financial Global',
    'Financial Services & FinTech',
    'Apex Financial processes over $40B in annual volume across 18 currencies. Their legacy monolith struggled to handle peak black-swan trading volume spikes and incurred excessive settlement latency.',
    'Sub-optimal throughput capped at 1,200 TPS, occasional database lock contention, and 4.2-second average transaction settlement latency resulting in high abandoned checkout rates and SLA penalties.',
    'CoralSwift designed an event-driven distributed payment core leveraging CQRS, distributed in-memory caching, and an active-active multi-region database topology on PostgreSQL and Apache Kafka.',
    'Migrated 14 distinct payment channels in zero-downtime canary waves. Implemented cryptographic idempotency keys to guarantee exactly-once transaction processing, and sub-millisecond fraud scoring pipelines.',
    '[
        {"metric": "42,000+", "label": "Peak Transactions / Sec (TPS)"},
        {"metric": "99.999%", "label": "Production Uptime Verified"},
        {"metric": "18ms", "label": "P99 Settlement Latency (Down from 4.2s)"},
        {"metric": "$8.4M", "label": "Annual Operational Cost Savings"}
    ]'::jsonb,
    '["PostgreSQL", "Next.js", "Apache Kafka", "Go", "Kubernetes", "Redis", "Terraform", "AWS"]'::jsonb,
    'distributed-systems-microservices',
    true,
    'published'
),
(
    'Autonomous AI-Driven Supply Chain Logistics Platform',
    'autonomous-supply-chain-analytics',
    'Vanguard Freight & Logistics',
    'Logistics & Supply Chain',
    'Vanguard operates a fleet of 12,000+ freight vehicles and 85 international distribution hubs, managing intricate cross-border cargo schedules across North America and Europe.',
    'Fragmented legacy ERP systems created unpredictable transit bottlenecks, manual route re-dispatching delays during weather anomalies, and high fuel wastage.',
    'CoralSwift deployed a real-time IoT event stream ingestion platform coupled with deep-learning route optimization models and automated dispatch recommendation engines.',
    'Integrated live telematics data with Apache Spark streaming, custom graph neural network models for predictive transit delays, and an intuitive executive control room web dashboard.',
    '[
        {"metric": "31%", "label": "Reduction in Route Delays"},
        {"metric": "$14.2M", "label": "Fuel and Maintenance Savings in Year 1"},
        {"metric": "2.4M+", "label": "Daily IoT Telematics Events Ingested"},
        {"metric": "4.8x", "label": "Faster Dispatch Decision Time"}
    ]'::jsonb,
    '["Python", "Apache Spark", "Next.js", "Supabase", "TimescaleDB", "FastAPI", "Docker", "GCP"]'::jsonb,
    'ai-applied-machine-learning',
    true,
    'published'
),
(
    'Zero-Downtime Multi-Cloud Modernization for HealthTech',
    'healthtech-cloud-modernization',
    'OmniHealth Global',
    'Healthcare & Life Sciences',
    'OmniHealth serves 6 million active patients across 240 hospital systems. Their legacy on-premise infrastructure was unable to scale during nationwide telehealth surges and faced stringent HIPAA/SOC2 audits.',
    'Legacy bare-metal hardware failure risks, 48-hour disaster recovery RTO, and complex compliance auditing preventing rapid feature rollouts.',
    'Engineered a multi-region, HIPAA-compliant Kubernetes platform on AWS and GCP with automated disaster recovery failover under 30 seconds and zero data loss.',
    'Transformed 42 monolithic services into containerized micro-applications with automated vulnerability scanning, end-to-end envelope encryption, and ephemeral dev environments.',
    '[
        {"metric": "< 30s", "label": "Disaster Recovery RTO (Down from 48h)"},
        {"metric": "100%", "label": "HIPAA & SOC2 Type II Audit Compliance"},
        {"metric": "14x", "label": "Increase in Deployment Frequency"},
        {"metric": "6M+", "label": "Active Patient Records Secured"}
    ]'::jsonb,
    '["Kubernetes", "AWS EKS", "Terraform", "PostgreSQL", "Next.js", "Vault", "OpenTelemetry"]'::jsonb,
    'cloud-architecture-modernization',
    true,
    'published'
),
(
    'Unified Enterprise Data Mesh & Real-Time Intelligence',
    'retail-data-mesh-intelligence',
    'Starlight Retail Enterprises',
    'Retail & E-Commerce',
    'Starlight operates 450+ physical stores and a top-tier digital marketplace. Disjointed customer data across in-store POS, mobile apps, and warehouse inventory impeded personalized marketing.',
    'Data siloed across 12 legacy databases, 36-hour delay in sales reporting, and no unified single view of customer lifetime value.',
    'Built a centralized real-time Data Mesh architecture on Snowflake and ClickHouse with automated dbt transformation models and sub-second analytical query capability.',
    'Implemented event stream connectors capturing real-time store purchases and digital browse events, feeding automated omnichannel recommendation models.',
    '[
        {"metric": "Sub-second", "label": "Analytics Query Response Time"},
        {"metric": "+24%", "label": "Increase in Average Order Value (AOV)"},
        {"metric": "Real-time", "label": "Inventory Sync Across 450 Stores"},
        {"metric": "350M+", "label": "Monthly Customer Touchpoints Processed"}
    ]'::jsonb,
    '["Snowflake", "ClickHouse", "dbt", "Next.js", "Kafka", "Python", "Supabase"]'::jsonb,
    'enterprise-data-engineering-analytics',
    false,
    'published'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Job Openings
INSERT INTO public.jobs (
    title, slug, department, location, work_model,
    employment_type, experience_level, short_description,
    description, responsibilities, requirements, benefits, salary_range, status
) VALUES
(
    'Principal Distributed Systems Architect',
    'principal-distributed-systems-architect',
    'Engineering',
    'San Francisco, CA / Remote (US/Global)',
    'Remote',
    'Full-time',
    'Principal / Staff (8+ yrs)',
    'Lead the technical vision, architectural blueprints, and engineering execution for mission-critical client platforms.',
    'At CoralSwift, the Principal Distributed Systems Architect serves as the primary technical authority for high-scale client engagements. You will design ultra-resilient distributed architectures, mentor staff engineers, and collaborate directly with enterprise CTOs and VPs of Engineering.',
    '[
        "Design scalable, fault-tolerant distributed system architectures for enterprise client engagements",
        "Author comprehensive Technical RFCs, architecture blueprints, and API contract specifications",
        "Lead technical discovery sessions with enterprise leadership and conduct deep-dive audits",
        "Guide and mentor senior engineering squads through complex implementation milestones",
        "Evangelize engineering best practices around reliability, observability, and performance"
    ]'::jsonb,
    '[
        "8+ years of hands-on experience designing and operating high-throughput distributed systems in production",
        "Deep mastery of Go, Rust, or modern Node.js/TypeScript backend systems",
        "Extensive experience with event streaming (Kafka, RabbitMQ, Redpanda) and distributed storage (PostgreSQL, Cassandra, DynamoDB)",
        "Proven track record of designing multi-region cloud topologies on AWS, GCP, or Azure",
        "Exceptional verbal and written communication skills for executive client presentations"
    ]'::jsonb,
    '[
        "Competitive top-tier base salary + equity options",
        "100% remote flexibility with home office stipend",
        "Comprehensive health, dental, and vision insurance coverage",
        "Unlimited PTO with mandatory annual minimum",
        "Annual $5,000 professional learning & conference budget"
    ]'::jsonb,
    '$220,000 - $280,000 USD + Equity',
    'active'
),
(
    'Senior Full-Stack Engineer (Next.js & TypeScript)',
    'senior-fullstack-engineer-nextjs',
    'Product Engineering',
    'New York, NY / Remote',
    'Hybrid',
    'Full-time',
    'Senior (5+ yrs)',
    'Build high-performance, polished web applications and client dashboards with Next.js, React, and modern cloud databases.',
    'We are looking for an exceptional Senior Full-Stack Engineer who obsesses over UI elegance, frontend performance, and robust API design. You will build user-facing platforms and internal developer tools that power enterprise operations.',
    '[
        "Develop ultra-fast, accessible, and responsive user interfaces using Next.js App Router and React",
        "Design clean RESTful and GraphQL backend endpoints integrated with Supabase/PostgreSQL",
        "Implement end-to-end state management, authentication flows, and real-time event updates",
        "Collaborate closely with UI/UX designers to translate Figma design systems into pixel-perfect components",
        "Write unit, integration, and E2E tests to ensure flawless software quality"
    ]'::jsonb,
    '[
        "5+ years of software engineering experience with strong proficiency in TypeScript, React, and Next.js",
        "Solid experience with relational databases (PostgreSQL, Supabase, SQLAlchemy, Prisma)",
        "Deep understanding of web vitals, server-side rendering (SSR), and performance optimization",
        "Experience building modular design systems and Tailwind CSS styling architectures",
        "Strong debugging skills across client and server environments"
    ]'::jsonb,
    '[
        "Competitive compensation package with bonus incentives",
        "Modern Mac or Linux developer hardware of your choice",
        "Flexible working hours and hybrid office access",
        "Full health and wellness benefits",
        "Collaborative and engineering-first company culture"
    ]'::jsonb,
    '$160,000 - $205,000 USD',
    'active'
),
(
    'Lead Cloud Platform & DevSecOps Engineer',
    'lead-cloud-platform-devsecops',
    'Infrastructure',
    'Austin, TX / Remote',
    'Remote',
    'Full-time',
    'Lead (6+ yrs)',
    'Architect automated infrastructure, Kubernetes clusters, and zero-trust CI/CD delivery pipelines.',
    'Join our Infrastructure team to build resilient, automated cloud platforms. You will engineer self-healing Kubernetes clusters, automate security compliance guardrails, and build internal developer platforms that 10x team productivity.',
    '[
        "Architect and maintain production Kubernetes clusters on AWS (EKS) and GCP (GKE)",
        "Write modular, reusable Infrastructure as Code using Terraform, OpenTofu, and Pulumi",
        "Implement automated DevSecOps pipelines with GitOps (ArgoCD), SAST/DAST, and artifact signing",
        "Establish unified observability meshes using Prometheus, Grafana, OpenTelemetry, and Datadog",
        "Lead incident response post-mortems and automate self-healing remediation routines"
    ]'::jsonb,
    '[
        "6+ years experience in cloud infrastructure, site reliability engineering, or platform engineering",
        "Deep expertise with Kubernetes orchestration, service mesh (Istio/Linkerd), and Helm",
        "Demonstrated mastery of Terraform/IaC and modern CI/CD orchestration engines",
        "Strong knowledge of cloud networking, VPC peering, TLS termination, and ZTNA principles",
        "Experience achieving SOC2, HIPAA, or ISO 27001 infrastructure compliance"
    ]'::jsonb,
    '[
        "Top-of-market salary with equity participation",
        "Comprehensive health & wellness coverage",
        "Home office setup budget ($3,000)",
        "Generous parental leave and family support",
        "Annual team offsites in premier global locations"
    ]'::jsonb,
    '$180,000 - $230,000 USD',
    'active'
),
(
    'Senior AI / Applied Machine Learning Engineer',
    'senior-ai-ml-engineer',
    'AI & Data',
    'San Francisco, CA / Remote',
    'Remote',
    'Full-time',
    'Senior (4+ yrs)',
    'Deploy production enterprise LLM pipelines, RAG systems, and distributed GPU inference architectures.',
    'CoralSwift is expanding its Applied AI practice. In this role, you will build production-ready LLM pipelines, implement domain-specific fine-tuning, and optimize low-latency vector search systems for global enterprises.',
    '[
        "Build enterprise-grade RAG architectures with advanced chunking, reranking, and semantic search",
        "Fine-tune and evaluate open-source foundation models (Llama, Mistral, DeepSeek) for specific domains",
        "Deploy high-throughput inference endpoints using vLLM, TensorRT-LLM, and Triton",
        "Implement automated LLM evaluation benchmarks, guardrails, and toxicity filtering",
        "Collaborate with client stakeholders to identify high-ROI AI automation opportunities"
    ]'::jsonb,
    '[
        "4+ years experience in machine learning and software engineering with strong Python/PyTorch skills",
        "Hands-on experience deploying LLMs, vector databases (Qdrant, Pinecone, pgvector), and LangChain/LlamaIndex in production",
        "Solid understanding of distributed GPU computing, CUDA fundamentals, and quantization techniques",
        "Strong foundation in data structures, API design, and cloud deployments",
        "Passion for keeping up with the rapid evolution of generative AI research"
    ]'::jsonb,
    '[
        "Competitive salary + equity package",
        "Access to dedicated GPU clusters for R&D",
        "Remote work freedom with top tier benefits",
        "Conference attendance and paper publishing support"
    ]'::jsonb,
    '$175,000 - $225,000 USD',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Public Site Settings
INSERT INTO public.site_settings (key, value, description) VALUES
(
    'general',
    '{
        "company_name": "CoralSwift",
        "tagline": "Enterprise Software Engineering & High-Scale Systems",
        "contact_email": "contact@coralswift.com",
        "support_email": "enterprise@coralswift.com",
        "phone": "+1 (800) 582-7493",
        "headquarters": "500 Howard Street, Suite 400, San Francisco, CA 94105",
        "established_year": "2020",
        "social_links": {
            "linkedin": "https://linkedin.com/company/coralswift",
            "github": "https://github.com/coralswift",
            "twitter": "https://twitter.com/coralswift"
        }
    }'::jsonb,
    'Core company contact and identity metadata'
),
(
    'metrics',
    '{
        "uptime_sla": "99.999%",
        "tps_processed": "100M+",
        "enterprise_clients": "45+",
        "client_satisfaction": "98%"
    }'::jsonb,
    'Verified public performance and trust metrics'
)
ON CONFLICT (key) DO NOTHING;
