import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch (e) {
    return dateString;
  }
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SERVICE_OPTIONS = [
  'Cloud Architecture & Modernization',
  'AI & Applied Machine Learning Solutions',
  'Enterprise DevSecOps & Platform Engineering',
  'Distributed Systems & High-Throughput Microservices',
  'Enterprise Data Engineering & Real-time Analytics',
  'Cybersecurity & Zero-Trust Architecture',
  'General Enterprise Consultation'
] as const;

export type ServiceOption = typeof SERVICE_OPTIONS[number];

/**
 * Maps URL slugs, industry keywords, and partial service strings to canonical SERVICE_OPTIONS.
 */
export function mapToServiceOption(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. Exact match against canonical options
  const exact = SERVICE_OPTIONS.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;

  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 2. Slug & Keyword mapping table
  const keywordMappings: { keywords: string[]; option: ServiceOption }[] = [
    {
      keywords: [
        'cloud',
        'cloudarchitecture',
        'cloudmodernization',
        'cloudarchitecturemodernization',
        'multicloud',
        'aws',
        'gcp',
        'azure',
        'kubernetes',
        'infra',
        'infrastructure'
      ],
      option: 'Cloud Architecture & Modernization'
    },
    {
      keywords: [
        'ai',
        'machinelearning',
        'appliedai',
        'aiappliedmachinelearning',
        'aiappliedmachinelearningsolutions',
        'llm',
        'rag',
        'genai',
        'generativeai',
        'deeplearning',
        'logistics',
        'supplychain'
      ],
      option: 'AI & Applied Machine Learning Solutions'
    },
    {
      keywords: [
        'devsecops',
        'devops',
        'platform',
        'platformengineering',
        'enterprisedevsecops',
        'enterprisedevsecopsplatformengineering',
        'gitops',
        'cicd',
        'terraform'
      ],
      option: 'Enterprise DevSecOps & Platform Engineering'
    },
    {
      keywords: [
        'distributedsystems',
        'microservices',
        'distributedsystemsmicroservices',
        'distributedsystemshighthroughputmicroservices',
        'highthroughput',
        'fintech',
        'payment',
        'payments',
        'banking',
        'financialservices',
        'kafka',
        'concurrency'
      ],
      option: 'Distributed Systems & High-Throughput Microservices'
    },
    {
      keywords: [
        'data',
        'analytics',
        'dataengineering',
        'enterprisedataengineering',
        'enterprisedataengineeringanalytics',
        'realtimedata',
        'datamesh',
        'datalake',
        'warehouse',
        'retail',
        'ecommerce',
        'dbt',
        'snowflake',
        'clickhouse'
      ],
      option: 'Enterprise Data Engineering & Real-time Analytics'
    },
    {
      keywords: [
        'cybersecurity',
        'zerotrust',
        'security',
        'cybersecurityzerotrust',
        'cybersecurityzerotrustarchitecture',
        'compliance',
        'healthcare',
        'healthtech',
        'hipaa',
        'soc2',
        'pci',
        'lifesciences'
      ],
      option: 'Cybersecurity & Zero-Trust Architecture'
    },
    {
      keywords: [
        'general',
        'consultation',
        'enterprise',
        'generalenterpriseconsultation',
        'advisory',
        'audit'
      ],
      option: 'General Enterprise Consultation'
    }
  ];

  for (const mapping of keywordMappings) {
    for (const kw of mapping.keywords) {
      if (normalized === kw || normalized.includes(kw) || kw.includes(normalized)) {
        return mapping.option;
      }
    }
  }

  // 3. Fallback partial substring check in canonical titles
  const partial = SERVICE_OPTIONS.find((opt) => {
    const optNorm = opt.toLowerCase().replace(/[^a-z0-9]/g, '');
    return optNorm.includes(normalized) || normalized.includes(optNorm);
  });
  if (partial) return partial;

  return '';
}

