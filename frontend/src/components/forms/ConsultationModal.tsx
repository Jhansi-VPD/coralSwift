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
import { SERVICE_OPTIONS, mapToServiceOption, isCorporateEmail } from '@/lib/utils';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

const TIME_SLOTS = [
  '10:00 AM EST (US/East)',
  '02:00 PM EST (US/East)',
  '05:00 PM EST (US/East)',
  '11:00 AM PST (US/West)',
  '03:00 PM PST (US/West)'
];

interface SubmittedBooking {
  email: string;
  service: string;
  date: string;
  time: string;
}

const getSubmittedBookings = (): SubmittedBooking[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('coralswift_submitted_bookings');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addSubmittedBooking = (email: string, service: string, date: string, time: string) => {
  if (typeof window === 'undefined') return;
  try {
    const bookings = getSubmittedBookings();
    bookings.push({
      email: email.trim().toLowerCase(),
      service: service.trim().toLowerCase(),
      date: date.trim(),
      time: time.trim().toLowerCase(),
    });
    localStorage.setItem('coralswift_submitted_bookings', JSON.stringify(bookings));
  } catch (e) {
    console.warn('Failed to save submitted booking:', e);
  }
};

const hasExactDuplicateBooking = (email: string, service: string, date: string, time: string): boolean => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanService = service.trim().toLowerCase();
  const cleanDate = date.trim();
  const cleanTime = time.trim().toLowerCase();

  if (!cleanEmail || !cleanService || !cleanDate || !cleanTime) return false;

  const bookings = getSubmittedBookings();
  return bookings.some(
    b =>
      b.email.trim().toLowerCase() === cleanEmail &&
      b.service.trim().toLowerCase() === cleanService &&
      b.date.trim() === cleanDate &&
      b.time.trim().toLowerCase() === cleanTime
  );
};

