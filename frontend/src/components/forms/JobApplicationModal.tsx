'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Send, Briefcase } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Job } from '@/lib/types';
import { submitApplication } from '@/lib/api';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!job) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
        setErrors({ ...errors, resume: 'Please upload a PDF or DOCX file.' });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, resume: 'File size must be under 10MB.' });
        return;
      }

      setResumeFile(file);
      const newErrors = { ...errors };
      delete newErrors.resume;
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required.';
    }
    if (!resumeFile) {
      newErrors.resume = 'Please attach your resume/CV (PDF or DOCX).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const filename = resumeFile ? resumeFile.name : 'candidate_resume.pdf';
      let resumeDataUrl = '';
      if (resumeFile) {
        try {
          resumeDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(resumeFile);
          });
        } catch (e) {
          console.warn('File reading fallback:', e);
        }
      }

      const resumePath = resumeDataUrl || `/uploads/resumes/${Date.now()}_${filename}`;

      await submitApplication({
        job_id: job.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        portfolio_url: formData.portfolioUrl || undefined,
        linkedin_url: formData.linkedinUrl || undefined,
        cover_note: formData.coverNote || undefined,
        resume_filename: filename,
        resume_path: resumePath,
        resume_url: resumeDataUrl || undefined,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to submit application. Please try again.' });
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.form && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs font-medium">
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
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Eleanor Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Email Address <span className="text-coral-600">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="eleanor@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1 font-medium">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              GitHub / Portfolio URL
            </label>
            <input
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              placeholder="https://github.com/username or personal site"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 transition-colors shadow-sm"
            />
          </div>

          {/* Resume Upload Drag/Select */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              Resume / CV (PDF or DOCX) <span className="text-coral-600">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-coral-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/80 hover:bg-coral-50/20">
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
            {errors.resume && <p className="text-xs text-red-600 mt-1 font-medium">{errors.resume}</p>}
          </div>

          {/* Cover Note */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              Cover Note / Why CoralSwift?
            </label>
            <textarea
              rows={3}
              value={formData.coverNote}
              onChange={(e) => setFormData({ ...formData, coverNote: e.target.value })}
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
