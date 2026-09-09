import { MetadataRoute } from 'next';
import { initialServices, initialCaseStudies, initialJobs } from '@/lib/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://coralswift.com';

  const staticPages = [
    '',
    '/services',
    '/case-studies',
    '/about',
    '/careers',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const servicePages = initialServices.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(service.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const caseStudyPages = initialCaseStudies.map((study) => ({
    url: `${baseUrl}/case-studies/${study.slug}`,
    lastModified: new Date(study.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  const careerPages = initialJobs.map((job) => ({
    url: `${baseUrl}/careers/${job.slug || job.id}`,
    lastModified: new Date(job.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...servicePages, ...caseStudyPages, ...careerPages];
}
