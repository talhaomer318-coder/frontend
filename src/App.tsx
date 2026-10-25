import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { FirstRunWizard } from './components/setup/FirstRunWizard';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';

// Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HRDashboard } from './pages/hr/HRDashboard';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { OrganizationSetup } from './pages/organization/OrganizationSetup';
import { EmployeeDirectory } from './pages/employees/EmployeeDirectory';
import { AttendanceModule } from './pages/attendance/AttendanceModule';
import { LeaveModule } from './pages/leaves/LeaveModule';
import { PayrollModule } from './pages/payroll/PayrollModule';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';

const AppContent: React.FC = () => {
  const { isFirstRun, role } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  // If first-time onboarding is needed, show wizard
  if (isFirstRun) {
    return <FirstRunWizard />;
  }

  // Render appropriate dashboard depending on active role
  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'employee':
      default:
        return (
          <EmployeeDashboard
            onOpenAI={() => setIsAIDrawerOpen(true)}
            onNavigateTab={tab => setCurrentTab(tab)}
          />
        );
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboard();
      case 'organization':
        return <OrganizationSetup />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'attendance':
        return <AttendanceModule />;
      case 'leaves':
        return <LeaveModule onOpenAI={() => setIsAIDrawerOpen(true)} />;
      case 'payroll':
        return <PayrollModule />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'audit':
        return <AuditLogPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenAI={() => setIsAIDrawerOpen(true)}
          mobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        onOpenLeaveModal={() => setCurrentTab('leaves')}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
