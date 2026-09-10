'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CaseStudy } from '@/lib/types';
import { saveCaseStudy } from '@/lib/api';
import { slugify } from '@/lib/utils';

interface CaseStudyEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudy?: CaseStudy | null;
  onSaved: () => void;
}

export function CaseStudyEditorModal({ isOpen, onClose, caseStudy, onSaved }: CaseStudyEditorModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CaseStudy>>({
    title: '',
    slug: '',
    client_name: '',
    industry: 'Financial Services & FinTech',
    project_context: '',
    challenge: '',
    solution: '',
    implementation: '',
    outcome_metrics: [],
    tech_stack: [],
    is_featured: false,
    status: 'published',
  });

  const [techStackStr, setTechStackStr] = useState('');
  const [metricsStr, setMetricsStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (caseStudy) {
      setFormData(caseStudy);
      setTechStackStr(caseStudy.tech_stack ? caseStudy.tech_stack.join(', ') : '');
      setMetricsStr(
        caseStudy.outcome_metrics
          ? caseStudy.outcome_metrics.map(m => `${m.metric} | ${m.label}`).join('\n')
          : ''
      );
    } else {
      setFormData({
        title: '',
        slug: '',
        client_name: '',
        industry: 'Financial Services & FinTech',
        project_context: '',
        challenge: '',
        solution: '',
        implementation: '',
        outcome_metrics: [],
        tech_stack: [],
        is_featured: false,
        status: 'published',
      });
      setTechStackStr('PostgreSQL, Next.js, Kafka, Kubernetes');
      setMetricsStr('99.999% | Production Uptime Verified\n42,000+ | Peak TPS Scaled');
    }
  }, [caseStudy, isOpen]);

  const handleTitleChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: prev.id ? prev.slug : slugify(val)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const techStack = techStackStr.split(',').map(s => s.trim()).filter(Boolean);
      const outcomeMetrics = metricsStr.split('\n').map(line => {
        const parts = line.split('|');
        return {
          metric: parts[0]?.trim() || '',
          label: parts[1]?.trim() || ''
        };
      }).filter(m => m.metric && m.label);

      await saveCaseStudy({
        ...formData,
        tech_stack: techStack,
        outcome_metrics: outcomeMetrics,
      });

      router.refresh();
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={caseStudy ? 'Edit Enterprise Case Study' : 'Publish New Case Study'}
      description="Document client architecture transformations, challenges, and verified metrics."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Case Study Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Next-Gen High-Frequency Payment Processing Core"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Client / Organization *
            </label>
            <input
              type="text"
              required
              value={formData.client_name || ''}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="e.g. Apex Financial Global"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Industry Vertical
            </label>
            <input
              type="text"
              value={formData.industry || ''}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Financial Services & FinTech"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Publication Status
            </label>
            <select
              value={formData.status || 'published'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Project Context & Background *
          </label>
          <textarea
            rows={2}
            required
            value={formData.project_context || ''}
            onChange={(e) => setFormData({ ...formData, project_context: e.target.value })}
            placeholder="Overview of the client business scope and transaction volume..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              The Challenge *
            </label>
            <textarea
              rows={3}
              required
              value={formData.challenge || ''}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              placeholder="Monolith bottleneck, latency spikes, or compliance debt..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Engineered Solution *
            </label>
            <textarea
              rows={3}
              required
              value={formData.solution || ''}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              placeholder="Architectural solution, CQRS, multi-cloud Kubernetes, etc..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Implementation Summary
          </label>
          <textarea
            rows={2}
            value={formData.implementation || ''}
            onChange={(e) => setFormData({ ...formData, implementation: e.target.value })}
            placeholder="Execution waves, canary cutover methodology, idempotency keys..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Verified Metrics (Format: Metric | Label per line)
            </label>
            <textarea
              rows={3}
              value={metricsStr}
              onChange={(e) => setMetricsStr(e.target.value)}
              placeholder="99.999% | Uptime SLA&#10;42,000+ | Peak TPS Scaled&#10;18ms | P99 Settlement"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Tech Stack (Comma-separated)
            </label>
            <textarea
              rows={3}
              value={techStackStr}
              onChange={(e) => setTechStackStr(e.target.value)}
              placeholder="PostgreSQL, Next.js, Apache Kafka, Go, Kubernetes, Redis, AWS"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_featured"
            checked={!!formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-coral-600 focus:ring-coral-500"
          />
          <label htmlFor="is_featured" className="text-xs text-slate-700 font-medium cursor-pointer">
            Feature this case study prominently on the Homepage
          </label>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Case Study
          </Button>
        </div>
      </form>
    </Modal>
  );
}
