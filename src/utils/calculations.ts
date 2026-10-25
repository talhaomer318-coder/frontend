import { Holiday } from '../types';

/**
 * Calculate Pakistan annual income tax based on specified slabs:
 * - 0 to 600,000: 0%
 * - >600,000 to 1,200,000: 5% of amount above 600,000
 * - >1,200,000 to 2,400,000: 30,000 + 15% of amount above 1,200,000
 * - >2,400,000 to 3,600,000: 210,000 + 25% of amount above 2,400,000
 * - >3,600,000: 510,000 + 35% of amount above 3,600,000
 */
export function calculatePakistanAnnualTax(annualGross: number): {
  annualTax: number;
  monthlyTax: number;
  slabDescription: string;
} {
  let annualTax = 0;
  let slabDescription = '0 - 600,000 (Exempt 0%)';

  if (annualGross <= 600000) {
    annualTax = 0;
    slabDescription = 'Up to PKR 600,000: Tax Exempt (0%)';
  } else if (annualGross <= 1200000) {
    annualTax = (annualGross - 600000) * 0.05;
    slabDescription = 'PKR 600,000 – 1,200,000: 5% of excess over 600k';
  } else if (annualGross <= 2400000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
    slabDescription = 'PKR 1,200,000 – 2,400,000: PKR 30k + 15% of excess over 1.2M';
  } else if (annualGross <= 3600000) {
    annualTax = 210000 + (annualGross - 2400000) * 0.25;
    slabDescription = 'PKR 2,400,000 – 3,600,000: PKR 210k + 25% of excess over 2.4M';
  } else {
    annualTax = 510000 + (annualGross - 3600000) * 0.35;
    slabDescription = 'Above PKR 3,600,000: PKR 510k + 35% of excess over 3.6M';
  }

  const monthlyTax = Math.round((annualTax / 12) * 100) / 100;
  return {
    annualTax: Math.round(annualTax * 100) / 100,
    monthlyTax,
    slabDescription,
  };
}

/**
 * Breakdown salary structure based on Challenge specifications:
 * - HRA = 40% of Basic
 * - Medical = 10% of Basic
 * - Gross = Basic + HRA + Medical = 1.5 * Basic
 */
export function calculateSalaryComponents(basicSalary: number) {
  const hra = Math.round(basicSalary * 0.4);
  const medicalAllowance = Math.round(basicSalary * 0.1);
  const grossSalary = basicSalary + hra + medicalAllowance; // exactly 1.5 * basic
  return { hra, medicalAllowance, grossSalary };
}

/**
 * Get count of working days in a given month excluding weekends (Sat/Sun) and configured public holidays
 */
export function getWorkingDaysInMonth(year: number, month: number, holidays: Holiday[] = []): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  const holidayDates = new Set(
    holidays.map(h => h.date)
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.has(dateStr);

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }
  }

  return workingDays;
}

/**
 * Calculate working days between two dates inclusive, excluding weekends and public holidays
 */
export function calculateLeaveWorkingDays(
  startDateStr: string,
  endDateStr: string,
  holidays: Holiday[] = []
): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) return 0;

  const holidayDates = new Set(holidays.map(h => h.date));
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.has(dateStr);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Haversine formula to calculate distance in meters between two GPS coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format currency in Pakistani Rupees (PKR)
 */
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}
