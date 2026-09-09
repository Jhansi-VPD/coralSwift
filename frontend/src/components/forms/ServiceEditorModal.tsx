'use client';

import React, { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData(service);
      setCapabilitiesStr(service.capabilities ? service.capabilities.join('\n') : '');
      setDeliverablesStr(service.deliverables ? service.deliverables.join('\n') : '');
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
    }
  }, [service, isOpen]);

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
      const caps = capabilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
      const delivs = deliverablesStr.split('\n').map(s => s.trim()).filter(Boolean);

      await saveService({
        ...formData,
        capabilities: caps,
        deliverables: delivs,
      });

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
      title={service ? 'Edit Software Service' : 'Add New Software Service'}
      description="Configure public service catalogue item, deliverables, and SEO slug."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Distributed Systems & Microservices"
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
              value={formData.order_index || 1}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Short Description (Cards) *
          </label>
          <textarea
            rows={2}
            required
            value={formData.short_description || ''}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="One or two concise summary sentences..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Detailed Overview (Service Detail Page) *
          </label>
          <textarea
            rows={4}
            required
            value={formData.overview || ''}
            onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
            placeholder="In-depth architectural overview and methodology..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Key Capabilities (1 per line)
            </label>
            <textarea
              rows={3}
              value={capabilitiesStr}
              onChange={(e) => setCapabilitiesStr(e.target.value)}
              placeholder="Multi-cloud IaC&#10;Zero-downtime cutovers&#10;Chaos engineering"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Deliverables (1 per line)
            </label>
            <textarea
              rows={3}
              value={deliverablesStr}
              onChange={(e) => setDeliverablesStr(e.target.value)}
              placeholder="Production Kubernetes cluster&#10;Architecture blueprints&#10;CI/CD pipelines"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
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
