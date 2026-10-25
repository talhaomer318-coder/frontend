export type UserRole = 'admin' | 'hr' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  avatar?: string;
  mustChangePassword?: boolean;
}

export interface CompanySettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  officeStartTime: string; // e.g. "09:00"
  officeEndTime: string;   // e.g. "18:00"
  gracePeriodMinutes: number; // default 15 mins (late after 9:15)
  weekendDays: string[]; // ["Saturday", "Sunday"]
  officeLatitude: number;
  officeLongitude: number;
  attendanceRadiusMeters: number; // e.g. 200m
  rules: {
    halfDayHoursThreshold: number; // default 5 hours
    fullDayHoursThreshold: number; // default 8 hours
    autoMarkAbsentAfterDays: number;
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName?: string;
  description?: string;
  createdAt: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  level: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: 'ANNUAL' | 'SICK' | 'CASUAL' | 'UNPAID';
  quotaDays: number; // -1 for unlimited (unpaid)
  isPaid: boolean;
  color: string;
  description: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'national' | 'religious' | 'company';
  description?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  joiningDate: string; // YYYY-MM-DD
  status: 'active' | 'inactive' | 'probation' | 'terminated';
  gender: 'male' | 'female' | 'other';
  // Salary structure
  basicSalary: number; // PKR
  hra: number; // 40% of basic
  medicalAllowance: number; // 10% of basic
  grossSalary: number; // 1.5 * basic
  bankAccount: {
    bankName: string;
    accountNumber: string;
    iban: string;
  };
  role: UserRole;
  avatar?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export type AttendanceStatus = 'present' | 'late' | 'half-day' | 'absent' | 'missing-checkout';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:mm:ss
  checkOut?: string; // HH:mm:ss
  workMinutes?: number;
  status: AttendanceStatus;
  checkInCoordinates?: {
    latitude: number;
    longitude: number;
    distanceMeters: number;
    isWithinRadius: boolean;
  };
  faceVerified?: boolean;
  notes?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: 'ANNUAL' | 'SICK' | 'CASUAL' | 'UNPAID';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface EmployeeLeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: 'ANNUAL' | 'SICK' | 'CASUAL' | 'UNPAID';
  quota: number; // -1 for unlimited
  used: number;
  pending: number;
  remaining: number;
}

export interface MonthlyPayrollRun {
  id: string;
  month: number; // 1-12
  year: number;  // e.g. 2026
  status: 'draft' | 'finalized';
  finalizedBy?: string;
  finalizedAt?: string;
  totalGross: number;
  totalDeductions: number;
  totalTax: number;
  totalNet: number;
  employeeCount: number;
  createdAt: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  departmentName: string;
  designationTitle: string;
  joiningDate: string;
  month: number;
  year: number;
  // Earnings
  basicSalary: number;
  hra: number; // 40%
  medicalAllowance: number; // 10%
  grossSalary: number; // 1.5 * basic
  // Working days & attendance
  workingDaysInMonth: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  unpaidLeaveDays: number;
  effectiveWorkingDays: number;
  // Deductions
  dailyRate: number; // Gross / workingDaysInMonth
  halfDayDeduction: number; // 0.5 * dailyRate * halfDays
  absentDeduction: number; // dailyRate * absentDays
  unpaidLeaveDeduction: number; // dailyRate * unpaidLeaveDays
  totalLossOfPayDeductions: number;
  // Tax calculation (Pakistan annual tax slabs)
  projectedAnnualGross: number;
  calculatedAnnualTax: number;
  monthlyTaxDeduction: number;
  taxSlabDescription: string;
  // Final Net
  netSalary: number;
  status: 'draft' | 'finalized';
  generatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'admin' | 'hr' | 'employee';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string; // target user, or empty for all in role
  targetRole?: UserRole | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string; // e.g. "CREATE_EMPLOYEE", "APPROVE_LEAVE", "FINALIZE_PAYROLL"
  entity: string; // e.g. "Employee", "LeaveRequest", "PayrollRun"
  entityId: string;
  details: string;
  timestamp: string;
  beforeJson?: Record<string, any>;
  afterJson?: Record<string, any>;
}

export interface AILogEntry {
  id: string;
  userId: string;
  userRole: UserRole;
  prompt: string;
  response: string;
  toolsUsed: string[];
  timestamp: string;
}
