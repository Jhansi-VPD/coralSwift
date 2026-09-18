'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Layers } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ServiceEditorModal } from '@/components/forms/ServiceEditorModal';
import { getServices, saveService, deleteService } from '@/lib/api';
import { Service } from '@/lib/types';

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await getServices(undefined, true);
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleEdit = (srv: Service) => {
    setSelectedService(srv);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (srv: Service, newStatus: Service['status']) => {
    try {
      await saveService({ ...srv, status: newStatus });
      router.refresh();
      loadServices();
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService(id);
      router.refresh();
      loadServices();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Services Catalogue Manager"
        subtitle="Maintain software service offerings, capabilities, and delivery blueprints."
        actions={
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Service</span>
          </Button>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="table-scroll-container">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-mono uppercase font-bold shadow-xs">
                <tr>
                  <th className="px-6 py-4 min-w-[280px]">Title &amp; Slug</th>
                  <th className="px-6 py-4 whitespace-nowrap">Category</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-[#0B1426] text-sm font-display leading-snug">{s.title}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">/services/{s.slug}</div>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <Badge variant="slate" size="sm">{s.category}</Badge>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-coral-500/20 cursor-pointer ${
                          s.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.status === 'draft'
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
                          href={`/services/${s.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-coral-600 hover:bg-slate-200 transition-colors"
                          title="View Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Service"
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

      <ServiceEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onSaved={loadServices}
      />
    </div>
  );
}
