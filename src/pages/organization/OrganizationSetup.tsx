import React, { useState } from 'react';
import {
  Building2,
  Clock,
  MapPin,
  Plus,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { LocalStore } from '../../services/api';
import { Department, Designation, Holiday } from '../../types';

export const OrganizationSetup: React.FC = () => {
  const [settings, setSettings] = useState(() => LocalStore.getCompanySettings());
  const [departments, setDepartments] = useState<Department[]>(() => LocalStore.getDepartments());
  const [designations, setDesignations] = useState<Designation[]>(() => LocalStore.getDesignations());
  const [holidays, setHolidays] = useState<Holiday[]>(() => LocalStore.getHolidays());
  const leaveTypes = LocalStore.getLeaveTypes();

  const [savedNotice, setSavedNotice] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const [showDesigModal, setShowDesigModal] = useState(false);
  const [newDesigTitle, setNewDesigTitle] = useState('');
  const [newDesigDeptId, setNewDesigDeptId] = useState('');
  const [newDesigLevel, setNewDesigLevel] = useState('Mid');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    LocalStore.saveCompanySettings(settings);
    LocalStore.recordAudit({
      actorId: 'admin',
      actorName: 'Sarah Jenkins',
      actorRole: 'admin',
      action: 'UPDATE_COMPANY_SETTINGS',
      entity: 'CompanySettings',
      entityId: 'settings-1',
      details: `Updated company hours (${settings.officeStartTime}-${settings.officeEndTime}), grace (${settings.gracePeriodMinutes}m) and geofence radius (${settings.attendanceRadiusMeters}m)`,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    const created = LocalStore.addDepartment({
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      description: 'Department added via Organization Setup',
    });
    setDepartments([...departments, created]);
    setNewDeptName('');
    setNewDeptCode('');
    setShowDeptModal(false);
  };

  const handleAddDesig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigTitle) return;
    const targetDeptId = newDesigDeptId || departments[0]?.id;
    const created = LocalStore.addDesignation({
      title: newDesigTitle,
      departmentId: targetDeptId,
      level: newDesigLevel,
    });
    setDesignations([...designations, created]);
    setNewDesigTitle('');
    setShowDesigModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Organization & Policy Setup</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin configuration for company profile, work shifts, 15m grace window, geofence, and leave quotas.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved & Applied</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Work Hours, Grace Window & Geofence Coordinates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office Start Time</label>
            <input
              type="time"
              value={settings.officeStartTime}
              onChange={e => setSettings({ ...settings, officeStartTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office End Time</label>
            <input
              type="time"
              value={settings.officeEndTime}
              onChange={e => setSettings({ ...settings, officeEndTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Grace Period (Minutes)
            </label>
            <input
              type="number"
              value={settings.gracePeriodMinutes}
              onChange={e => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
            <span className="text-[10px] text-indigo-600 font-medium">Late after 09:15 AM</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={settings.officeLatitude}
              onChange={e => setSettings({ ...settings, officeLatitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={settings.officeLongitude}
              onChange={e => setSettings({ ...settings, officeLongitude: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Geofence Radius (Meters)</label>
            <input
              type="number"
              value={settings.attendanceRadiusMeters}
              onChange={e => setSettings({ ...settings, attendanceRadiusMeters: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            />
            <span className="text-[10px] text-slate-500">Allowed check-in radius</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Company Policy</span>
          </button>
        </div>
      </form>

      {/* Departments & Designations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Departments ({departments.length})</h2>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dept</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {departments.map(d => (
              <div key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{d.name}</div>
                  <div className="text-[11px] text-slate-400">{d.description || 'Active department'}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 text-[10px] font-bold">
                  {d.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Designations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Designations ({designations.length})</h2>
            </div>
            <button
              onClick={() => setShowDesigModal(true)}
              className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Title</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {designations.map(des => (
              <div key={des.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{des.title}</div>
                  <div className="text-[11px] text-slate-400">{des.departmentName}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                  {des.level} Level
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Quotas & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard Leave Quotas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Official Annual Leave Quotas (Saylani HCM Standard)</span>
          </h2>
          <div className="space-y-2 text-xs">
            {leaveTypes.map(lt => (
              <div key={lt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lt.color }} />
                  <div>
                    <div className="font-bold text-slate-800">{lt.name} ({lt.code})</div>
                    <div className="text-[11px] text-slate-500">{lt.description}</div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900">
                  {lt.quotaDays === -1 ? 'Unlimited' : `${lt.quotaDays} days`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Public Holidays */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Public Holidays (Excluded from Working Days)</span>
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {holidays.map(h => (
              <div key={h.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{h.name}</div>
                  <div className="text-[11px] text-slate-400">{h.description}</div>
                </div>
                <span className="font-mono font-bold text-indigo-600 text-xs">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Department</h3>
            <form onSubmit={handleAddDept} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="e.g. Quality Assurance"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={e => setNewDeptCode(e.target.value)}
                  placeholder="e.g. QA"
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Designation Modal */}
      {showDesigModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Designation</h3>
            <form onSubmit={handleAddDesig} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Job Title</label>
                <input
                  type="text"
                  value={newDesigTitle}
                  onChange={e => setNewDesigTitle(e.target.value)}
                  placeholder="e.g. DevOps Engineer"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Department</label>
                <select
                  value={newDesigDeptId}
                  onChange={e => setNewDesigDeptId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Seniority Level</label>
                <select
                  value={newDesigLevel}
                  onChange={e => setNewDesigLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Director">Director</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDesigModal(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
