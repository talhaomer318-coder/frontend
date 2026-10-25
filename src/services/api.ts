import axios from 'axios';
import {
  User,
  CompanySettings,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  LeaveType,
  LeaveRequest,
  Holiday,
  MonthlyPayrollRun,
  Payslip,
  Announcement,
  Notification,
  AuditLogEntry,
  AILogEntry,
} from '../types';
import { calculatePakistanAnnualTax, calculateSalaryComponents, getWorkingDaysInMonth, calculateLeaveWorkingDays } from '../utils/calculations';

const API_BASE_URL = 'http://localhost:3004';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hcm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Initial Data Seed
const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'Saylani HCM Enterprise',
  companyEmail: 'admin@saylani.org',
  companyPhone: '+92 21 111 729 526',
  companyAddress: 'A-25, Bahadurabad Chowrangi, Karachi, Pakistan',
  officeStartTime: '09:00',
  officeEndTime: '18:00',
  gracePeriodMinutes: 15,
  weekendDays: ['Saturday', 'Sunday'],
  officeLatitude: 24.8607,
  officeLongitude: 67.0011,
  attendanceRadiusMeters: 250,
  rules: {
    halfDayHoursThreshold: 5,
    fullDayHoursThreshold: 8,
    autoMarkAbsentAfterDays: 1,
  },
};

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', headName: 'Sarah Jenkins', description: 'Core software architecture & development', createdAt: '2026-01-10' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', headName: 'Michael Chang', description: 'People operations, recruiting and culture', createdAt: '2026-01-10' },
  { id: 'dept-3', name: 'Product & Design', code: 'PRD', headName: 'Zainab Ahmed', description: 'Product strategy, UI/UX design and user research', createdAt: '2026-01-12' },
  { id: 'dept-4', name: 'Finance & Accounts', code: 'FIN', headName: 'Hamza Khan', description: 'Payroll, financial accounting and tax compliance', createdAt: '2026-01-15' },
];

const DEFAULT_DESIGNATIONS: Designation[] = [
  { id: 'desig-1', title: 'VP of Technology', departmentId: 'dept-1', departmentName: 'Engineering', level: 'Director', createdAt: '2026-01-10' },
  { id: 'desig-2', title: 'Senior Software Engineer', departmentId: 'dept-1', departmentName: 'Engineering', level: 'Senior', createdAt: '2026-01-10' },
  { id: 'desig-3', title: 'Full Stack Engineer', departmentId: 'dept-1', departmentName: 'Engineering', level: 'Mid', createdAt: '2026-01-12' },
  { id: 'desig-4', title: 'HR Director', departmentId: 'dept-2', departmentName: 'Human Resources', level: 'Director', createdAt: '2026-01-10' },
  { id: 'desig-5', title: 'HR Generalist', departmentId: 'dept-2', departmentName: 'Human Resources', level: 'Mid', createdAt: '2026-01-12' },
  { id: 'desig-6', title: 'Lead Product Designer', departmentId: 'dept-3', departmentName: 'Product & Design', level: 'Lead', createdAt: '2026-01-15' },
];

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-1', name: 'Annual Leave', code: 'ANNUAL', quotaDays: 14, isPaid: true, color: '#4f46e5', description: 'Paid annual vacation (14 days)' },
  { id: 'lt-2', name: 'Sick Leave', code: 'SICK', quotaDays: 8, isPaid: true, color: '#ef4444', description: 'Medical and recuperation leave (8 days)' },
  { id: 'lt-3', name: 'Casual Leave', code: 'CASUAL', quotaDays: 10, isPaid: true, color: '#f59e0b', description: 'Short notice urgent personal leave (10 days)' },
  { id: 'lt-4', name: 'Unpaid Leave', code: 'UNPAID', quotaDays: -1, isPaid: false, color: '#64748b', description: 'Loss of pay leave (unlimited)' },
];

