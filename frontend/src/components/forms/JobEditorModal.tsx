'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Job } from '@/lib/types';
import { saveJob } from '@/lib/api';
import { slugify } from '@/lib/utils';

interface JobEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  onSaved: () => void;
}

export function JobEditorModal({ isOpen, onClose, job, onSaved }: JobEditorModalProps) {
  const [formData, setFormData] = useState<Partial<Job>>({
    title: '',
    slug: '',
    department: 'Engineering',
    location: 'San Francisco, CA / Remote',
    work_model: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Senior (5+ yrs)',
    short_description: '',
    description: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    salary_range: '',
    status: 'active',
  });

  const [responsibilitiesStr, setResponsibilitiesStr] = useState('');
  const [requirementsStr, setRequirementsStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData(job);
      setResponsibilitiesStr(job.responsibilities ? job.responsibilities.join('\n') : '');
      setRequirementsStr(job.requirements ? job.requirements.join('\n') : '');
    } else {
      setFormData({
        title: '',
        slug: '',
        department: 'Engineering',
        location: 'San Francisco, CA / Remote',
        work_model: 'Remote',
        employment_type: 'Full-time',
        experience_level: 'Senior (5+ yrs)',
        short_description: '',
        description: '',
        responsibilities: [],
        requirements: [],
        benefits: [],
        salary_range: '$180,000 - $240,000 USD',
        status: 'active',
      });
      setResponsibilitiesStr('');
      setRequirementsStr('');
    }
  }, [job, isOpen]);

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
      const resp = responsibilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
      const reqs = requirementsStr.split('\n').map(s => s.trim()).filter(Boolean);

      await saveJob({
        ...formData,
        responsibilities: resp,
        requirements: reqs,
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
      title={job ? 'Edit Job Opening' : 'Publish New Career Opportunity'}
      description="Define job roles, requirements, and candidate expectations."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Lead Platform Engineer"
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
              Department
            </label>
            <input
              type="text"
              value={formData.department || 'Engineering'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Work Model
            </label>
            <select
              value={formData.work_model || 'Remote'}
              onChange={(e) => setFormData({ ...formData, work_model: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            >
              <option value="active">Active (Accepting Applications)</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Location / Timezone
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA / Remote"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Compensation Range
            </label>
            <input
              type="text"
              value={formData.salary_range || ''}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="$180,000 - $240,000 USD + Equity"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Short Summary *
          </label>
          <input
            type="text"
            required
            value={formData.short_description || ''}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="High-level summary for the careers card..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Role Overview & Mission *
          </label>
          <textarea
            rows={3}
            required
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of team goals, daily work, and engineering culture..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Key Responsibilities (1 per line)
            </label>
            <textarea
              rows={3}
              value={responsibilitiesStr}
              onChange={(e) => setResponsibilitiesStr(e.target.value)}
              placeholder="Design distributed systems&#10;Author technical RFCs&#10;Mentor engineering squads"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Requirements & Skills (1 per line)
            </label>
            <textarea
              rows={3}
              value={requirementsStr}
              onChange={(e) => setRequirementsStr(e.target.value)}
              placeholder="5+ years Go/Rust/TypeScript&#10;Kafka & PostgreSQL experience&#10;Multi-region cloud"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Job Opening
          </Button>
        </div>
      </form>
    </Modal>
  );
}
