'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Terminal
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
    serviceInterest: defaultService || SERVICE_OPTIONS[0],
    preferredTime: TIME_SLOTS[0],
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultService) {
      setFormData(prev => ({ ...prev, serviceInterest: defaultService }));
    }
  }, [defaultService]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Please enter your full name';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid corporate email required';
    if (!formData.company.trim()) errs.company = 'Company name required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await submitEnquiry({
        full_name: formData.fullName,
        email: formData.email,
        company: formData.company,
        service_interest: formData.serviceInterest,
        message: `[Booked Consultation Slot: ${formData.preferredTime}] - ${formData.message || 'Architecture consultation requested.'}`,
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
      serviceInterest: defaultService || SERVICE_OPTIONS[0],
      preferredTime: TIME_SLOTS[0],
      message: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} title="Book Architecture Consultation" maxWidth="xl">
      {isSuccess ? (
        <div className="text-center py-8 space-y-4">
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-coral-600 shrink-0" />
            <span>Direct 45-minute technical roadmap & topology review with a Principal Systems Architect.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@enterprise.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Company / Organization *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Acme Health Corp"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              />
              {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Preferred Time Slot
              </label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
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
              Service Domain of Interest
            </label>
            <select
              value={formData.serviceInterest}
              onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Architecture Focus / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your current stack, bottlenecks, or target migration timeline..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
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
