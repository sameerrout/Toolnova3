/**
 * Toolino EMI Calculator Engine
 * 100% Client-Side In-Browser Accurate Loan & Amortization Computations
 */

export type LoanType = 'home' | 'car' | 'personal' | 'education' | 'custom';
export type TenureUnit = 'years' | 'months';

export interface LoanPreset {
  id: LoanType;
  label: string;
  defaultAmount: number;
  defaultRate: number;
  defaultTenureYears: number;
  minAmount: number;
  maxAmount: number;
  minRate: number;
  maxRate: number;
  maxTenureYears: number;
  description: string;
  iconName: string;
}

export const LOAN_PRESETS: Record<LoanType, LoanPreset> = {
  home: {
    id: 'home',
    label: 'Home Loan',
    defaultAmount: 3000000,
    defaultRate: 8.5,
    defaultTenureYears: 20,
    minAmount: 100000,
    maxAmount: 100000000,
    minRate: 0.1,
    maxRate: 20,
    maxTenureYears: 30,
    description: 'Long-term residential and commercial property mortgages with competitive interest rates.',
    iconName: 'Home',
  },
  car: {
    id: 'car',
    label: 'Car Loan',
    defaultAmount: 800000,
    defaultRate: 9.0,
    defaultTenureYears: 5,
    minAmount: 50000,
    maxAmount: 10000000,
    minRate: 0.1,
    maxRate: 25,
    maxTenureYears: 8,
    description: 'Vehicle financing for new or pre-owned automobiles, SUVs, and two-wheelers.',
    iconName: 'Car',
  },
  personal: {
    id: 'personal',
    label: 'Personal Loan',
    defaultAmount: 400000,
    defaultRate: 12.5,
    defaultTenureYears: 3,
    minAmount: 10000,
    maxAmount: 5000000,
    minRate: 0.1,
    maxRate: 36,
    maxTenureYears: 7,
    description: 'Unsecured financing for medical emergencies, travel, home renovation, or debt consolidation.',
    iconName: 'User',
  },
  education: {
    id: 'education',
    label: 'Education Loan',
    defaultAmount: 1500000,
    defaultRate: 9.5,
    defaultTenureYears: 7,
    minAmount: 50000,
    maxAmount: 15000000,
    minRate: 0.1,
    maxRate: 20,
    maxTenureYears: 15,
    description: 'Specialized loans covering tuition fees, university living expenses, and overseas degrees.',
    iconName: 'GraduationCap',
  },
  custom: {
    id: 'custom',
    label: 'Other / Custom Loan',
    defaultAmount: 1000000,
    defaultRate: 10.0,
    defaultTenureYears: 5,
    minAmount: 1000,
    maxAmount: 500000000,
    minRate: 0,
    maxRate: 50,
    maxTenureYears: 40,
    description: 'Flexible parameters for business loans, gold loans, machinery, or custom credit schedules.',
    iconName: 'Coins',
  },
};

export interface MonthlyAmortizationItem {
  month: number;
  year: number;
  monthInYear: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface YearlyAmortizationItem {
  year: number;
  openingBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  closingBalance: number;
  monthlyBreakdown: MonthlyAmortizationItem[];
}

export interface EmiCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalPayment: number;
  principalPercentage: number;
  interestPercentage: number;
  totalMonths: number;
  monthlySchedule: MonthlyAmortizationItem[];
  yearlySchedule: YearlyAmortizationItem[];
}

export interface EmiCalculationParams {
  principal: number;
  annualRate: number;
  tenure: number;
  tenureUnit: TenureUnit;
}

/**
 * Safely parses and sanitizes numerical inputs
 */
function sanitizeNumber(val: number, fallback = 0): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return val;
}

/**
 * Calculates reducing-balance EMI and complete repayment amortization schedules.
 *
 * Formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * Where:
 * P = Principal
 * r = Monthly interest rate (annualRate / 12 / 100)
 * n = Total months
 *
 * Handles:
 * - 0% interest rate (EMI = P / n, total interest = 0)
 * - Decimal interest rates
 * - Very large loan amounts safely
 * - Zero or boundary tenure safely
 */
