import React, { useState } from 'react';
import {
  Receipt,
  DollarSign,
  Lock,
  Unlock,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { LocalStore } from '../../services/api';
import { MonthlyPayrollRun, Payslip } from '../../types';
import { formatPKR } from '../../utils/calculations';

export const PayrollModule: React.FC = () => {
  const { currentEmployee, role } = useAuth();
  const [payrollRuns, setPayrollRuns] = useState<MonthlyPayrollRun[]>(() => LocalStore.getPayrollRuns());
  const [payslips, setPayslips] = useState<Payslip[]>(() => LocalStore.getPayslips());
  const [selectedRunId, setSelectedRunId] = useState<string>(() => payrollRuns[0]?.id || '');
  const [previewPayslip, setPreviewPayslip] = useState<Payslip | null>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedRun = payrollRuns.find(r => r.id === selectedRunId) || payrollRuns[0];

  // Filter payslips based on user role:
  // If role is employee, they only see their own payslips
  const displayedPayslips = role === 'employee'
    ? payslips.filter(p => p.employeeId === currentEmployee?.id)
    : payslips.filter(p => p.payrollRunId === selectedRun?.id);

  // HR: Generate Draft for a new month
  const handleGenerateDraft = (month: number, year: number) => {
    const { run, payslips: newSlips } = LocalStore.generatePayrollDraft(month, year);
    setPayrollRuns(LocalStore.getPayrollRuns());
    setPayslips(LocalStore.getPayslips());
    setSelectedRunId(run.id);
    setActionNotice({
      text: `Draft payroll generated for ${month}/${year} with ${run.employeeCount} active staff!`,
      type: 'success',
    });
  };

  // Admin: Finalize and lock payroll
  const handleFinalize = () => {
    if (role !== 'admin') {
      setActionNotice({ text: 'Forbidden: Only Admin can finalize payroll.', type: 'error' });
      return;
    }

    if (!selectedRun) return;
    const res = LocalStore.finalizePayrollRun(selectedRun.id, 'Sarah Jenkins');
    if (res) {
      LocalStore.recordAudit({
        actorId: 'admin',
        actorName: 'Sarah Jenkins',
        actorRole: 'admin',
        action: 'FINALIZE_PAYROLL',
        entity: 'PayrollRun',
        entityId: selectedRun.id,
        details: `Finalized monthly payroll for ${selectedRun.month}/${selectedRun.year}. Disbursement total: PKR ${selectedRun.totalNet.toLocaleString()}`,
      });

      setPayrollRuns(LocalStore.getPayrollRuns());
      setPayslips(LocalStore.getPayslips());
      setActionNotice({
        text: `Payroll for ${selectedRun.month}/${selectedRun.year} has been finalized and locked! Payslips are now visible to employees.`,
        type: 'success',
      });
    }
  };

  // Download PDF Payslip using jsPDF
  const handleDownloadPDF = (slip: Payslip) => {
    const doc = new jsPDF();

    // Header Branding
    doc.setFillColor(30, 27, 75); // #1e1b4b
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SAYLANI HCM ENTERPRISE', 105, 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`CONFIDENTIAL MONTHLY PAYSLIP — ${slip.month}/${slip.year}`, 105, 25, { align: 'center' });

    // Meta details
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.text(`Employee Code: ${slip.employeeCode}`, 15, 45);
    doc.text(`Employee Name: ${slip.employeeName}`, 15, 52);
    doc.text(`Department: ${slip.departmentName}`, 15, 59);
    doc.text(`Designation: ${slip.designationTitle}`, 15, 66);

    doc.text(`Pay Period: ${slip.month}/${slip.year}`, 130, 45);
    doc.text(`Status: ${slip.status.toUpperCase()}`, 130, 52);
    doc.text(`Working Days: ${slip.workingDaysInMonth}`, 130, 59);
    doc.text(`Effective Present: ${slip.presentDays} days`, 130, 66);

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 72, 195, 72);

    // Earnings Table
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 78, 85, 8, 'F');
    doc.rect(110, 78, 85, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS BREAKDOWN', 18, 83);
    doc.text('DEDUCTIONS & TAX', 113, 83);

    doc.setFont('helvetica', 'normal');
    let y = 94;

    // Items
    doc.text('Basic Salary', 18, y);
    doc.text(`PKR ${slip.basicSalary.toLocaleString()}`, 95, y, { align: 'right' });
    doc.text('Half-Day Deductions', 113, y);
    doc.text(`PKR ${slip.halfDayDeduction.toLocaleString()}`, 190, y, { align: 'right' });

    y += 8;
    doc.text('HRA (40% of Basic)', 18, y);
    doc.text(`PKR ${slip.hra.toLocaleString()}`, 95, y, { align: 'right' });
    doc.text('Absenteeism Deductions', 113, y);
    doc.text(`PKR ${slip.absentDeduction.toLocaleString()}`, 190, y, { align: 'right' });

    y += 8;
    doc.text('Medical Allowance (10%)', 18, y);
    doc.text(`PKR ${slip.medicalAllowance.toLocaleString()}`, 95, y, { align: 'right' });
    doc.text('Unpaid Leave Deductions', 113, y);
    doc.text(`PKR ${slip.unpaidLeaveDeduction.toLocaleString()}`, 190, y, { align: 'right' });

    y += 8;
    doc.text('Gross Earnings (1.5x)', 18, y);
    doc.text(`PKR ${slip.grossSalary.toLocaleString()}`, 95, y, { align: 'right' });
    doc.text('Monthly Income Tax', 113, y);
    doc.text(`PKR ${slip.monthlyTaxDeduction.toLocaleString()}`, 190, y, { align: 'right' });

    y += 12;
    doc.line(15, y, 195, y);
    y += 8;

    // Totals Box
    doc.setFillColor(238, 242, 255);
    doc.rect(15, y, 180, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(49, 46, 129);
    doc.text('NET SALARY PAYABLE:', 20, y + 13);
    doc.text(`PKR ${slip.netSalary.toLocaleString()}`, 190, y + 13, { align: 'right' });

    y += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tax Slab Calculation Note: ${slip.taxSlabDescription}`, 15, y);
    doc.text('Saylani HCM System Generated Payslip — Verified by Admin & immutable under HR compliance.', 15, y + 6);

    doc.save(`Payslip_${slip.employeeCode}_${slip.month}_${slip.year}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Payroll Processing & Payslips</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic calculation of HRA (40%), Medical (10%), Pakistan Tax Slabs, and attendance deductions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {role !== 'employee' && (
            <>
              <button
                onClick={() => handleGenerateDraft(10, 2026)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Oct 2026 Draft</span>
              </button>

              {role === 'admin' && selectedRun?.status === 'draft' && (
                <button
                  onClick={handleFinalize}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Finalize & Lock Payroll</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            actionNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400">×</button>
        </div>
      )}

      {/* Monthly Runs Selector & KPI summary (for Admin/HR) */}
      {role !== 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Select Pay Period</span>
            <select
              value={selectedRunId}
              onChange={e => setSelectedRunId(e.target.value)}
              className="w-full mt-1 font-bold text-sm text-slate-800 border-none p-0 focus:ring-0 bg-transparent"
            >
              {payrollRuns.map(run => (
                <option key={run.id} value={run.id}>
                  {run.month}/{run.year} ({run.status.toUpperCase()})
                </option>
              ))}
            </select>
            <div className="text-[10px] text-slate-400 mt-1">
              Finalized by: {selectedRun?.finalizedBy || 'Pending Admin Finalization'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Gross Earnings</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {formatPKR(selectedRun?.totalGross || 0)}
            </div>
            <span className="text-[10px] text-slate-500">1.5x Basic across all staff</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tax & Deductions</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">
              {formatPKR((selectedRun?.totalTax || 0) + (selectedRun?.totalDeductions || 0))}
            </div>
            <span className="text-[10px] text-slate-500">Annual Tax Slabs + Loss of Pay</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Net Disbursed Amount</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {formatPKR(selectedRun?.totalNet || 0)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1 mt-0.5">
              <Lock className="w-3 h-3" />
              <span>{selectedRun?.status === 'finalized' ? 'Locked & Immutable' : 'Draft Mode'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900">
              {role === 'employee' ? 'My Authorized Payslips' : `Payroll Run Breakdown (${selectedRun?.month}/${selectedRun?.year})`}
            </h2>
            {selectedRun?.status === 'finalized' && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Finalized</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{displayedPayslips.length} payslips available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Basic Salary</th>
                <th className="py-3 px-4">HRA (40%)</th>
                <th className="py-3 px-4">Gross (1.5x)</th>
                <th className="py-3 px-4">Loss of Pay</th>
                <th className="py-3 px-4">Income Tax</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPayslips.map(slip => (
                <tr key={slip.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{slip.employeeName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{slip.employeeCode} • {slip.departmentName}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{formatPKR(slip.basicSalary)}</td>
                  <td className="py-3 px-4 text-slate-600">{formatPKR(slip.hra)}</td>
                  <td className="py-3 px-4 font-bold text-indigo-700">{formatPKR(slip.grossSalary)}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">
                    {slip.totalLossOfPayDeductions > 0 ? `-${formatPKR(slip.totalLossOfPayDeductions)}` : 'PKR 0'}
                  </td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">
                    -{formatPKR(slip.monthlyTaxDeduction)}
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                    {formatPKR(slip.netSalary)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => setPreviewPayslip(slip)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Preview Payslip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(slip)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] border border-emerald-200 transition inline-flex items-center space-x-1"
                      title="Download Official PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pakistan Tax Slab Policy Reference Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Pakistan Annual Income Tax Slabs (Hackathon Spec)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-[11px] text-slate-300">
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-white">0 to 600,000</div>
            <div className="text-emerald-400 font-semibold mt-0.5">0% Tax Exempt</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-white">600k – 1.2M</div>
            <div className="text-slate-300 font-semibold mt-0.5">5% on excess of 600k</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-white">1.2M – 2.4M</div>
            <div className="text-slate-300 font-semibold mt-0.5">30k + 15% on excess</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-white">2.4M – 3.6M</div>
            <div className="text-slate-300 font-semibold mt-0.5">210k + 25% on excess</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-white">Above 3.6M</div>
            <div className="text-slate-300 font-semibold mt-0.5">510k + 35% on excess</div>
          </div>
        </div>
      </div>

      {/* Interactive Modal Preview of Payslip */}
      {previewPayslip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Payslip Preview: {previewPayslip.employeeName}</h3>
              <button onClick={() => setPreviewPayslip(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-3">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Month: {previewPayslip.month}/{previewPayslip.year}</span>
                <span className="text-emerald-700 uppercase">{previewPayslip.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Basic Salary: {formatPKR(previewPayslip.basicSalary)}</div>
                <div>HRA (40%): {formatPKR(previewPayslip.hra)}</div>
                <div>Medical (10%): {formatPKR(previewPayslip.medicalAllowance)}</div>
                <div className="font-bold text-indigo-700">Gross: {formatPKR(previewPayslip.grossSalary)}</div>
                <div>Monthly Tax: -{formatPKR(previewPayslip.monthlyTaxDeduction)}</div>
                <div>Loss of Pay: -{formatPKR(previewPayslip.totalLossOfPayDeductions)}</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-950 font-black text-sm rounded-lg flex justify-between">
                <span>NET PAYABLE:</span>
                <span>{formatPKR(previewPayslip.netSalary)}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                {previewPayslip.taxSlabDescription}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setPreviewPayslip(null)}
                className="px-4 py-1.5 text-slate-600 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPDF(previewPayslip)}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-sm flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
