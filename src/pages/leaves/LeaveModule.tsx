import React, { useState } from 'react';
import {
  CalendarOff,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Sparkles,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { LeaveRequest } from '../../types';
import { calculateLeaveWorkingDays } from '../../utils/calculations';

interface LeaveModuleProps {
  onOpenAI: () => void;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({ onOpenAI }) => {
  const { currentEmployee, role } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => LocalStore.getLeaveRequests());
  const leaveTypes = LocalStore.getLeaveTypes();
  const holidays = LocalStore.getHolidays();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState(leaveTypes[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [alertNotice, setAlertNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Review comment state
  const [reviewComment, setReviewComment] = useState('');

  // Update calculated days dynamically when dates change
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      const days = calculateLeaveWorkingDays(start, end, holidays);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  };

  // Submit Leave Application
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    const res = LocalStore.applyLeave({
      employee: currentEmployee,
      leaveTypeId: selectedLeaveTypeId,
      startDate,
      endDate,
      reason,
    });

    if (res.status === 422 || res.error) {
      setAlertNotice({ text: res.error || 'HTTP 422: Invalid leave request.', type: 'error' });
    } else {
      setAlertNotice({
        text: `Leave request for ${res.request?.totalDays} working days submitted successfully! Pending HR review.`,
        type: 'success',
      });
      setLeaveRequests(LocalStore.getLeaveRequests());
      setShowApplyModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
    }
  };

  // HR Review (Approve / Reject)
  const handleReview = (requestId: string, status: 'approved' | 'rejected') => {
    const res = LocalStore.reviewLeave(requestId, status, 'Michael Chang', reviewComment || 'Processed by HR');
    if (res) {
      LocalStore.recordAudit({
        actorId: 'hr',
        actorName: 'Michael Chang',
        actorRole: 'hr',
        action: `LEAVE_${status.toUpperCase()}`,
        entity: 'LeaveRequest',
        entityId: requestId,
        details: `${status.toUpperCase()} leave request for ${res.employeeName} (${res.totalDays} days)`,
      });

      setLeaveRequests(LocalStore.getLeaveRequests());
      setAlertNotice({ text: `Leave request ${status} successfully.`, type: 'success' });
      setReviewComment('');
    }
  };

  // Employee Cancel Request
  const handleCancel = (requestId: string) => {
    const list = LocalStore.getLeaveRequests();
    const updated = list.map(r => {
      if (r.id === requestId && r.status === 'pending') {
        return { ...r, status: 'cancelled' as const };
      }
      return r;
    });
    localStorage.setItem('hcm_leaveRequests', JSON.stringify(updated));
    setLeaveRequests(updated);
    setAlertNotice({ text: 'Leave request cancelled.', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarOff className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Leave Management & Approvals</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-excludes weekends & public holidays, detects overlapping dates, and checks quota balances.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenAI}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Leave AI</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            alertNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{alertNotice.text}</span>
          </div>
          <button onClick={() => setAlertNotice(null)} className="text-slate-400">×</button>
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {leaveTypes.map(lt => {
          const used = leaveRequests
            .filter(r => r.employeeId === currentEmployee?.id && r.leaveTypeId === lt.id && r.status === 'approved')
            .reduce((s, r) => s + r.totalDays, 0);

          const remaining = lt.quotaDays === -1 ? 'Unlimited' : Math.max(0, lt.quotaDays - used);

          return (
            <div key={lt.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="w-1 absolute top-0 bottom-0 left-0" style={{ backgroundColor: lt.color }} />
              <div className="text-xs font-bold text-slate-500 uppercase">{lt.name}</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {remaining} <span className="text-xs font-normal text-slate-400">days left</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                <span>Quota: {lt.quotaDays === -1 ? '∞' : `${lt.quotaDays}d`}</span>
                <span>Used: {used}d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {role === 'employee' ? 'My Leave Applications' : 'Company Leave Applications & Review'}
          </h2>
          <span className="text-xs text-slate-400">{leaveRequests.length} total applications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaveRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{req.employeeName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {req.leaveTypeName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {req.startDate} to {req.endDate}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{req.totalDays} days</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {req.status === 'pending' && role !== 'employee' && (
                      <>
                        <button
                          onClick={() => handleReview(req.id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(req.id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded text-[11px] border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {req.status === 'pending' && role === 'employee' && req.employeeId === currentEmployee?.id && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 font-bold rounded text-[11px] border border-rose-200"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Submit Leave Application</h3>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Leave Category</label>
                <select
                  value={selectedLeaveTypeId}
                  onChange={e => setSelectedLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-semibold"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.quotaDays === -1 ? 'Unlimited' : `${lt.quotaDays} days/yr`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => handleDateChange(e.target.value, endDate)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => handleDateChange(startDate, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Working Days Calculation Indicator */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-950">
                <span className="font-semibold">Calculated Working Days:</span>
                <span className="font-extrabold text-sm text-indigo-700">
                  {calculatedDays} day(s)
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Automatically skips Saturdays, Sundays, and configured Pakistan public holidays.
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Attending family wedding, viral flu..."
                  className="w-full px-3 py-2 border rounded-lg h-20"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calculatedDays <= 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
