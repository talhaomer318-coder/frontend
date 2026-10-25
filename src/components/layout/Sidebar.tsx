import React from 'react';
import {
  LayoutDashboard,
  Building,
  Users,
  CalendarCheck,
  CalendarOff,
  Receipt,
  Megaphone,
  FileText,
  Sparkles,
  Shield,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { role } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      id: 'organization',
      label: 'Organization Setup',
      icon: Building,
      roles: ['admin'],
      badge: 'Admin',
    },
    {
      id: 'employees',
      label: 'Employee Directory',
      icon: Users,
      roles: ['admin', 'hr'],
    },
    {
      id: 'attendance',
      label: 'Attendance & Clock',
      icon: CalendarCheck,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      id: 'leaves',
      label: 'Leave Management',
      icon: CalendarOff,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      id: 'payroll',
      label: 'Payroll & Payslips',
      icon: Receipt,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      id: 'audit',
      label: 'Audit Activity Logs',
      icon: FileText,
      roles: ['admin'],
      badge: 'Secure',
    },
    {
      id: 'ai-assistant',
      label: 'HCM AI Assistant',
      icon: Sparkles,
      roles: ['admin', 'hr', 'employee'],
      highlight: true,
    },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-tight text-white flex items-center space-x-1.5">
                <span>HCM Lite</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Saylani Hackathon 2026
              </div>
            </div>
          </div>
        </div>

        {/* User Scope Indicator Card */}
        <div className="px-4 py-3 m-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400">Scoped Context: </span>
            <span className="font-bold text-white capitalize">{role}</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : item.highlight
                    ? 'text-indigo-300 hover:bg-slate-800/80 hover:text-white bg-indigo-950/40 border border-indigo-800/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-indigo-400 group-hover:text-indigo-200'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>Saylani Hackathon</span>
            <span className="font-mono text-[10px]">24-OCT-2026</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Built with MERN + LLM Tool Calling
          </div>
        </div>
      </aside>
    </>
  );
};
