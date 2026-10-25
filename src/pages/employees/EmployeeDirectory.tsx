import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  DollarSign,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { LocalStore } from '../../services/api';
import { Employee } from '../../types';
import { formatPKR, calculateSalaryComponents } from '../../utils/calculations';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => LocalStore.getEmployees());
  const departments = LocalStore.getDepartments();
  const designations = LocalStore.getDesignations();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected360Emp, setSelected360Emp] = useState<Employee | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importReport, setImportReport] = useState<{ valid: any[]; errors: any[] } | null>(null);

  // Add form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [desigId, setDesigId] = useState(designations[0]?.id || '');
  const [basicSalary, setBasicSalary] = useState(150000);
  const [tempPassword, setTempPassword] = useState('Welcome@2026');
  const [role, setRole] = useState<'employee' | 'hr'>('employee');

  // Filtered employees
  const filtered = employees.filter(emp => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'all' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Add Employee Handler
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const created = LocalStore.addEmployee({
      firstName,
      lastName,
      email,
      phone,
      departmentId: deptId || departments[0]?.id,
      designationId: desigId || designations[0]?.id,
      basicSalary: Number(basicSalary),
      role,
    });

    LocalStore.recordAudit({
      actorId: 'hr',
      actorName: 'Michael Chang',
      actorRole: 'hr',
      action: 'CREATE_EMPLOYEE',
      entity: 'Employee',
      entityId: created.id,
      details: `Registered employee ${created.fullName} (${created.employeeCode}) with initial basic salary PKR ${basicSalary.toLocaleString()}`,
    });

    setEmployees([...employees, created]);
    setShowAddModal(false);
    // Reset
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = 'Employee Code,Full Name,Email,Phone,Department,Designation,Status,Basic Salary,Gross Salary,Joining Date\n';
    const rows = employees.map(e =>
      `"${e.employeeCode}","${e.fullName}","${e.email}","${e.phone}","${e.departmentName}","${e.designationTitle}","${e.status}",${e.basicSalary},${e.grossSalary},"${e.joiningDate}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `saylani_hcm_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dry-run CSV validation simulation
  const handleDryRunCSV = () => {
    const mockValidation = {
      valid: [
        { row: 1, name: 'Usman Tariq', email: 'usman.tariq@saylani.org', dept: 'Engineering', basic: 140000 },
        { row: 2, name: 'Hira Siddiqui', email: 'hira.siddiqui@saylani.org', dept: 'Human Resources', basic: 125000 },
      ],
      errors: [
        { row: 3, name: 'Bilal Khan', email: 'admin@saylani.org', reason: 'Email already registered in system' },
        { row: 4, name: 'Missing Name', email: 'invalid-email-format', reason: 'Invalid email syntax & empty full name' },
      ],
    };
    setImportReport(mockValidation);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Employee Directory & Profiles</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage personnel, salary structures, 360-degree views, and bulk CSV operations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => { setShowImportModal(true); setImportReport(null); }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Employee</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium text-slate-700 bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employee Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">Gross (1.5x)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={emp.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{emp.employeeCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{emp.designationTitle}</div>
                    <div className="text-[11px] text-slate-500">{emp.departmentName}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{formatPKR(emp.basicSalary)}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{formatPKR(emp.grossSalary)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelected360Emp(emp)}
                      className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-xs transition inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>360 Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} employees
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-bold text-slate-700">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Bilal"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Tariq"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="bilal@saylani.org"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Department</label>
                  <select
                    value={deptId}
                    onChange={e => setDeptId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Designation</label>
                  <select
                    value={desigId}
                    onChange={e => setDesigId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {designations.map(des => (
                      <option key={des.id} value={des.id}>{des.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monthly Basic Salary (PKR)</label>
                <input
                  type="number"
                  value={basicSalary}
                  onChange={e => setBasicSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                  required
                />
                <div className="mt-1.5 p-2 bg-indigo-50 text-[11px] text-indigo-900 rounded-lg flex justify-between">
                  <span>HRA (40%): PKR {Math.round(basicSalary * 0.4).toLocaleString()}</span>
                  <span>Medical (10%): PKR {Math.round(basicSalary * 0.1).toLocaleString()}</span>
                  <span className="font-bold">Gross (1.5x): PKR {Math.round(basicSalary * 1.5).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono"
                    readOnly
                  />
                  <span className="text-[10px] text-slate-400">Must change on 1st login</span>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Portal Access Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'employee' | 'hr')}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Specialist</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm & Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee 360 Profile Drawer / Modal */}
      {selected360Emp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img
                  src={selected360Emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={selected360Emp.fullName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selected360Emp.fullName}</h3>
                  <p className="text-xs text-slate-500">{selected360Emp.designationTitle} • {selected360Emp.departmentName}</p>
                </div>
              </div>
              <button onClick={() => setSelected360Emp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Tabs / Sections */}
            <div className="space-y-4 text-xs">
              {/* Contact & Job Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Employee Code:</span>
                  <div className="font-bold text-slate-800">{selected360Emp.employeeCode}</div>
                </div>
                <div>
                  <span className="text-slate-400">Official Email:</span>
                  <div className="font-bold text-slate-800">{selected360Emp.email}</div>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <div className="font-bold text-slate-800">{selected360Emp.phone || '+92 300 0000000'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Joining Date:</span>
                  <div className="font-bold text-slate-800">{selected360Emp.joiningDate}</div>
                </div>
              </div>

              {/* Salary Structure Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>Salary Structure (Challenge Formulation)</span>
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400">Basic Salary</div>
                    <div className="font-bold text-slate-800 mt-0.5">{formatPKR(selected360Emp.basicSalary)}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400">HRA (40%)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{formatPKR(selected360Emp.hra)}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400">Medical (10%)</div>
                    <div className="font-bold text-slate-800 mt-0.5">{formatPKR(selected360Emp.medicalAllowance)}</div>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-[10px] text-indigo-600 font-semibold">Gross (1.5x)</div>
                    <div className="font-extrabold text-indigo-700 mt-0.5">{formatPKR(selected360Emp.grossSalary)}</div>
                  </div>
                </div>
              </div>

              {/* Bank Account */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex justify-between">
                <span>Disbursement Bank: <strong>{selected360Emp.bankAccount?.bankName || 'Meezan Bank'}</strong></span>
                <span>IBAN: <strong className="font-mono">{selected360Emp.bankAccount?.iban || 'PK00MEZN0011223344'}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelected360Emp(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import with Dry-Run Report Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Import Employee CSV with Dry-Run Report</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Upload a CSV file containing employee columns. The system performs a dry-run validation check before committing any rows to database.
            </p>

            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2 bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">employees_batch_2026.csv</div>
              <button
                type="button"
                onClick={handleDryRunCSV}
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Execute Dry-Run Validation
              </button>
            </div>

            {/* Validation Report */}
            {importReport && (
              <div className="space-y-3 text-xs animate-fadeIn">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-emerald-700">{importReport.valid.length} Valid Rows Ready</span>
                  <span className="text-rose-700">{importReport.errors.length} Errors Found</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {importReport.errors.map((err, i) => (
                    <div key={i} className="p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 text-[11px] flex items-start space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Row {err.row} ({err.name}):</strong> {err.reason}
                      </div>
                    </div>
                  ))}

                  {importReport.valid.map((v, i) => (
                    <div key={i} className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-[11px] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <div>Row {v.row}: {v.name} ({v.email}) • {v.dept}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg shadow-sm"
                  >
                    Commit Valid Rows Only
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
