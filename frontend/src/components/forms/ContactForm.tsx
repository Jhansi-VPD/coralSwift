'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitEnquiry } from '@/lib/api';

const SERVICE_OPTIONS = [
  'Cloud Architecture & Modernization',
  'AI & Applied Machine Learning Solutions',
  'Enterprise DevSecOps & Platform Engineering',
  'Distributed Systems & High-Throughput Microservices',
  'Enterprise Data Engineering & Real-time Analytics',
  'Cybersecurity & Zero-Trust Architecture',
  'General Enterprise Consultation'
];

interface ContactFormProps {
  initialService?: string;
  sourcePage?: string;
}

export function ContactForm({ initialService = '', sourcePage = '/contact' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    serviceInterest: initialService || SERVICE_OPTIONS[0],
    message: '',
    consent: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name.';
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid corporate email address.';
    }

    if (!formData.company.trim() || formData.company.trim().length < 2) {
      newErrors.company = 'Company name is required for enterprise enquiries.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide brief details about your requirements (minimum 10 characters).';
    }

    if (!formData.consent) {
      newErrors.consent = 'Consent is required to process your enquiry.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await submitEnquiry({
        full_name: formData.fullName,
        email: formData.email,
        company: formData.company,
        phone: formData.phone || undefined,
        service_interest: formData.serviceInterest,
        message: formData.message,
        consent: formData.consent,
        source_page: sourcePage,
      });

      if (response.success) {
        setIsSuccess(true);
        setSuccessMessage(response.message);
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-xl text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-extrabold text-[#0B1426] font-display mb-2">
          Consultation Request Confirmed
        </h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
          {successMessage}
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 max-w-sm mx-auto mb-6">
          <span>Priority dispatch: Engineering Leadership notified</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              fullName: '',
              email: '',
              company: '',
              phone: '',
              serviceInterest: SERVICE_OPTIONS[0],
              message: '',
              consent: true,
            });
          }}
        >
          Submit Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-xl">
      <h3 className="text-2xl font-extrabold text-[#0B1426] mb-2 font-display">
        Start an Architecture Consultation
      </h3>
      <p className="text-sm text-slate-600 mb-8">
        Tell us about your systems requirements. Our engineering team will review and respond within 1 business day.
      </p>

      {errors.form && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
            Full Name <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Eleanor Vance"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors ${
              errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          {errors.fullName && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.fullName}</p>}
        </div>

        {/* Corporate Email */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
            Work Email <span className="text-coral-500">*</span>
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors ${
              errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
            Company Name <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Apex Global Corp"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors ${
              errors.company ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
            }`}
          />
          {errors.company && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.company}</p>}
        </div>

        {/* Phone Number (Optional) */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
          />
        </div>
      </div>

      {/* Service Interest Dropdown */}
      <div className="mb-5">
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
          Area of Interest
        </label>
        <select
          value={formData.serviceInterest}
          onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors"
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="text-slate-900">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
            Project Context & Requirements <span className="text-coral-500">*</span>
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            {formData.message.length}/5000
          </span>
        </div>
        <textarea
          rows={4}
          placeholder="Briefly describe your current architecture, workload profile, SLA targets, or timeline..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500 transition-colors resize-y ${
            errors.message ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 hover:border-slate-300'
          }`}
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.message}</p>}
      </div>

      {/* Consent Checkbox */}
      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
            className="mt-1 rounded border-slate-300 text-coral-600 focus:ring-coral-500 h-4 w-4"
          />
          <span className="text-xs text-slate-600 leading-normal">
            I agree that CoralSwift may process my information in accordance with their privacy policy for the purpose of this technical consultation request.
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-xs text-red-500 font-medium">{errors.consent}</p>}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full text-sm font-semibold"
      >
        <span>Submit Consultation Request</span>
        <Send className="w-4 h-4 ml-2" />
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
        <Lock className="w-3.5 h-3.5 text-coral-600" />
        <span>Strict enterprise NDA and encryption enforced.</span>
      </div>
    </form>
  );
}
