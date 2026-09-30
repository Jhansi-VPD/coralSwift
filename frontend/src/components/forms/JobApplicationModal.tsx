'use client';

import { apiUrl } from '@/lib/api-base';
import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Job } from '@/lib/types';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export function JobApplicationModal({ isOpen, onClose, job }: JobApplicationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    portfolioUrl: '',
    linkedinUrl: '',
    coverNote: '',
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!job) return null;

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) return 'Please enter a valid full name (letters only).';
        return '';

      case 'email':
        if (!value || !value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please provide a valid email address.';
        return '';

      case 'phone':
        if (value && value.trim()) {
          const digits = value.replace(/\D/g, '');
          if (digits.length < 7 || digits.length > 15) {
            return 'Please enter a valid phone number (7–15 digits).';
          }
        }
        return '';

      case 'linkedinUrl':
        if (value && value.trim() && !isValidUrl(value.trim())) {
          return 'Please enter a valid URL (starting with https://).';
        }
        return '';

      case 'portfolioUrl':
        if (value && value.trim() && !isValidUrl(value.trim())) {
          return 'Please enter a valid URL (starting with https://).';
        }
        return '';

      case 'resume':
        if (!resumeFile) return 'Please attach your resume or CV.';
        return '';

      default:
        return '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validExtensions.includes(fileExt)) {
        setErrors(prev => ({ ...prev, resume: 'Please upload a PDF or Word document (.pdf, .docx, .doc).' }));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, resume: 'File size must be under 10MB.' }));
        return;
      }

      setResumeFile(file);
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.resume;
        return copy;
      });
    }
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    const nameErr = validateField('fullName', formData.fullName);
    if (nameErr) errs.fullName = nameErr;

    const emailErr = validateField('email', formData.email);
    if (emailErr) errs.email = emailErr;

    const phoneErr = validateField('phone', formData.phone);
    if (phoneErr) errs.phone = phoneErr;

    const linkErr = validateField('linkedinUrl', formData.linkedinUrl);
    if (linkErr) errs.linkedinUrl = linkErr;

    const portErr = validateField('portfolioUrl', formData.portfolioUrl);
    if (portErr) errs.portfolioUrl = portErr;

    if (!resumeFile) {
      errs.resume = 'Please attach your resume/CV document (PDF or DOCX).';
    }

    setErrors(errs);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      linkedinUrl: true,
      portfolioUrl: true,
      resume: true,
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
    if (!validateAll()) return;

    setIsLoading(true);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.form;
      return copy;
    });

    try {
      // FIX (ISSUES_REPORT #3): upload now goes through the server-side
      // /api/applications/submit endpoint (multipart), which stores the resume
      // in Supabase Storage with the service-role key. No client-side upload,
      // no fake /uploads/ paths, no base64 payloads.
      if (!resumeFile) {
        setErrors(prev => ({ ...prev, resume: 'Please attach your resume before submitting.' }));
        setIsLoading(false);
        return;
      }

      const form = new FormData();
      form.append('job_id', job.id);
      form.append('full_name', formData.fullName.trim());
      form.append('email', formData.email.trim());
      if (formData.phone.trim()) form.append('phone', formData.phone.trim());
      if (formData.portfolioUrl.trim()) form.append('portfolio_url', formData.portfolioUrl.trim());
      if (formData.linkedinUrl.trim()) form.append('linkedin_url', formData.linkedinUrl.trim());
      if (formData.coverNote.trim()) form.append('cover_note', formData.coverNote.trim());
      form.append('resume', resumeFile);

      const res = await fetch(apiUrl('/api/applications/submit'), { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to submit application' }));
        throw new Error(err.error || 'Failed to submit application');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        form: err.message || 'Failed to submit application. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccess(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      portfolioUrl: '',
      linkedinUrl: '',
      coverNote: '',
    });
    setResumeFile(null);
    setErrors({});
    setTouched({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isSuccess ? "Application Received" : `Apply for ${job.title}`}
      description={isSuccess ? undefined : `${job.department} • ${job.location} • ${job.work_model}`}
      maxWidth="xl"
    >
      {isSuccess ? (
        <div className="py-8 text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-2xl font-extrabold text-[#0B1426] mb-2 font-display">
            Application Submitted Successfully
          </h4>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            Thank you for applying to CoralSwift. Our talent engineering team will review your background and reach out regarding next steps.
          </p>
          <Button variant="primary" onClick={handleCloseModal}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Full Name <span className="text-coral-600">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="Eleanor Vance"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm ${
                  touched.fullName && errors.fullName
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
                }`}
              />
              {touched.fullName && errors.fullName && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Email Address <span className="text-coral-600">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="eleanor@domain.com"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm ${
                  touched.email && errors.email
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="+1 (555) 000-0000"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm ${
                  touched.phone && errors.phone
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                onBlur={() => handleBlur('linkedinUrl')}
                placeholder="https://linkedin.com/in/username"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm ${
                  touched.linkedinUrl && errors.linkedinUrl
                    ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                    : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
                }`}
              />
              {touched.linkedinUrl && errors.linkedinUrl && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.linkedinUrl}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              GitHub / Portfolio URL
            </label>
            <input
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => handleChange('portfolioUrl', e.target.value)}
              onBlur={() => handleBlur('portfolioUrl')}
              placeholder="https://github.com/username or personal site"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 transition-colors shadow-sm ${
                touched.portfolioUrl && errors.portfolioUrl
                  ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:ring-coral-500 focus:border-coral-500'
              }`}
            />
            {touched.portfolioUrl && errors.portfolioUrl && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.portfolioUrl}</span>
              </p>
            )}
          </div>

          {/* Resume Upload Drag/Select */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              Resume / CV (PDF or DOCX) <span className="text-coral-600">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
              errors.resume
                ? 'border-red-400 bg-red-50/20'
                : 'border-slate-300 hover:border-coral-500 bg-slate-50/80 hover:bg-coral-50/20'
            }`}>
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                {resumeFile ? (
                  <div className="flex items-center gap-2 text-coral-600 text-sm font-semibold">
                    <FileText className="w-5 h-5 text-coral-600" />
                    <span>{resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                    <span className="text-xs text-slate-700 font-semibold">
                      Click to browse or drop file here
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PDF, DOCX up to 10MB
                    </span>
                  </>
                )}
              </label>
            </div>
            {errors.resume && (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.resume}</span>
              </p>
            )}
          </div>

          {/* Cover Note */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              Cover Note / Why CoralSwift? (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.coverNote}
              onChange={(e) => handleChange('coverNote', e.target.value)}
              placeholder="Briefly highlight relevant systems architecture projects or achievements..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              <span>Submit Application</span>
              <Send className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
