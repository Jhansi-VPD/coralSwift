'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, TrendingUp } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CaseStudyEditorModal } from '@/components/forms/CaseStudyEditorModal';
import { getAllCaseStudiesAdmin, saveCaseStudy, deleteCaseStudy } from '@/lib/api';
import { CaseStudy } from '@/lib/types';

export default function AdminCaseStudiesPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const data = await getAllCaseStudiesAdmin();
    setStudies(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (cs: CaseStudy) => {
    setSelectedStudy(cs);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedStudy(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (cs: CaseStudy, newStatus: CaseStudy['status']) => {
    try {
      await saveCaseStudy({ ...cs, status: newStatus });
      router.refresh();
      loadData();
    } catch (err) {
      console.error('Failed to update case study status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this case study?')) {
      await deleteCaseStudy(id);
      router.refresh();
      loadData();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Case Studies & Portfolio Manager"
        subtitle="Manage approved enterprise case studies and verified metrics."
        actions={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Case Study</span>
          </Button>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="table-scroll-container">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-mono uppercase font-bold shadow-xs">
                <tr>
                  <th className="px-6 py-4 min-w-[280px]">Title &amp; Client</th>
                  <th className="px-6 py-4 whitespace-nowrap">Industry</th>
                  <th className="px-6 py-4 whitespace-nowrap">Key Metrics</th>
                  <th className="px-6 py-4 whitespace-nowrap">Featured</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studies.map((cs) => (
                  <tr key={cs.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-[#0B1426] text-sm font-display leading-snug">{cs.title}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">Client: {cs.client_name}</div>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <Badge variant="blue" size="sm">{cs.industry}</Badge>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap text-emerald-700 font-mono font-bold">
                      {cs.outcome_metrics?.[0]?.metric || 'Verified'}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      {cs.is_featured ? (
                        <Badge variant="coral" size="sm">Featured</Badge>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <select
                        value={cs.status}
                        onChange={(e) => handleStatusChange(cs, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-coral-500/20 cursor-pointer ${
                          cs.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cs.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <a
                          href={`/case-studies/${cs.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-coral-600 hover:bg-slate-200 transition-colors"
                          title="View Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleEdit(cs)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          title="Edit Case Study"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cs.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Case Study"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CaseStudyEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        caseStudy={selectedStudy}
        onSaved={loadData}
      />
    </div>
  );
}