export function ConsultationModal({ isOpen, onClose, defaultService }: ConsultationModalProps) {
  const resolvedService = mapToServiceOption(defaultService);
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    serviceInterest: resolvedService || '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const mapped = mapToServiceOption(defaultService);
      setFormData(prev => ({
        ...prev,
        serviceInterest: mapped || ''
      }));
    }
  }, [isOpen, defaultService]);

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
        if (!isCorporateEmail(value.trim())) return 'Please enter a valid corporate/work email address. Personal emails (Gmail, Yahoo, etc.) are not allowed.';
        return '';
      case 'company':
        if (!value || !value.trim()) return 'Company name is required.';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters.';
        if (!/[a-zA-Z]/.test(value.trim())) return 'Please enter a valid company name (cannot be numbers only).';
        if (!/^[a-zA-Z0-9\s.,&'()/-]+$/.test(value.trim())) return 'Company name contains invalid characters.';
        return '';
      case 'serviceInterest':
        if (!value || !value.trim()) return 'Service domain of interest is required. Please select an option.';
        return '';
      case 'preferredDate':
        if (!value || !value.trim()) return 'Preferred consultation date is required.';
        if (value < todayStr) return 'Please select today or a future date for your consultation.';
        return '';
      case 'preferredTime':
        if (!value || !value.trim()) return 'Preferred time slot is required. Please select a time slot.';
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

    const dateErr = validateField('preferredDate', formData.preferredDate);
    if (dateErr) errs.preferredDate = dateErr;

    const timeErr = validateField('preferredTime', formData.preferredTime);
    if (timeErr) errs.preferredTime = timeErr;

    setErrors(errs);
    setTouched({
      fullName: true,
      email: true,
      company: true,
      serviceInterest: true,
      preferredDate: true,
      preferredTime: true,
    });
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
    if (!validateAll()) {
      setErrors(prev => ({
        ...prev,
        form: 'Please fill in all required fields and correct the validation errors below.'
      }));
      return;
    }

    const { email, serviceInterest, preferredDate, preferredTime } = formData;
    if (hasExactDuplicateBooking(email, serviceInterest, preferredDate, preferredTime)) {
      const duplicateMsg = 'A consultation request with this exact corporate email, service domain, date, and time slot has already been submitted.';
      setErrors(prev => ({
        ...prev,
        email: duplicateMsg,
        preferredDate: duplicateMsg,
        preferredTime: duplicateMsg,
        form: duplicateMsg,
      }));
      setTouched(prev => ({
        ...prev,
        email: true,
        serviceInterest: true,
        preferredDate: true,
        preferredTime: true,
      }));
      return;
    }

    setIsLoading(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.form;
      return copy;
    });

    try {
      const response = await submitEnquiry({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        service_interest: formData.serviceInterest,
        message: `[Booked Consultation: Date: ${formData.preferredDate}, Slot: ${formData.preferredTime}] - ${formData.message.trim() || 'Architecture consultation requested.'}`,
        consent: true,
        source_page: typeof window !== 'undefined' ? window.location.pathname : '/contact',
      });
      if (response && response.success) {
        addSubmittedBooking(email, serviceInterest, preferredDate, preferredTime);
        setIsSuccess(true);
      } else {
        setErrors(prev => ({
          ...prev,
          form: response?.message || 'Failed to submit consultation request. Please try again.'
        }));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'An unexpected error occurred.';
      if (errMsg.toLowerCase().includes('exact corporate email')) {
        addSubmittedBooking(email, serviceInterest, preferredDate, preferredTime);
        setErrors(prev => ({
          ...prev,
          email: errMsg,
          preferredDate: errMsg,
          preferredTime: errMsg,
          form: errMsg
        }));
        setTouched(prev => ({ ...prev, email: true, preferredDate: true, preferredTime: true }));
      } else {
        setErrors(prev => ({
          ...prev,
          form: errMsg
        }));
      }
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
      serviceInterest: defaultService ? mapToServiceOption(defaultService) : '',
      preferredDate: '',
      preferredTime: '',
      message: '',
    });
    setErrors({});
    setTouched({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Book Architecture Consultation"
      maxWidth="xl"
      id="consultation-modal"
      data-testid="consultation-modal"
    >
      {isSuccess ? (
        <div className="text-center py-8 space-y-4 animate-in fade-in" data-testid="consultation-success-card">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-[#0B1426] font-display">Consultation Confirmed</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>. A calendar invite for <span className="font-semibold text-slate-900">{formData.preferredDate}</span> at <span className="font-semibold text-slate-900">{formData.preferredTime}</span> has been dispatched to <span className="font-mono text-coral-600">{formData.email}</span> along with our architecture NDA.
          </p>
          <div className="pt-4">
            <Button variant="primary" data-testid="consultation-done-btn" onClick={handleResetAndClose} className="w-full sm:w-auto">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form id="consultation-modal-form" name="consultationModalForm" data-testid="consultation-modal-form" onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-coral-600 shrink-0" />
            <span>Direct 45-minute technical roadmap & topology review with a Principal Systems Architect.</span>
          </div>

          {errors.form && (
            <div
              id="consultation-form-error"
              data-testid="form-error"
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-xs animate-in fade-in error-banner error-message"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modalFullName" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Full Name <span className="text-coral-500">*</span>
              </label>
              <input
                id="modalFullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="e.g. Sarah Jenkins"
                aria-invalid={touched.fullName && !!errors.fullName}
                aria-describedby={touched.fullName && errors.fullName ? 'modalFullName-error' : undefined}
                data-testid="modal-fullName-input"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.fullName && errors.fullName
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.fullName && errors.fullName && (
                <p
                  id="modalFullName-error"
                  data-testid="modal-fullName-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="modalEmail" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Corporate Email <span className="text-coral-500">*</span>
              </label>
              <input
                id="modalEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="sarah@enterprise.com"
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={touched.email && errors.email ? 'modalEmail-error' : undefined}
                data-testid="modal-email-input"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.email && errors.email
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.email && errors.email && (
                <p
                  id="modalEmail-error"
                  data-testid="modal-email-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modalCompany" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Company / Organization <span className="text-coral-500">*</span>
              </label>
              <input
                id="modalCompany"
                name="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                onBlur={() => handleBlur('company')}
                placeholder="e.g. Acme Health Corp"
                aria-invalid={touched.company && !!errors.company}
                aria-describedby={touched.company && errors.company ? 'modalCompany-error' : undefined}
                data-testid="modal-company-input"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  touched.company && errors.company
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.company && errors.company && (
                <p
                  id="modalCompany-error"
                  data-testid="modal-company-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.company}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="modalServiceInterest" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Service Domain of Interest <span className="text-coral-500">*</span>
              </label>
              <select
                id="modalServiceInterest"
                name="serviceInterest"
                value={formData.serviceInterest}
                onChange={(e) => handleChange('serviceInterest', e.target.value)}
                onBlur={() => handleBlur('serviceInterest')}
                aria-invalid={touched.serviceInterest && !!errors.serviceInterest}
                aria-describedby={touched.serviceInterest && errors.serviceInterest ? 'modalServiceInterest-error' : undefined}
                data-testid="modal-serviceInterest-select"
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
                <p
                  id="modalServiceInterest-error"
                  data-testid="modal-serviceInterest-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.serviceInterest}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modalDate" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Preferred Date <span className="text-coral-500">*</span>
              </label>
              <input
                id="modalDate"
                name="preferredDate"
                type="date"
                min={todayStr}
                value={formData.preferredDate}
                onChange={(e) => handleChange('preferredDate', e.target.value)}
                onBlur={() => handleBlur('preferredDate')}
                aria-invalid={touched.preferredDate && !!errors.preferredDate}
                aria-describedby={touched.preferredDate && errors.preferredDate ? 'modalDate-error' : undefined}
                data-testid="modal-preferredDate-input"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  !formData.preferredDate ? 'text-slate-400 bg-white' : 'text-slate-900 bg-white'
                } ${
                  touched.preferredDate && errors.preferredDate
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              />
              {touched.preferredDate && errors.preferredDate && (
                <p
                  id="modalDate-error"
                  data-testid="modal-preferredDate-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.preferredDate}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="modalTimeSlot" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
                Preferred Time Slot <span className="text-coral-500">*</span>
              </label>
              <select
                id="modalTimeSlot"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={(e) => handleChange('preferredTime', e.target.value)}
                onBlur={() => handleBlur('preferredTime')}
                aria-invalid={touched.preferredTime && !!errors.preferredTime}
                aria-describedby={touched.preferredTime && errors.preferredTime ? 'modalTimeSlot-error' : undefined}
                data-testid="modal-timeslot-select"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  !formData.preferredTime ? 'text-slate-400 bg-white' : 'text-slate-900 bg-white'
                } ${
                  touched.preferredTime && errors.preferredTime
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:ring-coral-500/20 focus:border-coral-500'
                }`}
              >
                <option value="" disabled className="text-slate-400">
                  -- Select Preferred Time Slot --
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot} className="text-slate-900">{slot}</option>
                ))}
              </select>
              {touched.preferredTime && errors.preferredTime && (
                <p
                  id="modalTimeSlot-error"
                  data-testid="modal-preferredTime-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium error-message field-error"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.preferredTime}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="modalMessage" className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-bold mb-1.5">
              Architecture Focus / Notes (Optional)
            </label>
            <textarea
              id="modalMessage"
              name="message"
              rows={3}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Tell us about your current stack, bottlenecks, or target migration timeline..."
              data-testid="modal-message-textarea"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={handleResetAndClose} data-testid="modal-cancel-btn">
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading} data-testid="modal-submit-btn">
              <span>Confirm Consultation</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

