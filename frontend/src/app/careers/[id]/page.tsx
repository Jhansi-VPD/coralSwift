import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobByIdOrSlug, getJobs } from '@/lib/api';
import { JobDetailClient } from './JobDetailClient';

interface JobDetailPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const job = await getJobByIdOrSlug(params.id);
  if (!job) return { title: 'Position Not Found' };

  return {
    title: `${job.title} | Careers at CoralSwift`,
    description: job.short_description,
    openGraph: {
      title: `${job.title} - CoralSwift Engineering Careers`,
      description: job.short_description,
    }
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = await getJobByIdOrSlug(params.id);
  if (!job || job.status !== 'active') {
    notFound();
  }

  return <JobDetailClient job={job} />;
}
