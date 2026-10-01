/**
 * Toolino GST Calculator Engine
 * 100% Client-Side In-Browser Computation of Indian Goods & Services Tax (GST)
 * Supports Exclusive (Add GST) and Inclusive (Remove GST) with Intra-State (CGST + SGST) and Inter-State (IGST)
 */

export type GstCalculationMode = 'addGst' | 'removeGst';
export type GstTransactionType = 'intraState' | 'interState';

export interface GstRatePreset {
  rate: number;
  label: string;
  categoryDesc: string;
}

export const CONFIGURABLE_GST_RATES: GstRatePreset[] = [
  { rate: 0, label: '0%', categoryDesc: 'Exempted & unbranded fresh foodstuffs, grains, salt' },
  { rate: 3, label: '3%', categoryDesc: 'Gold, silver, diamonds, precious jewellery' },
  { rate: 5, label: '5%', categoryDesc: 'Household essentials, sugar, tea, edible oil, economy flights' },
  { rate: 12, label: '12%', categoryDesc: 'Processed food, computers, business class air travel' },
  { rate: 18, label: '18%', categoryDesc: 'Standard rate: IT services, electronics, restaurants, telecom' },
  { rate: 28, label: '28%', categoryDesc: 'Luxury cars, aerated beverages, tobacco, high-end electronics' },
];

export interface GstCalculationParams {
  amount: number;
  rate: number;
  mode: GstCalculationMode;
  transactionType: GstTransactionType;
}

export interface GstCalculationResult {
  mode: GstCalculationMode;
  transactionType: GstTransactionType;
  inputAmount: number;
  baseAmount: number;
  gstRate: number;
  totalGstAmount: number;
  totalAmount: number;
  // Breakdown
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  basePercentage: number;
  taxPercentage: number;
}

function sanitizeNumber(val: number, fallback = 0): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return val;
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates GST for intra-state (CGST + SGST) or inter-state (IGST).
 *
 * Formulas:
 * 1. Add GST (Exclusive):
 *    Base Amount = Input
 *    GST Amount = Base Amount × (Rate / 100)
 *    Total Amount = Base Amount + GST Amount
 *
 * 2. Remove GST (Inclusive):
 *    Total Amount = Input
 *    Base Amount = Total Amount / (1 + Rate / 100)
 *    GST Amount = Total Amount - Base Amount
 *
 * Intra-State splits GST 50/50 into CGST and SGST.
 * Inter-State assigns 100% of GST to IGST.
 */
export function calculateGst(params: GstCalculationParams): GstCalculationResult {
  const safeAmount = Math.max(0, sanitizeNumber(params.amount, 0));
  const safeRate = Math.max(0, sanitizeNumber(params.rate, 0));
  const mode = params.mode;
  const transactionType = params.transactionType;

  let baseAmount = 0;
  let totalGstAmount = 0;
  let totalAmount = 0;

  if (safeAmount === 0 || safeRate === 0) {
    if (safeRate === 0) {
      baseAmount = safeAmount;
      totalGstAmount = 0;
      totalAmount = safeAmount;
    } else {
      baseAmount = 0;
      totalGstAmount = 0;
      totalAmount = 0;
    }
  } else if (mode === 'addGst') {
    // Exclusive mode: Amount is Base price
    baseAmount = safeAmount;
    totalGstAmount = (baseAmount * safeRate) / 100;
    totalAmount = baseAmount + totalGstAmount;
  } else {
    // Inclusive mode: Amount is Total price including GST
    totalAmount = safeAmount;
    baseAmount = totalAmount / (1 + safeRate / 100);
    totalGstAmount = totalAmount - baseAmount;
  }

  // Splitting based on Transaction Type
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (transactionType === 'intraState') {
    cgstRate = safeRate / 2;
    sgstRate = safeRate / 2;
    cgstAmount = totalGstAmount / 2;
    sgstAmount = totalGstAmount / 2;
  } else {
    igstRate = safeRate;
    igstAmount = totalGstAmount;
  }

  const basePercentage = totalAmount > 0 ? (baseAmount / totalAmount) * 100 : 100;
  const taxPercentage = totalAmount > 0 ? (totalGstAmount / totalAmount) * 100 : 0;

  return {
    mode,
    transactionType,
    inputAmount: roundToTwo(safeAmount),
    baseAmount: roundToTwo(baseAmount),
    gstRate: roundToTwo(safeRate),
    totalGstAmount: roundToTwo(totalGstAmount),
    totalAmount: roundToTwo(totalAmount),
    cgstRate: roundToTwo(cgstRate),
    cgstAmount: roundToTwo(cgstAmount),
    sgstRate: roundToTwo(sgstRate),
    sgstAmount: roundToTwo(sgstAmount),
    igstRate: roundToTwo(igstRate),
    igstAmount: roundToTwo(igstAmount),
    basePercentage: roundToTwo(basePercentage),
    taxPercentage: roundToTwo(taxPercentage),
  };
}

/**
 * Currency formatter with Indian numbering system (₹10,000, ₹11,800)
 */
export function formatGstCurrency(amount: number, symbol = '₹'): string {
  if (isNaN(amount) || !isFinite(amount)) return `${symbol}0`;
  const abs = Math.abs(amount);
  const rounded = Math.round(abs * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1] === '00' ? '' : `.${parts[1]}`;

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}${decPart}`;
}
