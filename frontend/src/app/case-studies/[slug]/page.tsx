import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCaseStudyBySlug, getCaseStudies } from '@/lib/api';
import { 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Cpu, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { CaseStudyDetailClient } from './CaseStudyDetailClient';

interface CaseStudyDetailPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  const study = await getCaseStudyBySlug(params.slug);
  if (!study) return { title: 'Case Study Not Found' };

  return {
    title: `${study.title} | CoralSwift Case Studies`,
    description: study.project_context,
    openGraph: {
      title: `${study.title} - CoralSwift Enterprise Case Study`,
      description: study.project_context,
    }
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  const study = await getCaseStudyBySlug(params.slug);
  if (!study || study.status !== 'published') {
    notFound();
  }

  return <CaseStudyDetailClient study={study} />;
}
