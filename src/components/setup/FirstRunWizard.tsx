import React, { useState } from 'react';
import { Building2, ShieldCheck, UserPlus, Sparkles, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';

export const FirstRunWizard: React.FC = () => {
  const { completeFirstRun } = useAuth();
  const [step, setStep] = useState(1);

  // Form states
  const [companyName, setCompanyName] = useState('Saylani Tech Solutions');
  const [officeStartTime, setOfficeStartTime] = useState('09:00');
  const [officeEndTime, setOfficeEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [officeLat, setOfficeLat] = useState('24.8607');
  const [officeLon, setOfficeLon] = useState('67.0011');
  const [radiusMeters, setRadiusMeters] = useState(250);

  // Admin details
  const [adminName, setAdminName] = useState('Sarah Jenkins');
  const [adminEmail, setAdminEmail] = useState('admin@saylani.org');
  const [adminPassword, setAdminPassword] = useState('Admin@2026');

  // HR details
  const [hrName, setHrName] = useState('Michael Chang');
  const [hrEmail, setHrEmail] = useState('hr@saylani.org');
  const [hrTempPassword, setHrTempPassword] = useState('Welcome@2026');

  const handleFinish = () => {
    // Save settings
    const settings = LocalStore.getCompanySettings();
    settings.companyName = companyName;
    settings.officeStartTime = officeStartTime;
    settings.officeEndTime = officeEndTime;
    settings.gracePeriodMinutes = Number(gracePeriod);
    settings.officeLatitude = parseFloat(officeLat);
    settings.officeLongitude = parseFloat(officeLon);
    settings.attendanceRadiusMeters = Number(radiusMeters);
    LocalStore.saveCompanySettings(settings);

    completeFirstRun(companyName, adminName, adminEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HCM Lite Enterprise</h1>
                <p className="text-indigo-200 text-sm">Saylani Hackathon 24 Oct 2026 • First-Run Setup</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Step {step} of 4
            </span>
          </div>

          {/* Stepper Progress */}
          <div className="flex justify-between items-center mt-6 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 -translate-y-1/2 -z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-indigo-300 transition-all duration-300 -translate-y-1/2 -z-0"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[
              { num: 1, label: 'Company' },
              { num: 2, label: 'Admin' },
              { num: 3, label: 'HR Setup' },
              { num: 4, label: 'Launch' },
            ].map(s => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-sm ${
                    step >= s.num ? 'bg-white text-indigo-700 font-extrabold' : 'bg-indigo-900/80 text-white/70'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : s.num}
                </div>
                <span className="text-[11px] font-medium text-indigo-100 mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-8">
          {/* Step 1: Company Profile & Policies */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Company & Attendance Policies</h2>
                <p className="text-sm text-slate-500">Configure your organization details, office hours, and geofence rules.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                  placeholder="e.g. Saylani Tech Solutions"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Office Start
                  </label>
                  <input
                    type="time"
                    value={officeStartTime}
                    onChange={e => setOfficeStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Office End
                  </label>
                  <input
                    type="time"
                    value={officeEndTime}
                    onChange={e => setOfficeEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grace Period (mins)
                  </label>
                  <input
                    type="number"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                  <span className="text-[10px] text-slate-500">Late after 09:15 AM</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Latitude
                  </label>
                  <input
                    type="text"
                    value={officeLat}
                    onChange={e => setOfficeLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Longitude
                  </label>
                  <input
                    type="text"
                    value={officeLon}
                    onChange={e => setOfficeLon(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attendance Radius
                  </label>
                  <input
                    type="number"
                    value={radiusMeters}
                    onChange={e => setRadiusMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                  />
                  <span className="text-[10px] text-slate-500">meters (default 250m)</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                <span>Weekend Config: <strong>Saturday & Sunday</strong></span>
                <span>Annual Leave Quotas: <strong>Annual (14d), Sick (8d), Casual (10d), Unpaid (unlimited)</strong></span>
              </div>
            </div>
          )}

          {/* Step 2: Primary Admin Account */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Primary Admin Account</h2>
                <p className="text-sm text-slate-500">This account has full company-wide authorization and payroll finalization rights.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
                <span className="text-[10px] text-slate-500">Password will be hashed securely with bcrypt.</span>
              </div>
            </div>
          )}

          {/* Step 3: Initial HR Account */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Provision Initial HR Account</h2>
                <p className="text-sm text-slate-500">HR manages employee registration, attendance approvals, and draft payrolls.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  HR Lead Full Name
                </label>
                <input
                  type="text"
                  value={hrName}
                  onChange={e => setHrName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  HR Email Address
                </label>
                <input
                  type="email"
                  value={hrEmail}
                  onChange={e => setHrEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={hrTempPassword}
                  onChange={e => setHrTempPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium bg-slate-50"
                  readOnly
                />
                <span className="text-[10px] text-indigo-600 font-semibold">User will be required to change password on first login.</span>
              </div>
            </div>
          )}

          {/* Step 4: Ready to Launch */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Setup Verification Complete!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your company profile for <strong>{companyName}</strong> has been configured with real-world attendance rules, leave quotas, Pakistan income tax slabs, and role-based data permissions.
              </p>

              <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-700 border border-slate-200 max-w-md mx-auto space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Account:</span>
                  <span className="font-semibold">{adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HR Account:</span>
                  <span className="font-semibold">{hrEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grace Period:</span>
                  <span className="font-semibold">{gracePeriod} mins (Late after 09:15)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax Slabs:</span>
                  <span className="font-semibold">Pakistan Annual Income Tax Rules</span>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition flex items-center space-x-2"
              >
                <span>Complete Setup & Enter Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
