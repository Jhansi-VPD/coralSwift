'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Layers } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ServiceEditorModal } from '@/components/forms/ServiceEditorModal';
import { getServices, deleteService } from '@/lib/api';
import { Service } from '@/lib/types';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await getServices();
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService(id);
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
          {/* Dual Scroll Container: Side (Vertical) & Bottom (Horizontal) */}
          <div className="table-scroll-container max-h-[360px]">
            <table className="min-w-[1150px] w-full text-left text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-mono uppercase font-bold shadow-xs">
                <tr>
                  <th className="px-6 py-4 w-[350px]">Title &amp; Slug</th>
                  <th className="px-6 py-4 w-[240px]">Category</th>
                  <th className="px-6 py-4 w-[140px]">Order</th>
                  <th className="px-6 py-4 w-[160px]">Status</th>
                  <th className="px-6 py-4 w-[160px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0B1426] text-sm font-display">{s.title}</div>
                      <div className="text-slate-400 font-mono text-[11px]">/services/{s.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <Badge variant="slate" size="sm">{s.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono font-medium">
                      #{s.order_index}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'published' ? 'emerald' : 'slate'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <a
                        href={`/services/${s.slug}`}
                        target="_blank"
                        className="inline-flex p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-coral-600 hover:bg-slate-200 transition-colors"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleEdit(s)}
                        className="inline-flex p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="inline-flex p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