const DEFAULT_HOLIDAYS: Holiday[] = [
  { id: 'h-1', name: 'Pakistan Day', date: '2026-03-23', type: 'national', description: 'National Republic Day' },
  { id: 'h-2', name: 'Labor Day', date: '2026-05-01', type: 'national', description: 'International Workers Day' },
  { id: 'h-3', name: 'Independence Day', date: '2026-08-14', type: 'national', description: 'Independence Day of Pakistan' },
  { id: 'h-4', name: 'Iqbal Day', date: '2026-11-09', type: 'national', description: 'Allama Iqbal Day' },
  { id: 'h-5', name: 'Quaid-e-Azam Day', date: '2026-12-25', type: 'national', description: 'Birthday of Quaid-e-Azam' },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-0101',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    fullName: 'Sarah Jenkins',
    email: 'admin@saylani.org',
    phone: '+92 300 1234567',
    address: 'Clifton Block 5, Karachi',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    designationId: 'desig-1',
    designationTitle: 'VP of Technology',
    joiningDate: '2024-01-15',
    status: 'active',
    gender: 'female',
    basicSalary: 250000,
    hra: 100000, // 40%
    medicalAllowance: 25000, // 10%
    grossSalary: 375000, // 1.5 * basic
    bankAccount: { bankName: 'Meezan Bank', accountNumber: '010203040506', iban: 'PK36MEZN00010203040506' },
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-0102',
    firstName: 'Michael',
    lastName: 'Chang',
    fullName: 'Michael Chang',
    email: 'hr@saylani.org',
    phone: '+92 321 9876543',
    address: 'Gulshan-e-Iqbal Block 13, Karachi',
    departmentId: 'dept-2',
    departmentName: 'Human Resources',
    designationId: 'desig-4',
    designationTitle: 'HR Director',
    joiningDate: '2024-03-01',
    status: 'active',
    gender: 'male',
    basicSalary: 180000,
    hra: 72000,
    medicalAllowance: 18000,
    grossSalary: 270000,
    bankAccount: { bankName: 'Bank Alfalah', accountNumber: '556677889900', iban: 'PK45ALFH00556677889900' },
    role: 'hr',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-3',
    employeeCode: 'EMP-0103',
    firstName: 'Alex',
    lastName: 'Rivera',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@saylani.org',
    phone: '+92 333 4455667',
    address: 'DHA Phase 6, Karachi',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    designationId: 'desig-2',
    designationTitle: 'Senior Software Engineer',
    joiningDate: '2025-02-10',
    status: 'active',
    gender: 'male',
    basicSalary: 150000,
    hra: 60000,
    medicalAllowance: 15000,
    grossSalary: 225000,
    bankAccount: { bankName: 'Standard Chartered', accountNumber: '112233445566', iban: 'PK99SCBL00112233445566' },
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-4',
    employeeCode: 'EMP-0104',
    firstName: 'Fatima',
    lastName: 'Noor',
    fullName: 'Fatima Noor',
    email: 'fatima.noor@saylani.org',
    phone: '+92 345 5566778',
    address: 'PECHS Block 2, Karachi',
    departmentId: 'dept-3',
    departmentName: 'Product & Design',
    designationId: 'desig-6',
    designationTitle: 'Lead Product Designer',
    joiningDate: '2025-06-15',
    status: 'active',
    gender: 'female',
    basicSalary: 160000,
    hra: 64000,
    medicalAllowance: 16000,
    grossSalary: 240000,
    bankAccount: { bankName: 'Habib Bank Limited', accountNumber: '778899001122', iban: 'PK12HABB00778899001122' },
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

// LocalStorage Persistence Layer Helper
function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(`hcm_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`hcm_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error', e);
  }
}

