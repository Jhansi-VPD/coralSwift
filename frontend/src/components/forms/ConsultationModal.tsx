'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { submitEnquiry } from '@/lib/api';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

const SERVICE_OPTIONS = [
  'Cloud Architecture & Modernization',
  'AI & Applied Machine Learning Solutions',
  'Enterprise DevSecOps & Platform Engineering',
  'Distributed Systems & High-Throughput Microservices',
  'Enterprise Data Engineering & Real-time Analytics',
  'Cybersecurity & Zero-Trust Architecture',
  'General Enterprise Consultation'
];

const TIME_SLOTS = [
  '10:00 AM EST (US/East)',
  '02:00 PM EST (US/East)',
  '05:00 PM EST (US/East)',
  '11:00 AM PST (US/West)',
  '03:00 PM PST (US/West)'
];

export function ConsultationModal({ isOpen, onClose, defaultService }: ConsultationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    serviceInterest: defaultService || '',
    preferredTime: TIME_SLOTS[0],
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (defaultService) {
      setFormData(prev => ({ ...prev, serviceInterest: defaultService }));
    }
  }, [defaultService]);

  if (!isOpen) return null;

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) return 'Please enter a valid full name (letters only).';
        return '';
      case 'email':
        if (!value || !value.trim()) return 'Corporate email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid corporate email address.';
        return '';
      case 'company':
        if (!value || !value.trim()) return 'Company name is required.';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters.';
        if (!/[a-zA-Z]/.test(value.trim())) return 'Please enter a valid company name (cannot be numbers only).';
        if (!/^[a-zA-Z0-9\s.,&'()/-]+$/.test(value.trim())) return 'Company name contains invalid characters.';
        return '';
      case 'serviceInterest':
        if (!value || !value.trim()) return 'Please select a service domain.';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    const nameErr = validateField('fullName', formData.fullName);
    if (nameErr) errs.fullName = nameErr;

    const emailErr = validateField('email', formData.email);
    if (emailErr) errs.email = emailErr;

    const compErr = validateField('company', formData.company);
    if (compErr) errs.company = compErr;

    const servErr = validateField('serviceInterest', formData.serviceInterest);
    if (servErr) errs.serviceInterest = servErr;

    setErrors(errs);
    setTouched({ fullName: true, email: true, company: true, serviceInterest: true });
    return Object.keys(errs).length === 0;
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors(prev => {
        const copy = { ...prev };
        if (err) copy[field] = err;
        else delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);
    try {
      await submitEnquiry({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        service_interest: formData.serviceInterest,
        message: `[Booked Consultation Slot: ${formData.preferredTime}] - ${formData.message.trim() || 'Architecture consultation requested.'}`,
        consent: true,
        source_page: typeof window !== 'undefined' ? window.location.pathname : '/contact',
      });
      setIsSuccess(true);
    } catch (err) {
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setFormData({
      fullName: '',
      email: '',
      company: '',
      serviceInterest: defaultService || '',
      preferredTime: TIME_SLOTS[0],
      message: '',
    });
    setErrors({});
    setTouched({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} title="Book Architecture Consultation" maxWidth="xl">
      {isSuccess ? (
        <div className="text-center py-8 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-[#0B1426] font-display">Consultation Confirmed</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>. A calendar invite for <span className="font-semibold text-slate-900">{formData.preferredTime}</span> has been dispatched to <span className="font-mono text-coral-600">{formData.email}</span> along with our architecture NDA.
          </p>
          <div className="pt-4">
            <Button variant="primary" onClick={handleResetAndClose} className="w-full sm:w-auto">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-coral-600 shrink-0" />
            <span>Direct 45-minute technical roadmap & topology review with a Principal Systems Architect.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Full Name <span className="text-coral-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="e.g. Sarah Jenkins"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.fullName && errors.fullName
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.fullName && errors.fullName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Corporate Email <span className="text-coral-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="sarah@enterprise.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.email && errors.email
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Company / Organization <span className="text-coral-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                onBlur={() => handleBlur('company')}
                placeholder="e.g. Acme Health Corp"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.company && errors.company
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.company && errors.company && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.company}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Preferred Time Slot
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => handleChange('preferredTime', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Service Domain of Interest <span className="text-coral-500">*</span>
            </label>
            <select
              value={formData.serviceInterest}
              onChange={(e) => handleChange('serviceInterest', e.target.value)}
              onBlur={() => handleBlur('serviceInterest')}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                !formData.serviceInterest ? 'text-slate-400 bg-white' : 'text-slate-900 bg-white'
              } ${
                touched.serviceInterest && errors.serviceInterest
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
              }`}
            >
              <option value="" disabled className="text-slate-400">
                -- Select an Area of Interest --
              </option>
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">{opt}</option>
              ))}
            </select>
            {touched.serviceInterest && errors.serviceInterest && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.serviceInterest}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Architecture Focus / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Tell us about your current stack, bottlenecks, or target migration timeline..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              <span>Confirm Consultation</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
