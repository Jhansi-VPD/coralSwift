import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  getServiceBySlug, 
  getServices, 
  getCaseStudies 
} from '@/lib/api';
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  Workflow, 
  PackageCheck, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { ServiceDetailClient } from './ServiceDetailClient';

interface ServiceDetailPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: 'Service Not Found' };

  return {
    title: service.meta_title || `${service.title} | CoralSwift Services`,
    description: service.meta_description || service.short_description,
    openGraph: {
      title: `${service.title} - CoralSwift Enterprise Services`,
      description: service.short_description,
    }
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = await getServiceBySlug(params.slug);
  if (!service || service.status !== 'published') {
    notFound();
  }

  const allCaseStudies = await getCaseStudies();
  const relatedCaseStudies = allCaseStudies.filter(
    (cs) => cs.related_service_slug === service.slug
  );

  return (
    <ServiceDetailClient
      service={service}
      relatedCaseStudies={relatedCaseStudies}
    />
  );
}