export function calculateEmi(params: EmiCalculationParams): EmiCalculationResult {
  const principal = Math.max(0, sanitizeNumber(params.principal, 0));
  const annualRate = Math.max(0, sanitizeNumber(params.annualRate, 0));
  const rawTenure = Math.max(0, sanitizeNumber(params.tenure, 0));

  const totalMonths = Math.max(
    1,
    Math.round(params.tenureUnit === 'years' ? rawTenure * 12 : rawTenure)
  );

  // If principal is 0, return zeroed safe result
  if (principal === 0) {
    return {
      monthlyEmi: 0,
      principalAmount: 0,
      totalInterest: 0,
      totalPayment: 0,
      principalPercentage: 100,
      interestPercentage: 0,
      totalMonths,
      monthlySchedule: [],
      yearlySchedule: [],
    };
  }

  let monthlyEmi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  // Handle 0% interest loan
  if (annualRate === 0) {
    monthlyEmi = principal / totalMonths;
    totalPayment = principal;
    totalInterest = 0;
  } else {
    const monthlyRate = annualRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, totalMonths);

    if (factor === 1 || !isFinite(factor)) {
      monthlyEmi = principal / totalMonths;
    } else {
      monthlyEmi = (principal * monthlyRate * factor) / (factor - 1);
    }

    if (!isFinite(monthlyEmi) || isNaN(monthlyEmi)) {
      monthlyEmi = principal / totalMonths;
    }

    totalPayment = monthlyEmi * totalMonths;
    totalInterest = Math.max(0, totalPayment - principal);
  }

  // Generate monthly amortization schedule
  const monthlySchedule: MonthlyAmortizationItem[] = [];
  let currentBalance = principal;
  const monthlyRate = annualRate / 12 / 100;

  for (let m = 1; m <= totalMonths; m++) {
    const year = Math.ceil(m / 12);
    const monthInYear = ((m - 1) % 12) + 1;
    const openingBalance = currentBalance;

    let interestPaid = annualRate === 0 ? 0 : openingBalance * monthlyRate;
    let principalPaid = monthlyEmi - interestPaid;

    // Handle last month adjustment for floating point precision
    if (m === totalMonths || principalPaid > currentBalance) {
      principalPaid = currentBalance;
      currentBalance = 0;
    } else {
      currentBalance = Math.max(0, currentBalance - principalPaid);
    }

    const actualEmi = principalPaid + interestPaid;

    monthlySchedule.push({
      month: m,
      year,
      monthInYear,
      openingBalance: roundToTwo(openingBalance),
      emi: roundToTwo(actualEmi),
      principalPaid: roundToTwo(principalPaid),
      interestPaid: roundToTwo(interestPaid),
      closingBalance: roundToTwo(currentBalance),
    });
  }

  // Aggregate into yearly schedule
  const yearlySchedule: YearlyAmortizationItem[] = [];
  const totalYears = Math.ceil(totalMonths / 12);

  for (let y = 1; y <= totalYears; y++) {
    const yearMonths = monthlySchedule.filter((item) => item.year === y);
    if (yearMonths.length === 0) continue;

    const openingBalance = yearMonths[0].openingBalance;
    const closingBalance = yearMonths[yearMonths.length - 1].closingBalance;
    const principalPaid = yearMonths.reduce((sum, item) => sum + item.principalPaid, 0);
    const interestPaid = yearMonths.reduce((sum, item) => sum + item.interestPaid, 0);
    const yearTotalPayment = principalPaid + interestPaid;

    yearlySchedule.push({
      year: y,
      openingBalance: roundToTwo(openingBalance),
      principalPaid: roundToTwo(principalPaid),
      interestPaid: roundToTwo(interestPaid),
      totalPayment: roundToTwo(yearTotalPayment),
      closingBalance: roundToTwo(closingBalance),
      monthlyBreakdown: yearMonths,
    });
  }

  const computedTotalInterest = monthlySchedule.reduce((sum, item) => sum + item.interestPaid, 0);
  const computedTotalPayment = principal + computedTotalInterest;

  const principalPercentage =
    computedTotalPayment > 0 ? (principal / computedTotalPayment) * 100 : 100;
  const interestPercentage =
    computedTotalPayment > 0 ? (computedTotalInterest / computedTotalPayment) * 100 : 0;

  return {
    monthlyEmi: roundToTwo(monthlyEmi),
    principalAmount: roundToTwo(principal),
    totalInterest: roundToTwo(computedTotalInterest),
    totalPayment: roundToTwo(computedTotalPayment),
    principalPercentage: roundToTwo(principalPercentage),
    interestPercentage: roundToTwo(interestPercentage),
    totalMonths,
    monthlySchedule,
    yearlySchedule,
  };
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency amount with Indian numbering format (e.g. ₹10,00,000) or standard international
 */
export function formatCurrency(amount: number, currencySymbol = '₹'): string {
  if (isNaN(amount) || !isFinite(amount)) return `${currencySymbol}0`;
  const absAmount = Math.abs(amount);
  const rounded = Math.round(absAmount);

  // Indian currency numbering regex format
  const str = rounded.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol}${formatted}`;
}
