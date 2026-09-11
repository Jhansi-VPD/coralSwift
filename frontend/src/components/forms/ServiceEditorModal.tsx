'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Service } from '@/lib/types';
import { saveService } from '@/lib/api';
import { slugify } from '@/lib/utils';

interface ServiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  onSaved: () => void;
}

export function ServiceEditorModal({ isOpen, onClose, service, onSaved }: ServiceEditorModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Service>>({
    title: '',
    slug: '',
    category: 'Engineering',
    short_description: '',
    overview: '',
    capabilities: [],
    deliverables: [],
    cta_text: 'Discuss Your Architecture',
    icon: 'Cpu',
    status: 'published',
    order_index: 1,
  });

  const [capabilitiesStr, setCapabilitiesStr] = useState('');
  const [deliverablesStr, setDeliverablesStr] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData(service);
      setCapabilitiesStr(service.capabilities ? service.capabilities.join('\n') : '');
      setDeliverablesStr(service.deliverables ? service.deliverables.join('\n') : '');
      setErrors({});
      setTouched({});
    } else {
      setFormData({
        title: '',
        slug: '',
        category: 'Engineering',
        short_description: '',
        overview: '',
        capabilities: [],
        deliverables: [],
        cta_text: 'Discuss Your Architecture',
        icon: 'Cpu',
        status: 'published',
        order_index: 1,
      });
      setCapabilitiesStr('');
      setDeliverablesStr('');
      setErrors({});
      setTouched({});
    }
  }, [service, isOpen]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return 'Service title is required.';
        if (value.trim().length < 3) return 'Title must be at least 3 characters.';
        return '';
      case 'slug':
        if (!value || !value.trim()) return 'URL slug is required.';
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) return 'Slug must contain only lowercase letters, numbers, and hyphens.';
        return '';
      case 'short_description':
        if (!value || !value.trim()) return 'Short description is required.';
        if (value.trim().length < 10) return 'Short description must be at least 10 characters.';
        return '';
      case 'overview':
        if (!value || !value.trim()) return 'Detailed overview is required.';
        if (value.trim().length < 20) return 'Overview must be at least 20 characters.';
        return '';
      case 'capabilities':
        const caps = capabilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
        if (caps.length === 0) return 'Provide at least 1 key capability.';
        return '';
      case 'deliverables':
        const delivs = deliverablesStr.split('\n').map(s => s.trim()).filter(Boolean);
        if (delivs.length === 0) return 'Provide at least 1 tangible deliverable.';
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

    const shortErr = validateField('short_description', formData.short_description);
    if (shortErr) errs.short_description = shortErr;

    const overErr = validateField('overview', formData.overview);
    if (overErr) errs.overview = overErr;

    const capErr = validateField('capabilities', capabilitiesStr);
    if (capErr) errs.capabilities = capErr;

    const delivErr = validateField('deliverables', deliverablesStr);
    if (delivErr) errs.deliverables = delivErr;

    setErrors(errs);
    setTouched({
      title: true,
      slug: true,
      short_description: true,
      overview: true,
      capabilities: true,
      deliverables: true,
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
      const caps = capabilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
      const delivs = deliverablesStr.split('\n').map(s => s.trim()).filter(Boolean);

      await saveService({
        ...formData,
        capabilities: caps,
        deliverables: delivs,
      });

      router.refresh();
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, form: err.message || 'Failed to save service.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? 'Edit Software Service' : 'Add New Software Service'}
      description="Configure public service catalogue item, deliverables, and SEO slug."
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
              Service Title <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g. Distributed Systems & Microservices"
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
              Category
            </label>
            <select
              value={formData.category || 'Engineering'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            >
              <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="DevOps & Security">DevOps & Security</option>
              <option value="Engineering">Engineering</option>
              <option value="Data & Analytics">Data & Analytics</option>
              <option value="Security & Governance">Security & Governance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Status
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

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              min={1}
              value={formData.order_index || 1}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Short Description (Cards) <span className="text-coral-600">*</span>
          </label>
          <textarea
            rows={2}
            value={formData.short_description || ''}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            onBlur={() => handleBlur('short_description')}
            placeholder="One or two concise summary sentences..."
            className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
              touched.short_description && errors.short_description
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
            }`}
          />
          {touched.short_description && errors.short_description && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.short_description}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Detailed Overview (Service Detail Page) <span className="text-coral-600">*</span>
          </label>
          <textarea
            rows={4}
            value={formData.overview || ''}
            onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
            onBlur={() => handleBlur('overview')}
            placeholder="In-depth architectural overview and methodology..."
            className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
              touched.overview && errors.overview
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
            }`}
          />
          {touched.overview && errors.overview && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.overview}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Key Capabilities (1 per line) <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={capabilitiesStr}
              onChange={(e) => setCapabilitiesStr(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, capabilities: true }));
                const err = validateField('capabilities', capabilitiesStr);
                setErrors(prev => {
                  const copy = { ...prev };
                  if (err) copy.capabilities = err;
                  else delete copy.capabilities;
                  return copy;
                });
              }}
              placeholder="Multi-cloud IaC&#10;Zero-downtime cutovers&#10;Chaos engineering"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 transition-colors ${
                touched.capabilities && errors.capabilities
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.capabilities && errors.capabilities && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.capabilities}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Deliverables (1 per line) <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={deliverablesStr}
              onChange={(e) => setDeliverablesStr(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, deliverables: true }));
                const err = validateField('deliverables', deliverablesStr);
                setErrors(prev => {
                  const copy = { ...prev };
                  if (err) copy.deliverables = err;
                  else delete copy.deliverables;
                  return copy;
                });
              }}
              placeholder="Production Kubernetes cluster&#10;Architecture blueprints&#10;CI/CD pipelines"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 transition-colors ${
                touched.deliverables && errors.deliverables
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.deliverables && errors.deliverables && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.deliverables}</span>
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Service
          </Button>
        </div>
      </form>
    </Modal>
  );
}
