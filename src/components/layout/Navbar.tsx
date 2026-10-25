import React, { useState } from 'react';
import {
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  LogOut,
  RotateCcw,
  Sparkles,
  Shield,
  Briefcase,
  User,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { LocalStore } from '../../services/api';

interface NavbarProps {
  onOpenAI: () => void;
  mobileMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAI, mobileMenuToggle }) => {
  const { user, role, switchRole, resetToFirstRun } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState(() => LocalStore.getNotifications(role, user?.employeeId));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setShowRoleDropdown(false);
    setNotifications(LocalStore.getNotifications(newRole));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
  };

  const roleBadgeColors: Record<UserRole, string> = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    hr: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    employee: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu & Search */}
      <div className="flex items-center space-x-3">
        <button
          onClick={mobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees, payroll, policies..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Controls: AI Trigger, Hackathon Role Switcher, Notifications, Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Ask AI Button */}
        <button
          onClick={onOpenAI}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow hover:from-indigo-700 hover:to-purple-700 transition"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-200" />
          <span>Ask HCM AI</span>
        </button>

        {/* Hackathon Role Switcher Pill (Crucial for live judging demonstration) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-full border text-xs font-semibold ring-1 transition ${roleBadgeColors[role]}`}
            title="Switch user role for instant demonstration"
          >
            {role === 'admin' && <Shield className="w-3.5 h-3.5" />}
            {role === 'hr' && <Briefcase className="w-3.5 h-3.5" />}
            {role === 'employee' && <User className="w-3.5 h-3.5" />}
            <span className="capitalize">{role} View</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Switch Role (Judge Demo Mode)
              </div>
              <button
                onClick={() => handleRoleChange('admin')}
                className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-slate-50 ${role === 'admin' ? 'font-bold text-rose-600 bg-rose-50/50' : 'text-slate-700'}`}
              >
                <Shield className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="font-semibold">Admin (Sarah Jenkins)</div>
                  <div className="text-[10px] text-slate-400">Company setup, lock payroll, audits</div>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('hr')}
                className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-slate-50 ${role === 'hr' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
              >
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-semibold">HR Lead (Michael Chang)</div>
                  <div className="text-[10px] text-slate-400">Employee directory, attendance, leaves, draft payroll</div>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('employee')}
                className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-slate-50 ${role === 'employee' ? 'font-bold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'}`}
              >
                <User className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-semibold">Employee (Alex Rivera)</div>
                  <div className="text-[10px] text-slate-400">Check-in, personal leaves, payslips</div>
                </div>
              </button>

              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={resetToFirstRun}
                className="w-full px-3 py-1.5 text-left text-amber-600 hover:bg-amber-50 flex items-center space-x-2 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Test First-Run Setup Wizard</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-indigo-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 transition ${!n.isRead ? 'bg-indigo-50/30' : ''}`}>
                    <div className="font-semibold text-slate-800 mb-0.5">{n.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{role} Account</div>
          </div>
        </div>
      </div>
    </header>
  );
};