// Client-Side Store Controller (Fallback & Standalone Mode)
export const LocalStore = {
  getCompanySettings(): CompanySettings {
    return getStorage('settings', DEFAULT_COMPANY_SETTINGS);
  },
  saveCompanySettings(settings: CompanySettings): void {
    setStorage('settings', settings);
  },

  getDepartments(): Department[] {
    return getStorage('departments', DEFAULT_DEPARTMENTS);
  },
  addDepartment(dept: Omit<Department, 'id' | 'createdAt'>): Department {
    const list = this.getDepartments();
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.push(newDept);
    setStorage('departments', list);
    return newDept;
  },

  getDesignations(): Designation[] {
    return getStorage('designations', DEFAULT_DESIGNATIONS);
  },
  addDesignation(desig: Omit<Designation, 'id' | 'createdAt'>): Designation {
    const list = this.getDesignations();
    const depts = this.getDepartments();
    const dept = depts.find(d => d.id === desig.departmentId);
    const newDesig: Designation = {
      ...desig,
      departmentName: dept?.name || '',
      id: `desig-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.push(newDesig);
    setStorage('designations', list);
    return newDesig;
  },

  getEmployees(): Employee[] {
    return getStorage('employees', DEFAULT_EMPLOYEES);
  },
  addEmployee(empData: Partial<Employee>): Employee {
    const list = this.getEmployees();
    const count = list.length;
    const employeeCode = `EMP-${String(count + 101).padStart(4, '0')}`;
    const basicSalary = Number(empData.basicSalary || 100000);
    const { hra, medicalAllowance, grossSalary } = calculateSalaryComponents(basicSalary);
    const depts = this.getDepartments();
    const desigs = this.getDesignations();

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode,
      firstName: empData.firstName || '',
      lastName: empData.lastName || '',
      fullName: `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
      email: (empData.email || '').toLowerCase(),
      phone: empData.phone || '',
      address: empData.address || '',
      gender: empData.gender || 'male',
      departmentId: empData.departmentId || depts[0].id,
      departmentName: depts.find(d => d.id === empData.departmentId)?.name || depts[0].name,
      designationId: empData.designationId || desigs[0].id,
      designationTitle: desigs.find(d => d.id === empData.designationId)?.title || desigs[0].title,
      joiningDate: empData.joiningDate || new Date().toISOString().split('T')[0],
      status: empData.status || 'active',
      basicSalary,
      hra,
      medicalAllowance,
      grossSalary,
      bankAccount: empData.bankAccount || { bankName: 'Meezan Bank', accountNumber: '0011223344', iban: 'PK00MEZN0011223344' },
      role: empData.role || 'employee',
      avatar: empData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    };

    list.push(newEmp);
    setStorage('employees', list);
    return newEmp;
  },
  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const list = this.getEmployees();
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return null;

    if (updates.basicSalary) {
      const basic = Number(updates.basicSalary);
      const comps = calculateSalaryComponents(basic);
      updates.hra = comps.hra;
      updates.medicalAllowance = comps.medicalAllowance;
      updates.grossSalary = comps.grossSalary;
    }

    list[index] = { ...list[index], ...updates };
    setStorage('employees', list);
    return list[index];
  },

  getAttendance(): AttendanceRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const defaultAttendance: AttendanceRecord[] = [
      {
        id: 'att-1',
        employeeId: 'emp-1',
        employeeName: 'Sarah Jenkins',
        employeeCode: 'EMP-0101',
        departmentName: 'Engineering',
        date: today,
        checkIn: '08:55:12',
        checkOut: '18:05:00',
        workMinutes: 550,
        status: 'present',
        faceVerified: true,
      },
      {
        id: 'att-2',
        employeeId: 'emp-2',
        employeeName: 'Michael Chang',
        employeeCode: 'EMP-0102',
        departmentName: 'Human Resources',
        date: today,
        checkIn: '09:08:44',
        workMinutes: 320,
        status: 'present',
        faceVerified: true,
      },
      {
        id: 'att-3',
        employeeId: 'emp-4',
        employeeName: 'Fatima Noor',
        employeeCode: 'EMP-0104',
        departmentName: 'Product & Design',
        date: today,
        checkIn: '09:28:10', // Late after 9:15
        workMinutes: 240,
        status: 'late',
        faceVerified: true,
      },
    ];
    return getStorage('attendance', defaultAttendance);
  },
  recordCheckIn(employee: Employee, coordinates?: { latitude: number; longitude: number }, faceVerified?: boolean): { record: AttendanceRecord; error?: string; status: number } {
    const list = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    // Duplicate check: HTTP 409
    const existing = list.find(a => a.employeeId === employee.id && a.date === today);
    if (existing) {
      return {
        record: existing,
        error: `Conflict (409): Already checked in today at ${existing.checkIn}`,
        status: 409,
      };
    }

    // Status: 9:15 AM threshold (9:00 + 15m grace)
    const [h, m] = nowTime.split(':').map(Number);
    const isLate = h > 9 || (h === 9 && m > 15);
    const recStatus = isLate ? 'late' : 'present';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeCode: employee.employeeCode,
      departmentName: employee.departmentName,
      date: today,
      checkIn: nowTime,
      status: recStatus,
      faceVerified: Boolean(faceVerified),
      checkInCoordinates: coordinates ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        distanceMeters: 45,
        isWithinRadius: true,
      } : undefined,
    };

    list.push(newRecord);
    setStorage('attendance', list);
    return { record: newRecord, status: 201 };
  },
  recordCheckOut(employeeId: string): { record?: AttendanceRecord; error?: string; status: number } {
    const list = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const index = list.findIndex(a => a.employeeId === employeeId && a.date === today);

    if (index === -1) {
      return { error: 'No check-in record found for today.', status: 404 };
    }

    const current = list[index];
    if (current.checkOut) {
      return { error: `Already checked out at ${current.checkOut}`, status: 400 };
    }

    const outTime = new Date().toTimeString().split(' ')[0];
    const [inH, inM] = current.checkIn.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    const workMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

    // Under 5 hours (300m) is half-day
    const finalStatus = workMinutes < 300 ? 'half-day' : current.status;

    list[index] = {
      ...current,
      checkOut: outTime,
      workMinutes,
      status: finalStatus,
    };
    setStorage('attendance', list);
    return { record: list[index], status: 200 };
  },

  getLeaveTypes(): LeaveType[] {
    return getStorage('leaveTypes', DEFAULT_LEAVE_TYPES);
  },
  getHolidays(): Holiday[] {
    return getStorage('holidays', DEFAULT_HOLIDAYS);
  },
  getLeaveRequests(): LeaveRequest[] {
    const defaultLeaves: LeaveRequest[] = [
      {
        id: 'lr-1',
        employeeId: 'emp-3',
        employeeName: 'Alex Rivera',
        employeeCode: 'EMP-0103',
        departmentName: 'Engineering',
        leaveTypeId: 'lt-1',
        leaveTypeName: 'Annual Leave',
        leaveTypeCode: 'ANNUAL',
        startDate: '2026-11-02',
        endDate: '2026-11-04',
        totalDays: 3,
        reason: 'Family event and short vacation',
        status: 'pending',
        createdAt: '2026-10-22',
      },
      {
        id: 'lr-2',
        employeeId: 'emp-4',
        employeeName: 'Fatima Noor',
        employeeCode: 'EMP-0104',
        departmentName: 'Product & Design',
        leaveTypeId: 'lt-2',
        leaveTypeName: 'Sick Leave',
        leaveTypeCode: 'SICK',
        startDate: '2026-10-12',
        endDate: '2026-10-13',
        totalDays: 2,
        reason: 'Viral fever and rest',
        status: 'approved',
        reviewerComments: 'Approved. Get well soon!',
        reviewedBy: 'Michael Chang',
        reviewedAt: '2026-10-12',
        createdAt: '2026-10-11',
      },
    ];
    return getStorage('leaveRequests', defaultLeaves);
  },
  applyLeave(reqData: {
    employee: Employee;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): { request?: LeaveRequest; error?: string; status: number } {
    const list = this.getLeaveRequests();
    const holidays = this.getHolidays();
    const leaveTypes = this.getLeaveTypes();
    const targetType = leaveTypes.find(lt => lt.id === reqData.leaveTypeId);

    if (!targetType) {
      return { error: 'Invalid leave type.', status: 400 };
    }

    // 1. Calculate working days excluding Sat/Sun and holidays
    const totalDays = calculateLeaveWorkingDays(reqData.startDate, reqData.endDate, holidays);
    if (totalDays <= 0) {
      return { error: 'HTTP 422: Selected range contains zero working days (weekends or public holidays only).', status: 422 };
    }

    // 2. Overlap check: HTTP 422
    const overlap = list.find(r =>
      r.employeeId === reqData.employee.id &&
      r.status !== 'cancelled' &&
      r.status !== 'rejected' &&
      ((reqData.startDate <= r.endDate && reqData.endDate >= r.startDate))
    );
    if (overlap) {
      return {
        error: `HTTP 422: Overlapping leave request exists from ${overlap.startDate} to ${overlap.endDate} (Status: ${overlap.status}).`,
        status: 422,
      };
    }

    // 3. Balance check: HTTP 422
    if (targetType.quotaDays !== -1) {
      const approvedDays = list
        .filter(r => r.employeeId === reqData.employee.id && r.leaveTypeId === targetType.id && r.status === 'approved')
        .reduce((sum, r) => sum + r.totalDays, 0);

      const remaining = Math.max(0, targetType.quotaDays - approvedDays);
      if (totalDays > remaining) {
        return {
          error: `HTTP 422: Insufficient leave balance. Requested: ${totalDays} days, Remaining: ${remaining} days.`,
          status: 422,
        };
      }
    }

    // 4. Save
    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: reqData.employee.id,
      employeeName: reqData.employee.fullName,
      employeeCode: reqData.employee.employeeCode,
      departmentName: reqData.employee.departmentName,
      leaveTypeId: targetType.id,
      leaveTypeName: targetType.name,
      leaveTypeCode: targetType.code,
      startDate: reqData.startDate,
      endDate: reqData.endDate,
      totalDays,
      reason: reqData.reason,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    list.push(newReq);
    setStorage('leaveRequests', list);
    return { request: newReq, status: 201 };
  },
  reviewLeave(requestId: string, status: 'approved' | 'rejected', reviewerName: string, comments: string): LeaveRequest | null {
    const list = this.getLeaveRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      status,
      reviewerComments: comments,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString().split('T')[0],
    };
    setStorage('leaveRequests', list);
    return list[index];
  },

  // Payroll Runs & Payslips
  getPayrollRuns(): MonthlyPayrollRun[] {
    const defaultRuns: MonthlyPayrollRun[] = [
      {
        id: 'pr-2026-09',
        month: 9,
        year: 2026,
        status: 'finalized',
        finalizedBy: 'Sarah Jenkins',
        finalizedAt: '2026-09-30',
        totalGross: 1110000,
        totalDeductions: 25000,
        totalTax: 86250,
        totalNet: 998750,
        employeeCount: 4,
        createdAt: '2026-09-28',
      },
    ];
    return getStorage('payrollRuns', defaultRuns);
  },
  getPayslips(): Payslip[] {
    const defaultPayslips: Payslip[] = [
      {
        id: 'ps-1',
        payrollRunId: 'pr-2026-09',
        employeeId: 'emp-3',
        employeeCode: 'EMP-0103',
        employeeName: 'Alex Rivera',
        email: 'alex.rivera@saylani.org',
        departmentName: 'Engineering',
        designationTitle: 'Senior Software Engineer',
        joiningDate: '2025-02-10',
        month: 9,
        year: 2026,
        basicSalary: 150000,
        hra: 60000,
        medicalAllowance: 15000,
        grossSalary: 225000,
        workingDaysInMonth: 22,
        presentDays: 21,
        halfDays: 0,
        absentDays: 1,
        unpaidLeaveDays: 0,
        effectiveWorkingDays: 21,
        dailyRate: 10227,
        halfDayDeduction: 0,
        absentDeduction: 10227,
        unpaidLeaveDeduction: 0,
        totalLossOfPayDeductions: 10227,
        projectedAnnualGross: 2700000,
        calculatedAnnualTax: 285000,
        monthlyTaxDeduction: 23750,
        taxSlabDescription: 'PKR 2.4M – 3.6M: PKR 210,000 + 25% on excess of 2.4M',
        netSalary: 191023,
        status: 'finalized',
        generatedAt: '2026-09-30',
      },
      {
        id: 'ps-2',
        payrollRunId: 'pr-2026-09',
        employeeId: 'emp-2',
        employeeCode: 'EMP-0102',
        employeeName: 'Michael Chang',
        email: 'hr@saylani.org',
        departmentName: 'Human Resources',
        designationTitle: 'HR Director',
        joiningDate: '2024-03-01',
        month: 9,
        year: 2026,
        basicSalary: 180000,
        hra: 72000,
        medicalAllowance: 18000,
        grossSalary: 270000,
        workingDaysInMonth: 22,
        presentDays: 22,
        halfDays: 0,
        absentDays: 0,
        unpaidLeaveDays: 0,
        effectiveWorkingDays: 22,
        dailyRate: 12273,
        halfDayDeduction: 0,
        absentDeduction: 0,
        unpaidLeaveDeduction: 0,
        totalLossOfPayDeductions: 0,
        projectedAnnualGross: 3240000,
        calculatedAnnualTax: 420000,
        monthlyTaxDeduction: 35000,
        taxSlabDescription: 'PKR 2.4M – 3.6M: PKR 210,000 + 25% on excess of 2.4M',
        netSalary: 235000,
        status: 'finalized',
        generatedAt: '2026-09-30',
      },
    ];
    return getStorage('payslips', defaultPayslips);
  },
  generatePayrollDraft(month: number, year: number): { run: MonthlyPayrollRun; payslips: Payslip[] } {
    const employees = this.getEmployees();
    const holidays = this.getHolidays();
    const workingDays = getWorkingDaysInMonth(year, month, holidays);

    let totalGross = 0;
    let totalDeductions = 0;
    let totalTax = 0;
    let totalNet = 0;

    const runId = `pr-${year}-${String(month).padStart(2, '0')}`;
    const newPayslips: Payslip[] = [];

    employees.forEach(emp => {
      const { hra, medicalAllowance, grossSalary } = calculateSalaryComponents(emp.basicSalary);
      const dailyRate = Math.round((grossSalary / workingDays) * 100) / 100;

      // Sample present/absent data
      const presentDays = Math.max(18, workingDays - 1);
      const absentDays = workingDays - presentDays;
      const halfDays = 0;
      const unpaidLeaveDays = 0;

      const absentDeduction = Math.round(absentDays * dailyRate);
      const halfDayDeduction = 0;
      const unpaidLeaveDeduction = 0;
      const totalLossOfPayDeductions = absentDeduction + halfDayDeduction + unpaidLeaveDeduction;

      const annualGross = grossSalary * 12;
      const { annualTax, monthlyTax, slabDescription } = calculatePakistanAnnualTax(annualGross);

      const netSalary = Math.max(0, grossSalary - totalLossOfPayDeductions - monthlyTax);

      const payslip: Payslip = {
        id: `ps-${runId}-${emp.id}`,
        payrollRunId: runId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        email: emp.email,
        departmentName: emp.departmentName,
        designationTitle: emp.designationTitle,
        joiningDate: emp.joiningDate,
        month,
        year,
        basicSalary: emp.basicSalary,
        hra,
        medicalAllowance,
        grossSalary,
        workingDaysInMonth: workingDays,
        presentDays,
        halfDays,
        absentDays,
        unpaidLeaveDays,
        effectiveWorkingDays: presentDays,
        dailyRate,
        halfDayDeduction,
        absentDeduction,
        unpaidLeaveDeduction,
        totalLossOfPayDeductions,
        projectedAnnualGross: annualGross,
        calculatedAnnualTax: annualTax,
        monthlyTaxDeduction: monthlyTax,
        taxSlabDescription: slabDescription,
        netSalary,
        status: 'draft',
        generatedAt: new Date().toISOString().split('T')[0],
      };

      newPayslips.push(payslip);
      totalGross += grossSalary;
      totalDeductions += totalLossOfPayDeductions;
      totalTax += monthlyTax;
      totalNet += netSalary;
    });

    const run: MonthlyPayrollRun = {
      id: runId,
      month,
      year,
      status: 'draft',
      totalGross,
      totalDeductions,
      totalTax,
      totalNet,
      employeeCount: employees.length,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Update stores
    const runs = this.getPayrollRuns().filter(r => r.id !== runId);
    runs.unshift(run);
    setStorage('payrollRuns', runs);

    const existingSlips = this.getPayslips().filter(p => p.payrollRunId !== runId);
    const combinedSlips = [...existingSlips, ...newPayslips];
    setStorage('payslips', combinedSlips);

    return { run, payslips: newPayslips };
  },
  finalizePayrollRun(runId: string, adminName: string): MonthlyPayrollRun | null {
    const runs = this.getPayrollRuns();
    const index = runs.findIndex(r => r.id === runId);
    if (index === -1) return null;

    runs[index] = {
      ...runs[index],
      status: 'finalized',
      finalizedBy: adminName,
      finalizedAt: new Date().toISOString().split('T')[0],
    };
    setStorage('payrollRuns', runs);

    // Update all payslips for this run
    const slips = this.getPayslips().map(p => {
      if (p.payrollRunId === runId) {
        return { ...p, status: 'finalized' as const };
      }
      return p;
    });
    setStorage('payslips', slips);

    return runs[index];
  },

  // Announcements & Notifications
  getAnnouncements(): Announcement[] {
    const defaultAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        title: 'Saylani Hackathon 2026 Kickoff',
        content: 'Welcome all team members to the grand Saylani Hackathon on 24 October 2026. Please ensure all project milestones and HCM Lite deliverables are on schedule.',
        targetRole: 'all',
        priority: 'high',
        authorName: 'Sarah Jenkins',
        authorRole: 'Admin',
        createdAt: '2026-10-24',
      },
      {
        id: 'ann-2',
        title: 'New Biometric & Geofenced Attendance Policy',
        content: 'Employees are reminded to check in within the 250m office radius. 15-minute grace period applies until 09:15 AM. Work under 5 hours will be recorded as half-day.',
        targetRole: 'employee',
        priority: 'normal',
        authorName: 'Michael Chang',
        authorRole: 'HR Director',
        createdAt: '2026-10-20',
      },
    ];
    return getStorage('announcements', defaultAnnouncements);
  },
  addAnnouncement(ann: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.unshift(newAnn);
    setStorage('announcements', list);
    return newAnn;
  },

  getNotifications(role: string, employeeId?: string): Notification[] {
    const defaultNotifications: Notification[] = [
      {
        id: 'notif-1',
        title: 'Payroll Finalized',
        message: 'September 2026 monthly payroll has been finalized by Admin.',
        type: 'success',
        isRead: false,
        createdAt: '2026-10-01',
        link: '/payroll',
      },
      {
        id: 'notif-2',
        title: 'Leave Approved',
        message: 'Your 2-day Sick Leave request for October 12-13 has been approved.',
        type: 'info',
        isRead: true,
        createdAt: '2026-10-12',
        link: '/leaves',
      },
    ];
    return getStorage('notifications', defaultNotifications);
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    const defaultAudits: AuditLogEntry[] = [
      {
        id: 'audit-1',
        actorId: 'emp-1',
        actorName: 'Sarah Jenkins',
        actorRole: 'admin',
        action: 'FINALIZE_PAYROLL',
        entity: 'PayrollRun',
        entityId: 'pr-2026-09',
        details: 'Finalized monthly payroll for September 2026 (PKR 998,750 net disbursed)',
        timestamp: '2026-09-30 17:45:00',
      },
      {
        id: 'audit-2',
        actorId: 'emp-2',
        actorName: 'Michael Chang',
        actorRole: 'hr',
        action: 'APPROVE_LEAVE',
        entity: 'LeaveRequest',
        entityId: 'lr-2',
        details: 'Approved 2-day Sick Leave request for Fatima Noor',
        timestamp: '2026-10-12 10:15:30',
      },
      {
        id: 'audit-3',
        actorId: 'emp-1',
        actorName: 'Sarah Jenkins',
        actorRole: 'admin',
        action: 'UPDATE_COMPANY_SETTINGS',
        entity: 'CompanySettings',
        entityId: 'settings-1',
        details: 'Updated office start time to 09:00 AM with 15m grace window and 250m geofence radius',
        timestamp: '2026-10-15 14:00:10',
      },
    ];
    return getStorage('auditLogs', defaultAudits);
  },
  recordAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
    };
    list.unshift(newEntry);
    setStorage('auditLogs', list);
  },
};

export default apiClient;
