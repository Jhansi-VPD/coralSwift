'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, Clock, User, ShieldCheck } from 'lucide-react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAuditLogs } from '@/lib/api';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const loadLogs = async () => {
    const data = await getAuditLogs();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      <AdminHeader
        title="Administrative Security & Audit Logs"
        subtitle="Immutable timestamped activity trail of administrative actions, logins, and mutations."
        actions={
          <Button variant="secondary" size="sm" onClick={loadLogs}>
            Refresh Trail
          </Button>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase font-bold shadow-xs">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <span className="text-coral-600 font-bold">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap text-slate-800">
                      {log.user_email || 'admin@coralswift.com'}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap text-slate-600">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap text-slate-500">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
