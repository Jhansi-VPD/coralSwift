'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
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
    serviceInterest: initialService || '',
    message: '',
    consent: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) return 'Please enter a valid name (letters and standard punctuation).';
        return '';

      case 'email':
        if (!value || !value.trim()) return 'Work email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address (e.g., name@company.com).';
        return '';

      case 'company':
        if (!value || !value.trim()) return 'Company or organization name is required.';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters.';
        if (!/[a-zA-Z]/.test(value.trim())) return 'Please enter a valid company name (cannot be numbers only).';
        if (!/^[a-zA-Z0-9\s.,&'()/-]+$/.test(value.trim())) return 'Company name contains invalid characters.';
        return '';

      case 'phone':
        if (value && value.trim()) {
          const digitsOnly = value.replace(/\D/g, '');
          if (digitsOnly.length < 7 || digitsOnly.length > 15) {
            return 'Please enter a valid phone number (7–15 digits).';
          }
        }
        return '';

      case 'serviceInterest':
        if (!value || !value.trim()) return 'Please select an area of interest.';
        if (!SERVICE_OPTIONS.includes(value)) return 'Please select a valid area of interest.';
        return '';

      case 'message':
        if (!value || !value.trim()) return 'Project requirements or context is required.';
        if (value.trim().length < 10) return 'Please provide more detail (minimum 10 characters).';
        if (value.trim().length > 5000) return 'Message cannot exceed 5000 characters.';
        return '';

      case 'consent':
        if (!value) return 'Consent is required to process your technical consultation.';
        return '';

      default:
        return '';
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, (formData as any)[key]);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      company: true,
      phone: true,
      serviceInterest: true,
      message: true,
      consent: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field]);
    setErrors((prev) => {
      const updated = { ...prev };
      if (err) updated[field] = err;
      else delete updated[field];
      return updated;
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => {
        const updated = { ...prev };
        if (err) updated[field] = err;
        else delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.form;
      return copy;
    });

    try {
      const response = await submitEnquiry({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim() || undefined,
        service_interest: formData.serviceInterest,
        message: formData.message.trim(),
        consent: formData.consent,
        source_page: sourcePage,
      });

      if (response.success) {
        setIsSuccess(true);
        setSuccessMessage(response.message || 'Consultation request received.');
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'An unexpected network error occurred. Please try again.',
      }));
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
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 max-w-sm mx-auto mb-6 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
              serviceInterest: initialService || '',
              message: '',
              consent: true,
            });
            setErrors({});
            setTouched({});
          }}
        >
          Submit Another Enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-xl">
      <h3 className="text-2xl font-extrabold text-[#0B1426] mb-2 font-display">
        Start an Architecture Consultation
      </h3>
      <p className="text-sm text-slate-600 mb-8">
        Tell us about your systems requirements. Our engineering team will review and respond within 1 business day.
      </p>

      {errors.form && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm animate-in fade-in">
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
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              touched.fullName && errors.fullName
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
            }`}
          />
          {touched.fullName && errors.fullName && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
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
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              touched.email && errors.email
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
            }`}
          />
          {touched.email && errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
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
            onChange={(e) => handleChange('company', e.target.value)}
            onBlur={() => handleBlur('company')}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              touched.company && errors.company
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
            }`}
          />
          {touched.company && errors.company && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.company}</span>
            </p>
          )}
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
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
              touched.phone && errors.phone
                ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
            }`}
          />
          {touched.phone && errors.phone && (
            <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Service Interest Dropdown */}
      <div className="mb-5">
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-2">
          Area of Interest <span className="text-coral-500">*</span>
        </label>
        <select
          value={formData.serviceInterest}
          onChange={(e) => handleChange('serviceInterest', e.target.value)}
          onBlur={() => handleBlur('serviceInterest')}
          className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-sm focus:outline-none focus:ring-2 transition-colors ${
            !formData.serviceInterest ? 'text-slate-400' : 'text-slate-900'
          } ${
            touched.serviceInterest && errors.serviceInterest
              ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
              : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
          }`}
        >
          <option value="" disabled className="text-slate-400">
            -- Select an Area of Interest --
          </option>
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="text-slate-900">
              {opt}
            </option>
          ))}
        </select>
        {touched.serviceInterest && errors.serviceInterest && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errors.serviceInterest}</span>
          </p>
        )}
      </div>

      {/* Message */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
            Project Context & Requirements <span className="text-coral-500">*</span>
          </label>
          <span className={`text-[11px] font-mono ${formData.message.length > 5000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {formData.message.length}/5000
          </span>
        </div>
        <textarea
          rows={4}
          placeholder="Briefly describe your current architecture, workload profile, SLA targets, or timeline..."
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          className={`w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors resize-y ${
            touched.message && errors.message
              ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
              : 'border-slate-200 hover:border-slate-300 focus:ring-coral-500/20 focus:border-coral-500'
          }`}
        />
        {touched.message && errors.message && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errors.message}</span>
          </p>
        )}
      </div>

      {/* Consent Checkbox */}
      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => handleChange('consent', e.target.checked)}
            className="mt-1 rounded border-slate-300 text-coral-600 focus:ring-coral-500 h-4 w-4"
          />
          <span className="text-xs text-slate-600 leading-normal">
            I agree that CoralSwift may process my information in accordance with their privacy policy for the purpose of this technical consultation request.
          </span>
        </label>
        {touched.consent && errors.consent && (
          <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errors.consent}</span>
          </p>
        )}
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
