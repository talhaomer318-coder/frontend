import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Receipt,
  Download,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { formatPKR } from '../../utils/calculations';

interface EmployeeDashboardProps {
  onOpenAI: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onOpenAI, onNavigateTab }) => {
  const { currentEmployee, user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Today's attendance
  const attendanceList = LocalStore.getAttendance();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceList.find(a => a.employeeId === currentEmployee?.id && a.date === todayStr);

  // Leave balances
  const leaveRequests = LocalStore.getLeaveRequests();
  const leaveTypes = LocalStore.getLeaveTypes();
  const myLeaves = leaveRequests.filter(lr => lr.employeeId === currentEmployee?.id);

  // Payslips
  const payslips = LocalStore.getPayslips();
  const lastPayslip = payslips.find(p => p.employeeId === currentEmployee?.id && p.status === 'finalized');

  // Announcements
  const announcements = LocalStore.getAnnouncements().slice(0, 3);

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    if (!currentEmployee) return;

    // Simulate geofence check
    const simulatedCoords = { latitude: 24.8607, longitude: 67.0011 };
    const res = LocalStore.recordCheckIn(currentEmployee, simulatedCoords, true);

    if (res.status === 409) {
      setMessage({ text: res.error || 'Conflict (409): Already checked in today.', type: 'error' });
    } else {
      setMessage({
        text: `Checked in successfully at ${res.record.checkIn}! Status: ${res.record.status.toUpperCase()} (GPS verified: 45m from office)`,
        type: 'success',
      });
    }
  };

  const handleCheckOut = () => {
    if (!currentEmployee) return;
    const res = LocalStore.recordCheckOut(currentEmployee.id);
    if (res.status === 200 && res.record) {
      setMessage({
        text: `Checked out at ${res.record.checkOut}. Work duration: ${Math.floor((res.record.workMinutes || 0) / 60)}h ${(res.record.workMinutes || 0) % 60}m. Status: ${res.record.status.toUpperCase()}`,
        type: 'success',
      });
    } else {
      setMessage({ text: res.error || 'Failed to check out.', type: 'error' });
    }
  };

  // Weekly hours worked
  const weeklyHours = todayRecord?.workMinutes ? Math.round((todayRecord.workMinutes / 60) * 10) / 10 + 28 : 28;
  const weeklyTarget = 40;
  const progressPercent = Math.min(100, Math.round((weeklyHours / weeklyTarget) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Employee Self-Service Portal
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">
            Welcome back, {currentEmployee?.fullName || user?.name || 'Employee'}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {currentEmployee?.designationTitle} • {currentEmployee?.departmentName} • {currentEmployee?.employeeCode}
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-right">
          <div className="text-xs text-indigo-200 font-mono">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
          <div className="text-2xl font-mono font-bold tracking-wider text-white">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Alerts & Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Check-In / Check-Out Widget & Weekly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Clock-In Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Daily Attendance Clock</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                GPS Verified
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Check-in Status:</span>
                <span className={`font-bold capitalize ${
                  todayRecord?.status === 'present' ? 'text-emerald-600' :
                  todayRecord?.status === 'late' ? 'text-amber-600' : 'text-slate-600'
                }`}>
                  {todayRecord ? `${todayRecord.status.toUpperCase()} (${todayRecord.checkIn})` : 'Not Checked In'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Check-out Status:</span>
                <span className="font-semibold text-slate-700">
                  {todayRecord?.checkOut ? todayRecord.checkOut : 'Pending Checkout'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Geofence Distance:</span>
                <span className="text-slate-700 font-mono">45 meters (Within 250m radius)</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            {!todayRecord ? (
              <button
                onClick={handleCheckIn}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Web Check-In</span>
              </button>
            ) : !todayRecord.checkOut ? (
              <button
                onClick={handleCheckOut}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Web Check-Out</span>
              </button>
            ) : (
              <div className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-500 rounded-xl font-semibold text-xs text-center">
                Attendance Completed for Today
              </div>
            )}
          </div>
        </div>

        {/* Weekly Hours Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">Weekly Working Hours</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">{weeklyHours}h / 40h</span>
            </div>

            <div className="space-y-3">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>{progressPercent}% of target completed</span>
                <span>{Math.max(0, 40 - weeklyHours)}h remaining</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Late Arrivals This Month:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {todayRecord?.status === 'late' ? '1 arrival' : '0 arrivals'}
            </span>
          </div>
        </div>

        {/* Quick Leave Quota Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">Leave Balances</h2>
              </div>
              <button
                onClick={() => onNavigateTab('leaves')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Apply Leave →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {leaveTypes.map(lt => {
                const used = myLeaves
                  .filter(l => l.leaveTypeId === lt.id && l.status === 'approved')
                  .reduce((s, l) => s + l.totalDays, 0);
                const remaining = lt.quotaDays === -1 ? '∞' : Math.max(0, lt.quotaDays - used);

                return (
                  <div key={lt.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 truncate">{lt.name}</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      {remaining} <span className="text-[10px] font-normal text-slate-400">days</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={onOpenAI}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Leave (Natural Language AI)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Last Payslip & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Payslip Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Latest Finalized Payslip</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              September 2026
            </span>
          </div>

          {lastPayslip ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Net Take-Home Salary</div>
                  <div className="text-2xl font-black text-emerald-700">{formatPKR(lastPayslip.netSalary)}</div>
                </div>
                <button
                  onClick={() => onNavigateTab('payroll')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400">Gross Salary</div>
                  <div className="font-bold">{formatPKR(lastPayslip.grossSalary)}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400">Income Tax</div>
                  <div className="font-bold text-rose-600">-{formatPKR(lastPayslip.monthlyTaxDeduction)}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400">Attendance Ded.</div>
                  <div className="font-bold text-amber-600">-{formatPKR(lastPayslip.totalLossOfPayDeductions)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No finalized payslips available yet.
            </div>
          )}
        </div>

        {/* Company Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Company Announcements</h2>
            <button
              onClick={() => onNavigateTab('announcements')}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {announcements.map(ann => (
              <div key={ann.id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{ann.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{ann.createdAt}</span>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
