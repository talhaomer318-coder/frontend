import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Filter,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { AttendanceRecord, AttendanceCorrectionRequest } from '../../types';

export const AttendanceModule: React.FC = () => {
  const { currentEmployee, role } = useAuth();
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => LocalStore.getAttendance());
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Correction requests state
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>([
    {
      id: 'corr-1',
      employeeId: 'emp-3',
      employeeName: 'Alex Rivera',
      date: '2026-10-21',
      requestedCheckIn: '09:00',
      requestedCheckOut: '18:00',
      reason: 'Biometric device timeout on entrance gate',
      status: 'pending',
      createdAt: '2026-10-21',
    },
  ]);

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(selectedDate);
  const [correctionIn, setCorrectionIn] = useState('09:00');
  const [correctionOut, setCorrectionOut] = useState('18:00');
  const [correctionReason, setCorrectionReason] = useState('');

  // Daily Board calculations
  const filteredRecords = attendanceList.filter(r => r.date === selectedDate);
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;
  const halfDayCount = filteredRecords.filter(r => r.status === 'half-day').length;

  const handleWebCheckIn = () => {
    if (!currentEmployee) return;
    const res = LocalStore.recordCheckIn(currentEmployee, { latitude: 24.8607, longitude: 67.0011 }, true);

    if (res.status === 409) {
      setMessage({ text: res.error || 'Conflict (409): Already checked in today.', type: 'error' });
    } else {
      setMessage({
        text: `Check-in recorded at ${res.record.checkIn}. Status: ${res.record.status.toUpperCase()}`,
        type: 'success',
      });
      setAttendanceList(LocalStore.getAttendance());
    }
  };

  const handleWebCheckOut = () => {
    if (!currentEmployee) return;
    const res = LocalStore.recordCheckOut(currentEmployee.id);
    if (res.status === 200 && res.record) {
      setMessage({
        text: `Checked out at ${res.record.checkOut}. Status: ${res.record.status.toUpperCase()}`,
        type: 'success',
      });
      setAttendanceList(LocalStore.getAttendance());
    } else {
      setMessage({ text: res.error || 'Check-out failed.', type: 'error' });
    }
  };

  const handleCreateCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !correctionReason) return;

    const newReq: AttendanceCorrectionRequest = {
      id: `corr-${Date.now()}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.fullName,
      date: correctionDate,
      requestedCheckIn: correctionIn,
      requestedCheckOut: correctionOut,
      reason: correctionReason,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCorrections([newReq, ...corrections]);
    setShowCorrectionModal(false);
    setCorrectionReason('');
    setMessage({ text: 'Correction request submitted to HR team.', type: 'success' });
  };

  const handleReviewCorrection = (id: string, status: 'approved' | 'rejected') => {
    const updated = corrections.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          reviewedBy: 'Michael Chang',
          reviewedAt: new Date().toISOString().split('T')[0],
        };
      }
      return c;
    });
    setCorrections(updated);
    setMessage({ text: `Attendance correction ${status}.`, type: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Attendance & Daily Board</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-verified check-in/out, 15-minute grace window (late after 09:15 AM), and geofence verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {role === 'employee' && (
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request Correction</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWebCheckIn}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              Check-In Now
            </button>
            <button
              onClick={handleWebCheckOut}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              Check-Out Now
            </button>
          </div>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400">×</button>
        </div>
      )}

      {/* Date Filter & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="block font-bold text-slate-900 text-sm mt-0.5 border-none p-0 focus:ring-0"
            />
          </div>
          <Calendar className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">On-Time Present</span>
          <div className="text-xl font-black text-emerald-600 mt-0.5">{presentCount}</div>
          <span className="text-[10px] text-slate-500">Before 09:15 AM</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Late Arrivals</span>
          <div className="text-xl font-black text-amber-600 mt-0.5">{lateCount}</div>
          <span className="text-[10px] text-slate-500">After 09:15 AM grace</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Half-Day Status</span>
          <div className="text-xl font-black text-purple-600 mt-0.5">{halfDayCount}</div>
          <span className="text-[10px] text-slate-500">&lt; 5 hours worked</span>
        </div>
      </div>

      {/* Daily Attendance Board Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daily Attendance Log ({selectedDate})</h2>
          <span className="text-xs text-slate-400">{filteredRecords.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Work Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Geofence Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No attendance records for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.employeeName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{rec.employeeCode}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.departmentName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{rec.checkIn}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{rec.checkOut || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {rec.workMinutes ? `${Math.floor(rec.workMinutes / 60)}h ${rec.workMinutes % 60}m` : 'In Progress'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        rec.status === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center space-x-1 text-emerald-600 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Within 250m</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Requests (HR Review Section) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Attendance Correction Requests</h2>
            <p className="text-xs text-slate-500">Employee correction requests awaiting HR review and approval.</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
            {corrections.filter(c => c.status === 'pending').length} Pending
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {corrections.map(c => (
            <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-800">
                  {c.employeeName} • Requested date: <span className="font-mono">{c.date}</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Requested Timings: <strong>{c.requestedCheckIn}</strong> to <strong>{c.requestedCheckOut}</strong>
                </div>
                <div className="text-slate-600 text-[11px] italic mt-0.5">"{c.reason}"</div>
              </div>

              <div className="flex items-center space-x-2">
                {c.status === 'pending' ? (
                  role !== 'employee' ? (
                    <>
                      <button
                        onClick={() => handleReviewCorrection(c.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewCorrection(c.id, 'rejected')}
                        className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-xs border border-rose-200"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                      Pending HR Review
                    </span>
                  )
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    c.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {c.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Submit Attendance Correction</h3>
            <form onSubmit={handleCreateCorrection} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Date</label>
                <input
                  type="date"
                  value={correctionDate}
                  onChange={e => setCorrectionDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Actual In Time</label>
                  <input
                    type="time"
                    value={correctionIn}
                    onChange={e => setCorrectionIn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Actual Out Time</label>
                  <input
                    type="time"
                    value={correctionOut}
                    onChange={e => setCorrectionOut(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason for Correction</label>
                <textarea
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Biometric scanner malfunction..."
                  className="w-full px-3 py-2 border rounded-lg h-20"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
