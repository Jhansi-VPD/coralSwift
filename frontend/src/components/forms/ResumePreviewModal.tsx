'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  X, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  CheckCircle2, 
  FileCheck2
} from 'lucide-react';
import { Application } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
}

export async function generateCandidateDossierPDF(app: Application) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  // Header bar
  doc.setFillColor(11, 20, 38); // CoralSwift dark slate #0B1426
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CORALSWIFT', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(235, 94, 60); // Coral accent
  doc.text('CANDIDATE TALENT DOSSIER & APPLICATION RECORD', 14, 26);
  
  // Candidate Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(app.full_name || 'Applicant', 14, 48);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Applied Position: ${app.job_title || 'Engineering Role'}`, 14, 56);
  doc.text(`Application Status: ${app.status?.toUpperCase() || 'SUBMITTED'}`, 14, 62);
  doc.text(`Submission Date: ${app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}`, 14, 68);
  
  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 73, 196, 73);
  
  // Contact Details Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 20, 38);
  doc.text('CONTACT & VERIFICATION DETAILS', 14, 82);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  let y = 90;
  doc.text(`Email Address: ${app.email || 'N/A'}`, 14, y);
  if (app.phone) {
    y += 7;
    doc.text(`Phone Number: ${app.phone}`, 14, y);
  }
  if (app.linkedin_url) {
    y += 7;
    doc.text(`LinkedIn: ${app.linkedin_url}`, 14, y);
  }
  if (app.portfolio_url) {
    y += 7;
    doc.text(`Portfolio / GitHub: ${app.portfolio_url}`, 14, y);
  }
  y += 7;
  doc.text(`Original Attached File: ${app.resume_filename || 'candidate_resume.pdf'}`, 14, y);
  
  // Cover Note Section
  y += 14;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 20, 38);
  doc.text('CANDIDATE STATEMENT & COVER NOTE', 14, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const noteText = app.cover_note || 'Candidate submitted application with attached resume file.';
  const splitNote = doc.splitTextToSize(noteText, 182);
  doc.text(splitNote, 14, y);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential Candidate Record • CoralSwift Talent Engineering Platform', 14, 285);
  
  const downloadName = app.resume_filename?.endsWith('.pdf') 
    ? app.resume_filename 
    : `${(app.full_name || 'candidate').replace(/\s+/g, '_')}_resume.pdf`;
  doc.save(downloadName);
}

export function downloadResumeFile(app: Application) {
  const targetUrl = app.resume_url || app.resume_path;
  const fileName = app.resume_filename || `${app.full_name}_Resume.pdf`;

  if (targetUrl && targetUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.startsWith('blob:'))) {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback to generating a formatted PDF dossier
  generateCandidateDossierPDF(app);
}

export function ResumePreviewModal({ isOpen, onClose, application }: ResumePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'dossier'>('document');

  if (!isOpen || !application) return null;

  const resumeSource = application.resume_url || application.resume_path;
  const isEmbeddablePdf = Boolean(
    resumeSource && (
      resumeSource.startsWith('data:application/pdf') || 
      (resumeSource.startsWith('http') && resumeSource.toLowerCase().includes('.pdf')) ||
      resumeSource.startsWith('blob:')
    )
  );

  const handleDownload = () => {
    downloadResumeFile(application);
  };

  const handleOpenNewTab = () => {
    if (resumeSource && (resumeSource.startsWith('http') || resumeSource.startsWith('data:') || resumeSource.startsWith('blob:'))) {
      const w = window.open('');
      if (w) {
        if (resumeSource.startsWith('data:')) {
          w.document.write(`<iframe src="${resumeSource}" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          w.location.href = resumeSource;
        }
      }
    } else {
      generateCandidateDossierPDF(application);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0B1426]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#0B1426] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-coral-500/20 border border-coral-500/40 flex items-center justify-center text-coral-400 font-bold text-base shadow-inner">
              {application.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold font-display text-white">{application.full_name}</h3>
                <Badge variant="blue" size="sm">{application.status}</Badge>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-0.5">
                Role: <span className="text-coral-400 font-semibold">{application.job_title}</span> • Applied: {formatDate(application.created_at)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isEmbeddablePdf && (
              <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-2 text-xs">
                <button
                  onClick={() => setActiveTab('document')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    activeTab === 'document' ? 'bg-coral-500 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> PDF View</span>
                </button>
                <button
                  onClick={() => setActiveTab('dossier')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    activeTab === 'dossier' ? 'bg-coral-500 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5"><FileCheck2 className="w-3.5 h-3.5" /> Summary</span>
                </button>
              </div>
            )}

            <button
              onClick={handleOpenNewTab}
              title="Open in new window"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CV</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* If PDF Document view selected and PDF available */}
          {activeTab === 'document' && isEmbeddablePdf ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-coral-600" />
                  <strong>{application.resume_filename}</strong>
                </span>
                <span className="text-slate-400">Embedded PDF Preview</span>
              </div>
              <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                <iframe
                  src={resumeSource}
                  title="Candidate Resume Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            /* Structured Candidate Dossier */
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* File Attachment Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 flex items-center justify-center text-coral-600 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B1426] font-display">{application.resume_filename}</h4>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      Attached Candidate Resume Document • Ready for Review
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownload}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
                  <h5 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Contact & Channels
                  </h5>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <Mail className="w-4 h-4 text-coral-600 shrink-0" />
                      <a href={`mailto:${application.email}`} className="text-coral-600 hover:underline font-semibold">
                        {application.email}
                      </a>
                    </div>

                    {application.phone && (
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Phone className="w-4 h-4 text-coral-600 shrink-0" />
                        <span className="font-mono">{application.phone}</span>
                      </div>
                    )}

                    {application.linkedin_url && (
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Globe className="w-4 h-4 text-coral-600 shrink-0" />
                        <a href={application.linkedin_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">
                          {application.linkedin_url}
                        </a>
                      </div>
                    )}

                    {application.portfolio_url && (
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Briefcase className="w-4 h-4 text-coral-600 shrink-0" />
                        <a href={application.portfolio_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">
                          {application.portfolio_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Metadata Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
                  <h5 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Role & Submission Details
                  </h5>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Role:</span>
                      <span className="font-bold text-[#0B1426]">{application.job_title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Application Date:</span>
                      <span className="font-mono">{formatDate(application.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current Pipeline Status:</span>
                      <Badge variant="blue" size="sm">{application.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Application ID:</span>
                      <span className="font-mono text-[11px] text-slate-400">{application.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Note Card */}
              {application.cover_note && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                  <h5 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Candidate Cover Note / Statement
                  </h5>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {application.cover_note}
                  </div>
                </div>
              )}

              {/* Action Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B1426] to-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-slate-200">
                    Review completed? You can update the candidate's hiring pipeline status directly from the applications list.
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-white text-[#0B1426] hover:bg-slate-100 text-xs font-bold transition-colors shrink-0 shadow-xs"
                >
                  Download Dossier (PDF)
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
