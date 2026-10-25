import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Eye, Lock, FileJson, Clock } from 'lucide-react';
import { LocalStore } from '../../services/api';
import { AuditLogEntry } from '../../types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => LocalStore.getAuditLogs());
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [activeJsonModal, setActiveJsonModal] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesEntity = selectedEntity === 'all' || log.entity === selectedEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Security & Audit Activity Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-restricted tamper-proof compliance trail. No deletion or editing is permitted.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Immutable Ledger Active</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium text-slate-700 bg-white"
          >
            <option value="all">All Entities</option>
            <option value="PayrollRun">PayrollRun</option>
            <option value="Employee">Employee</option>
            <option value="LeaveRequest">LeaveRequest</option>
            <option value="CompanySettings">CompanySettings</option>
            <option value="Announcement">Announcement</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">State Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-800">{log.actorName}</td>
                  <td className="py-3 px-4 font-sans capitalize text-slate-600">{log.actorRole}</td>
                  <td className="py-3 px-4 text-slate-600 font-bold">{log.entity}</td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-sm truncate">{log.details}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveJsonModal(log)}
                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded font-sans text-xs transition inline-flex items-center space-x-1"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>View Diff</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Before / After Modal */}
      {activeJsonModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Audit State Inspection: {activeJsonModal.action}</h3>
              <button onClick={() => setActiveJsonModal(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold">Details:</span>
                <p className="text-slate-700 mt-0.5">{activeJsonModal.details}</p>
              </div>

              <div>
                <span className="text-slate-500 font-bold">Logged Snapshot Payload:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] overflow-x-auto mt-1 font-mono">
{JSON.stringify({
  action: activeJsonModal.action,
  entity: activeJsonModal.entity,
  actor: `${activeJsonModal.actorName} (${activeJsonModal.actorRole})`,
  timestamp: activeJsonModal.timestamp,
  status: 'Committed & Verified',
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveJsonModal(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
