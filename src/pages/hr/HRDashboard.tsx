import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  CalendarOff,
  AlertCircle,
  Sparkles,
  TrendingUp,
  ChevronRight,
  UserCheck,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { LocalStore } from '../../services/api';

export const HRDashboard: React.FC = () => {
  const employees = LocalStore.getEmployees();
  const attendance = LocalStore.getAttendance();
  const leaveRequests = LocalStore.getLeaveRequests();
  const leaveTypes = LocalStore.getLeaveTypes();

  const totalEmployees = employees.length;
  const todayRecords = attendance;

  const presentToday = todayRecords.filter(r => r.status === 'present').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const onLeaveToday = leaveRequests.filter(r => r.status === 'approved' && r.startDate <= todayStr && r.endDate >= todayStr).length;

  // Top Late Comers
  const lateComers = todayRecords
    .filter(r => r.status === 'late')
    .slice(0, 5);

  // Past 7 Days Attendance Trend Mock Data
  const attendanceTrendData = [
    { day: 'Mon', present: 4, late: 0 },
    { day: 'Tue', present: 3, late: 1 },
    { day: 'Wed', present: 4, late: 0 },
    { day: 'Thu', present: 3, late: 1 },
    { day: 'Fri', present: 4, late: 0 },
    { day: 'Sat', present: 0, late: 0 },
    { day: 'Sun', present: 0, late: 0 },
  ];

  // Leave Utilization by Type
  const leaveUtilizationData = leaveTypes.map(lt => {
    const days = leaveRequests
      .filter(lr => lr.leaveTypeId === lt.id && lr.status === 'approved')
      .reduce((sum, lr) => sum + lr.totalDays, 0);
    return { name: lt.name, days: days || (lt.code === 'ANNUAL' ? 5 : 2), color: lt.color };
  });

  const hrAiSummary = [
    `Workforce presence rate today is at ${Math.round(((presentToday + lateToday) / totalEmployees) * 100)}% with ${presentToday} on time and ${lateToday} late arrivals.`,
    `${pendingLeaves} pending employee leave application(s) require HR review and approval.`,
    `Grace period of 15 minutes is active: arrivals after 09:15 AM are automatically flagged as late.`,
    `September payroll run is finalized; draft for October 2026 can be prepared.`,
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">HR Operations & People Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time attendance board, leave pipeline, late arrivals and workforce trends.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
          <Clock className="w-3.5 h-3.5" />
          <span>Office Hours: 09:00 - 18:00 (15m Grace Active)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Staff</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active Accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Present Today</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{presentToday}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">On-Time Arrivals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Late Arrivals</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{lateToday}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">After 09:15 AM</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">On Leave</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{onLeaveToday}</div>
          <div className="text-[11px] text-slate-500 mt-1">Approved Absence</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending Approvals</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{pendingLeaves}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">Action Required</div>
        </div>
      </div>

      {/* HR AI Insights */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-lg border border-purple-800/40">
        <div className="flex items-center space-x-2 text-purple-300 mb-3">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Daily People Insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200">
          {hrAiSummary.map((pt, i) => (
            <div key={i} className="flex items-start space-x-2 bg-white/5 p-2.5 rounded-lg border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Charts: 7-Day Attendance & Leave Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">7-Day Attendance Trend</h2>
            </div>
            <span className="text-xs text-slate-400">Weekly Presence</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="present" name="On Time" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="late" name="Late Arrivals" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarOff className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Leave Utilization</h2>
            </div>
            <span className="text-xs text-slate-400">By Leave Type</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="days"
                >
                  {leaveUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} days`, 'Utilized']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Late-Comers Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Today's Late Arrivals (After 09:15 AM)</h2>
          </div>
          <span className="text-xs text-slate-400">{lateComers.length} employees flagged</span>
        </div>

        {lateComers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All reporting employees arrived on time today!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Arrival Time</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lateComers.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{r.employeeName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{r.employeeCode}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.departmentName}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-amber-600">{r.checkIn}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        Late Arrival
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
