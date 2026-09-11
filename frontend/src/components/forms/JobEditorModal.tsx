'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
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
  const router = useRouter();
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
  const [benefitsStr, setBenefitsStr] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData(job);
      setResponsibilitiesStr(job.responsibilities ? job.responsibilities.join('\n') : '');
      setRequirementsStr(job.requirements ? job.requirements.join('\n') : '');
      setBenefitsStr(job.benefits ? job.benefits.join('\n') : '');
      setErrors({});
      setTouched({});
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
      setBenefitsStr('');
      setErrors({});
      setTouched({});
    }
  }, [job, isOpen]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return 'Job title is required.';
        if (value.trim().length < 3) return 'Title must be at least 3 characters.';
        return '';
      case 'slug':
        if (!value || !value.trim()) return 'URL slug is required.';
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) return 'Slug must contain only lowercase letters, numbers, and hyphens.';
        return '';
      case 'department':
        if (!value || !value.trim()) return 'Department is required.';
        return '';
      case 'location':
        if (!value || !value.trim()) return 'Location is required.';
        return '';
      case 'short_description':
        if (!value || !value.trim()) return 'Short summary is required.';
        if (value.trim().length < 10) return 'Summary must be at least 10 characters.';
        return '';
      case 'description':
        if (!value || !value.trim()) return 'Detailed role overview is required.';
        if (value.trim().length < 20) return 'Description must be at least 20 characters.';
        return '';
      case 'responsibilities':
        const resp = responsibilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
        if (resp.length === 0) return 'Provide at least 1 key responsibility.';
        return '';
      case 'requirements':
        const reqs = requirementsStr.split('\n').map(s => s.trim()).filter(Boolean);
        if (reqs.length === 0) return 'Provide at least 1 role requirement.';
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

    const deptErr = validateField('department', formData.department);
    if (deptErr) errs.department = deptErr;

    const locErr = validateField('location', formData.location);
    if (locErr) errs.location = locErr;

    const shortErr = validateField('short_description', formData.short_description);
    if (shortErr) errs.short_description = shortErr;

    const descErr = validateField('description', formData.description);
    if (descErr) errs.description = descErr;

    const respErr = validateField('responsibilities', responsibilitiesStr);
    if (respErr) errs.responsibilities = respErr;

    const reqErr = validateField('requirements', requirementsStr);
    if (reqErr) errs.requirements = reqErr;

    setErrors(errs);
    setTouched({
      title: true,
      slug: true,
      department: true,
      location: true,
      short_description: true,
      description: true,
      responsibilities: true,
      requirements: true,
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
      const resp = responsibilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);
      const reqs = requirementsStr.split('\n').map(s => s.trim()).filter(Boolean);
      const bens = benefitsStr.split('\n').map(s => s.trim()).filter(Boolean);

      await saveJob({
        ...formData,
        responsibilities: resp,
        requirements: reqs,
        benefits: bens,
      });

      router.refresh();
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, form: err.message || 'Failed to save job opening.' }));
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
              Job Title <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g. Lead Platform Engineer"
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
              Department <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.department || 'Engineering'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              onBlur={() => handleBlur('department')}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.department && errors.department
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.department && errors.department && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.department}</span>
              </p>
            )}
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
              Location / Timezone <span className="text-coral-600">*</span>
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              onBlur={() => handleBlur('location')}
              placeholder="San Francisco, CA / Remote"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
                touched.location && errors.location
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.location && errors.location && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.location}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Compensation Range (Optional)
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
            Short Summary <span className="text-coral-600">*</span>
          </label>
          <input
            type="text"
            value={formData.short_description || ''}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            onBlur={() => handleBlur('short_description')}
            placeholder="High-level summary for the careers card..."
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
            Role Overview & Mission <span className="text-coral-600">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onBlur={() => handleBlur('description')}
            placeholder="Detailed description of team goals, daily work, and engineering culture..."
            className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors ${
              touched.description && errors.description
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
            }`}
          />
          {touched.description && errors.description && (
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Key Responsibilities (1 per line) <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={responsibilitiesStr}
              onChange={(e) => setResponsibilitiesStr(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, responsibilities: true }));
                const err = validateField('responsibilities', responsibilitiesStr);
                setErrors(prev => {
                  const copy = { ...prev };
                  if (err) copy.responsibilities = err;
                  else delete copy.responsibilities;
                  return copy;
                });
              }}
              placeholder="Design distributed systems&#10;Author technical RFCs&#10;Mentor engineering squads"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 transition-colors ${
                touched.responsibilities && errors.responsibilities
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.responsibilities && errors.responsibilities && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.responsibilities}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
              Requirements & Skills (1 per line) <span className="text-coral-600">*</span>
            </label>
            <textarea
              rows={3}
              value={requirementsStr}
              onChange={(e) => setRequirementsStr(e.target.value)}
              onBlur={() => {
                setTouched(prev => ({ ...prev, requirements: true }));
                const err = validateField('requirements', requirementsStr);
                setErrors(prev => {
                  const copy = { ...prev };
                  if (err) copy.requirements = err;
                  else delete copy.requirements;
                  return copy;
                });
              }}
              placeholder="5+ years Go/Rust/TypeScript&#10;Kafka & PostgreSQL experience&#10;Multi-region cloud"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 transition-colors ${
                touched.requirements && errors.requirements
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.requirements && errors.requirements && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.requirements}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
            Compensation Perks & Benefits (1 per line)
          </label>
          <textarea
            rows={3}
            value={benefitsStr}
            onChange={(e) => setBenefitsStr(e.target.value)}
            placeholder="Comprehensive Health, Dental & Vision insurance&#10;$3,000 annual learning stipend&#10;Generous 401(k) matching"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
          />
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
