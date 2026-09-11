'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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
      setErrors({});
      setTouched({});
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
      setErrors({});
      setTouched({});
    }
  }, [caseStudy, isOpen]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return 'Case study title is required.';
        if (value.trim().length < 3) return 'Title must be at least 3 characters.';
        return '';
      case 'slug':
        if (!value || !value.trim()) return 'URL slug is required.';
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) return 'Slug must contain only lowercase letters, numbers, and hyphens.';
        return '';
      case 'client_name':
        if (!value || !value.trim()) return 'Client or organization name is required.';
        return '';
      case 'project_context':
        if (!value || !value.trim()) return 'Project background & context is required.';
        if (value.trim().length < 15) return 'Context must be at least 15 characters.';
        return '';
      case 'challenge':
        if (!value || !value.trim()) return 'The challenge description is required.';
        if (value.trim().length < 15) return 'Challenge must be at least 15 characters.';
        return '';
      case 'solution':
        if (!value || !value.trim()) return 'The engineered solution is required.';
        if (value.trim().length < 15) return 'Solution must be at least 15 characters.';
        return '';
      case 'outcome_metrics':
        const metrics = metricsStr.split('\n').map(line => {
          const parts = line.split('|');
          return { metric: parts[0]?.trim(), label: parts[1]?.trim() };
        }).filter(m => m.metric && m.label);
        if (metrics.length === 0) return 'Provide at least 1 outcome metric in format: Metric | Label (e.g., 99.99% | Uptime).';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    const titleErr = validateField('title', formData.title);
    if (titleErr) errs.title = titleErr;

    const slugErr = validateField('slug', formData.slug);
    if (slugErr) errs.slug = slugErr;

    const clientErr = validateField('client_name', formData.client_name);
    if (clientErr) errs.client_name = clientErr;

    const contextErr = validateField('project_context', formData.project_context);
    if (contextErr) errs.project_context = contextErr;

    const chalErr = validateField('challenge', formData.challenge);
    if (chalErr) errs.challenge = chalErr;

    const solErr = validateField('solution', formData.solution);
    if (solErr) errs.solution = solErr;

    const metricErr = validateField('outcome_metrics', metricsStr);
    if (metricErr) errs.outcome_metrics = metricErr;

    setErrors(errs);
    setTouched({
      title: true,
      slug: true,
      client_name: true,
      project_context: true,
      challenge: true,
      solution: true,
      outcome_metrics: true,
    });
    return Object.keys(errs).length === 0;
  };

  const handleTitleChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: prev.id ? prev.slug : slugify(val)
    }));
    if (touched.title) {
      const err = validateField('title', val);
      setErrors(prev => {
        const copy = { ...prev };
        if (err) copy.title = err;
        else delete copy.title;
        return copy;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field]);
    setErrors(prev => {
      const copy = { ...prev };
      if (err) copy[field] = err;
      else delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

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
    } catch (err: any) {
      setErrors(prev => ({ ...prev, form: err.message || 'Failed to save case study.' }));
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
      <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
        {errors.form && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Case Study Title <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g. Next-Gen High-Frequency Payment Processing Core"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.title && errors.title
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.title && errors.title && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              URL Slug <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              onBlur={() => handleBlur('slug')}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 font-mono transition-colors ${
                touched.slug && errors.slug
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.slug && errors.slug && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.slug}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Client / Organization <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.client_name || ''}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              onBlur={() => handleBlur('client_name')}
              placeholder="e.g. Apex Financial Global"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.client_name && errors.client_name
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.client_name && errors.client_name && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.client_name}</span>
              </p>
            )}
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
            Project Context & Background <span className="text-coral-600">*</span>
          </label>
          <textarea
            rows={2}
            value={formData.project_context || ''}
            onChange={(e) => setFormData({ ...formData, project_context: e.target.value })}
            onBlur={() => handleBlur('project_context')}
            placeholder="Overview of the client business scope and transaction volume..."
            className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
              touched.project_context && errors.project_context
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
            }`}
          />
          {touched.project_context && errors.project_context && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.project_context}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              The Challenge <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.challenge || ''}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              onBlur={() => handleBlur('challenge')}
              placeholder="Monolith bottleneck, latency spikes, or compliance debt..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.challenge && errors.challenge
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.challenge && errors.challenge && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.challenge}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Engineered Solution <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.solution || ''}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              onBlur={() => handleBlur('solution')}
              placeholder="Architectural solution, CQRS, multi-cloud Kubernetes, etc..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.solution && errors.solution
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.solution && errors.solution && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.solution}</span>
              </p>
            )}
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
              Verified Metrics (Format: Metric | Label per line) <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={metricsStr}
              onChange={(e) => setMetricsStr(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, outcome_metrics: true }));
                const err = validateField('outcome_metrics', metricsStr);
                setErrors(prev => {
                  const copy = { ...prev };
                  if (err) copy.outcome_metrics = err;
                  else delete copy.outcome_metrics;
                  return copy;
                });
              }}
              placeholder="99.999% | Uptime SLA&#10;42,000+ | Peak TPS Scaled"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 transition-colors ${
                touched.outcome_metrics && errors.outcome_metrics
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.outcome_metrics && errors.outcome_metrics && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.outcome_metrics}</span>
              </p>
            )}
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
