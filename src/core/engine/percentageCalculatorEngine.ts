/**
 * Percentage Calculator Engine - Toolino
 * Comprehensive financial and mathematical percentage calculations with step-by-step formulas.
 */

export interface BasicPercentageResult {
  value: number;
  formula: string;
  steps: string[];
}

export interface PercentOfResult {
  percent: number;
  formula: string;
  steps: string[];
}

export interface PercentageChangeResult {
  changePercent: number;
  absoluteDifference: number;
  type: 'increase' | 'decrease' | 'no-change';
  formula: string;
  steps: string[];
}

export interface DiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  discountedPrice: number;
  taxPercent: number;
  taxAmount: number;
  finalPrice: number;
  totalSaved: number;
  formula: string;
}

export interface TipResult {
  billAmount: number;
  tipPercent: number;
  tipAmount: number;
  totalAmount: number;
  splitCount: number;
  tipPerPerson: number;
  totalPerPerson: number;
}

export interface MarginMarkupResult {
  cost: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
  markupPercent: number;
}

/**
 * 1. Calculates X% of Y (e.g., What is 15% of 200? -> 30)
 */
export function calculateXPercentOfY(x: number, y: number): BasicPercentageResult {
  const value = (x / 100) * y;
  return {
    value: Number(value.toFixed(4)),
    formula: `(${x} ÷ 100) × ${y} = ${value.toFixed(2)}`,
    steps: [
      `Convert percentage to decimal: ${x}% = ${x} ÷ 100 = ${(x / 100).toFixed(4)}`,
      `Multiply decimal by ${y}: ${(x / 100).toFixed(4)} × ${y} = ${value.toFixed(2)}`,
    ],
  };
}

/**
 * 2. Calculates what percent X is of Y (e.g., 25 is what percent of 100? -> 25%)
 */
export function calculateXIsWhatPercentOfY(x: number, y: number): PercentOfResult {
  if (y === 0) {
    throw new Error('Base value (Y) cannot be zero.');
  }
  const percent = (x / y) * 100;
  return {
    percent: Number(percent.toFixed(4)),
    formula: `(${x} ÷ ${y}) × 100 = ${percent.toFixed(2)}%`,
    steps: [
      `Divide ${x} by ${y}: ${x} ÷ ${y} = ${(x / y).toFixed(4)}`,
      `Multiply by 100 to get percentage: ${(x / y).toFixed(4)} × 100 = ${percent.toFixed(2)}%`,
    ],
  };
}

/**
 * 3. Calculates percentage increase or decrease from X to Y
 */
export function calculatePercentageChange(fromValue: number, toValue: number): PercentageChangeResult {
  if (fromValue === 0) {
    throw new Error('Initial value cannot be zero when calculating percentage change.');
  }
  const diff = toValue - fromValue;
  const changePercent = (diff / Math.abs(fromValue)) * 100;
  const type = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'no-change';

  return {
    changePercent: Number(changePercent.toFixed(4)),
    absoluteDifference: Number(Math.abs(diff).toFixed(4)),
    type,
    formula: `((${toValue} - ${fromValue}) ÷ |${fromValue}|) × 100 = ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
    steps: [
      `Calculate difference: ${toValue} - ${fromValue} = ${diff.toFixed(2)}`,
      `Divide difference by original value: ${diff.toFixed(2)} ÷ ${Math.abs(fromValue)} = ${(diff / Math.abs(fromValue)).toFixed(4)}`,
      `Multiply by 100: ${(diff / Math.abs(fromValue)).toFixed(4)} × 100 = ${changePercent.toFixed(2)}% (${type})`,
    ],
  };
}

/**
 * 4. Calculates discount and optional sales tax
 */
export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
  taxPercent = 0
): DiscountResult {
  const discountAmount = (discountPercent / 100) * originalPrice;
  const discountedPrice = Math.max(0, originalPrice - discountAmount);
  const taxAmount = (taxPercent / 100) * discountedPrice;
  const finalPrice = discountedPrice + taxAmount;
  const totalSaved = discountAmount;

  return {
    originalPrice: Number(originalPrice.toFixed(2)),
    discountPercent: Number(discountPercent.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    discountedPrice: Number(discountedPrice.toFixed(2)),
    taxPercent: Number(taxPercent.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
    totalSaved: Number(totalSaved.toFixed(2)),
    formula: `${originalPrice} - (${discountPercent}% = ${discountAmount.toFixed(2)}) + (${taxPercent}% tax = ${taxAmount.toFixed(2)}) = ${finalPrice.toFixed(2)}`,
  };
}

/**
 * 5. Calculates restaurant tip and per-person bill split
 */
export function calculateTip(
  billAmount: number,
  tipPercent: number,
  splitCount = 1
): TipResult {
  const validSplit = Math.max(1, Math.floor(splitCount));
  const tipAmount = (tipPercent / 100) * billAmount;
  const totalAmount = billAmount + tipAmount;
  const tipPerPerson = tipAmount / validSplit;
  const totalPerPerson = totalAmount / validSplit;

  return {
    billAmount: Number(billAmount.toFixed(2)),
    tipPercent: Number(tipPercent.toFixed(2)),
    tipAmount: Number(tipAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    splitCount: validSplit,
    tipPerPerson: Number(tipPerPerson.toFixed(2)),
    totalPerPerson: Number(totalPerPerson.toFixed(2)),
  };
}

/**
 * 6. Calculates Profit Margin and Markup
 */
export function calculateMarginMarkup(cost: number, sellingPrice: number): MarginMarkupResult {
  if (cost < 0 || sellingPrice < 0) {
    throw new Error('Cost and selling price must be non-negative values.');
  }
  const profit = sellingPrice - cost;
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const markupPercent = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    cost: Number(cost.toFixed(2)),
    sellingPrice: Number(sellingPrice.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(2)),
    markupPercent: Number(markupPercent.toFixed(2)),
  };
}
