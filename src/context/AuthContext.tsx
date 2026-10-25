import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Employee } from '../types';
import { LocalStore } from '../services/api';

interface AuthContextType {
  user: User | null;
  currentEmployee: Employee | null;
  role: UserRole;
  isFirstRun: boolean;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  resetToFirstRun: () => void;
  completeFirstRun: (companyName: string, adminName: string, adminEmail: string) => void;
  changePassword: (newPass: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => {
    return localStorage.getItem('hcm_first_run_done') !== 'true';
  });

  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('hcm_active_role') as UserRole) || 'admin';
  });

  const [user, setUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // Sync user and currentEmployee with selected role
  useEffect(() => {
    if (isFirstRun) {
      setUser(null);
      setCurrentEmployee(null);
      return;
    }

    const employees = LocalStore.getEmployees();
    let emp = employees.find(e => e.role === role);
    if (!emp && employees.length > 0) {
      emp = employees[0];
    }

    if (emp) {
      setCurrentEmployee(emp);
      setUser({
        id: emp.id,
        email: emp.email,
        name: emp.fullName,
        role: emp.role,
        employeeId: emp.id,
        avatar: emp.avatar,
        mustChangePassword: false,
      });
    } else {
      setUser({
        id: 'user-admin',
        email: 'admin@saylani.org',
        name: 'Sarah Jenkins',
        role: 'admin',
        mustChangePassword: false,
      });
    }
  }, [role, isFirstRun]);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('hcm_active_role', newRole);
  };

  const login = (email: string, requestedRole?: UserRole): boolean => {
    const employees = LocalStore.getEmployees();
    const found = employees.find(e => e.email.toLowerCase() === email.toLowerCase());

    if (found) {
      switchRole(found.role);
      return true;
    }

    if (requestedRole) {
      switchRole(requestedRole);
      return true;
    }

    // Default admin fallback
    switchRole('admin');
    return true;
  };

  const logout = () => {
    switchRole('employee');
  };

  const resetToFirstRun = () => {
    localStorage.removeItem('hcm_first_run_done');
    localStorage.removeItem('hcm_settings');
    localStorage.removeItem('hcm_employees');
    localStorage.removeItem('hcm_attendance');
    localStorage.removeItem('hcm_leaveRequests');
    localStorage.removeItem('hcm_payrollRuns');
    localStorage.removeItem('hcm_payslips');
    setIsFirstRun(true);
    setUser(null);
    setCurrentEmployee(null);
  };

  const completeFirstRun = (companyName: string, adminName: string, adminEmail: string) => {
    localStorage.setItem('hcm_first_run_done', 'true');
    const settings = LocalStore.getCompanySettings();
    settings.companyName = companyName;
    settings.companyEmail = adminEmail;
    LocalStore.saveCompanySettings(settings);

    // Update primary admin employee
    const emps = LocalStore.getEmployees();
    if (emps.length > 0) {
      emps[0].fullName = adminName;
      emps[0].email = adminEmail;
      LocalStore.updateEmployee(emps[0].id, { fullName: adminName, email: adminEmail });
    }

    setIsFirstRun(false);
    switchRole('admin');
  };

  const changePassword = (newPass: string) => {
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentEmployee,
        role,
        isFirstRun,
        login,
        logout,
        switchRole,
        resetToFirstRun,
        completeFirstRun,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
