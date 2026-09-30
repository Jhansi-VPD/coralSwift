const { createClient } = require('@supabase/supabase-js');

const url = 'https://qfhtrgrovpjxfurxhqtu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHRyZ3JvdnBqeGZ1cnhocXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjI3NjMsImV4cCI6MjEwNDQzODc2M30.jMqmlvz1W24blvYxtTgIovF9jDmunbCPHRjDnaZa5K0';
const supabase = createClient(url, key);

const initialCaseStudies = [
  {
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
    is_featured: true,
    status: 'published'
  },
  {
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
    is_featured: true,
    status: 'published'
  },
  {
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
    is_featured: true,
    status: 'published'
  },
  {
    title: 'Unified Enterprise Data Mesh & Real-Time Intelligence',
    slug: 'retail-data-mesh-intelligence',
    client_name: 'Starlight Retail Enterprises',
    industry: 'Retail & E-Commerce',
    project_context: 'Starlight operates 1,400 brick-and-mortar stores alongside a high-volume omnichannel e-commerce store with over $12B in gross merchandise volume.',
    challenge: 'Siloed data warehouses delayed inventory replenishment by 36 hours, caused frequent stockouts during peak promotional sales, and prevented real-time personalization.',
    solution: 'Designed and deployed a domain-oriented decentralized data mesh architecture with real-time change data capture (CDC) streaming into Delta Lake and Apache Iceberg.',
    implementation: 'Created 8 decentralized domain data products with standardized governance SLAs, sub-second change data capture using Debezium, and an automated data quality validation harness.',
    outcome_metrics: [
      { metric: 'Sub-second', label: 'Inventory Telemetry Freshness (Down from 36h)' },
      { metric: '$22.5M', label: 'Inventory Waste Reduction Annualized' },
      { metric: '48%', label: 'Increase in Same-Day Fulfillment Rate' },
      { metric: '99.98%', label: 'Data Contract Pipeline Uptime' }
    ],
    tech_stack: ['Apache Iceberg', 'Delta Lake', 'Debezium', 'Kafka', 'ClickHouse', 'Next.js', 'Python', 'AWS'],
    is_featured: false,
    status: 'published'
  }
];

async function run() {
  const { data: existing } = await supabase.from('case_studies').select('slug');
  const existingSlugs = new Set((existing || []).map(e => e.slug));

  for (const cs of initialCaseStudies) {
    if (!existingSlugs.has(cs.slug)) {
      console.log('Inserting case study:', cs.title);
      const { error } = await supabase.from('case_studies').insert(cs);
      if (error) console.error('Error:', error);
      else console.log('Successfully inserted:', cs.slug);
    } else {
      console.log('Already exists:', cs.slug);
    }
  }
}
run();
