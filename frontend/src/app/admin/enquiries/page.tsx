'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, Building2, Clock, CheckCircle2, MessageSquare, Filter, Trash2, AlertCircle } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getEnquiries, updateEnquiryStatus, deleteEnquiry } from '@/lib/api';
import { Enquiry } from '@/lib/types';
import { formatDate, formatTimeAgo } from '@/lib/utils';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    const data = await getEnquiries();
    setEnquiries(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: Enquiry['status']) => {
    await updateEnquiryStatus(id, status, adminNotes || undefined);
    loadData();
    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    if (!selectedEnquiry) return;
    await updateEnquiryStatus(id, selectedEnquiry.status, adminNotes);
    loadData();
    alert('Internal notes updated.');
  };

  const handleDeleteEnquiry = async (id: string, clientName?: string) => {
    if (confirm(`Are you sure you want to permanently delete the consultation enquiry from "${clientName || 'this client'}"?`)) {
      setIsDeleting(true);
      try {
        await deleteEnquiry(id);
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry(null);
          setAdminNotes('');
        }
        await loadData();
      } catch (err) {
        console.error('Failed to delete enquiry:', err);
        alert('Failed to delete enquiry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filtered = statusFilter === 'all' 
    ? enquiries 
    : enquiries.filter(e => e.status === statusFilter);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Client Inbound Enquiries"
        subtitle="Manage architecture consultations, triage requests, and review pipeline status."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none shadow-xs"
            >
              <option value="all">All Enquiries ({enquiries.length})</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List of Enquiries with Side Scroller */}
          <div className="lg:col-span-7 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 table-scroll-container">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200 shadow-sm">
                No enquiries found matching filter.
              </div>
            ) : (
              filtered.map((enq) => (
                <div
                  key={enq.id}
                  onClick={() => {
                    setSelectedEnquiry(enq);
                    setAdminNotes(enq.admin_notes || '');
                  }}
                  className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer shadow-sm relative group ${
                    selectedEnquiry?.id === enq.id
                      ? 'border-coral-500 ring-2 ring-coral-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-base font-bold text-[#0B1426] font-display">{enq.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono font-medium">{enq.company}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={enq.status === 'new' ? 'emerald' : enq.status === 'in_review' ? 'amber' : 'slate'}
                        size="sm"
                      >
                        {enq.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEnquiry(enq.id, enq.full_name);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-80 group-hover:opacity-100 transition-all"
                        title="Delete enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {enq.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
                    <span className="font-semibold text-coral-600">{enq.service_interest}</span>
                    <span>{formatTimeAgo(enq.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detailed View / Inspection Panel */}
          <div className="lg:col-span-5">
            {selectedEnquiry ? (
              <div className="bg-white rounded-3xl p-7 border border-slate-200 sticky top-24 space-y-6 shadow-sm">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B1426] font-display">{selectedEnquiry.full_name}</h3>
                    <p className="text-xs text-coral-600 font-mono font-bold">{selectedEnquiry.company}</p>
                  </div>
                  
                  {/* Status Dropdown */}
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20"
                  >
                    <option value="new">New</option>
                    <option value="in_review">In Review</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-3 text-xs font-mono text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-coral-600 shrink-0" />
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-coral-600 hover:underline font-semibold">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  {selectedEnquiry.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-coral-600 shrink-0" />
                      <span>{selectedEnquiry.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Submitted: {formatDate(selectedEnquiry.created_at)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-700 font-bold mb-2">
                    Client Requirements Message
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedEnquiry.message}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-700 font-bold mb-2">
                    Internal Engineering Notes
                  </h4>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Log discovery call schedule, NDA status, or assigned lead..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:bg-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteEnquiry(selectedEnquiry.id, selectedEnquiry.full_name)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Enquiry</span>
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => handleSaveNotes(selectedEnquiry.id)}>
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200 shadow-sm">
                Select an enquiry from the list to review details and update triage status.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

