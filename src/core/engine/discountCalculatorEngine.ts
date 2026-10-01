/**
 * Toolino Discount Calculator Engine
 * 100% Client-Side In-Browser Calculation of Standard, Stacked, Reverse, and Two-Way Discounts
 */

export type DiscountMode = 'standard' | 'stacked' | 'findPercent' | 'reverse' | 'fixedOff';

export interface StandardDiscountParams {
  originalPrice: number;
  discountPercent: number;
  taxPercent?: number;
  quantity?: number;
}

export interface StandardDiscountResult {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  discountedPrice: number;
  taxPercent: number;
  taxAmount: number;
  finalPricePerUnit: number;
  quantity: number;
  totalOriginalPrice: number;
  totalSavings: number;
  totalFinalPrice: number;
  effectiveDiscountPercent: number;
}

export interface StackedDiscountStep {
  id: string;
  percent: number;
  label?: string;
}

export interface StackedDiscountStepResult {
  stepIndex: number;
  discountPercent: number;
  startingPrice: number;
  savingsInStep: number;
  endingPrice: number;
}

export interface StackedDiscountResult {
  originalPrice: number;
  steps: StackedDiscountStepResult[];
  finalPrice: number;
  totalSavings: number;
  effectiveDiscountPercent: number;
}

export interface FindPercentParams {
  originalPrice: number;
  salePrice: number;
}

export interface FindPercentResult {
  originalPrice: number;
  salePrice: number;
  discountAmount: number;
  discountPercent: number;
  isPriceIncrease: boolean;
}

export interface ReverseDiscountParams {
  salePrice: number;
  discountPercent: number;
}

export interface ReverseDiscountResult {
  salePrice: number;
  discountPercent: number;
  originalPrice: number;
  savings: number;
}

export interface FixedOffParams {
  originalPrice: number;
  discountAmount: number;
  quantity?: number;
}

export interface FixedOffResult {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  effectivePercent: number;
  quantity: number;
  totalOriginal: number;
  totalSavings: number;
  totalFinal: number;
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
 * 1. Standard Discount Calculation (Price - Discount% + Sales Tax%)
 */
export function calculateStandardDiscount(params: StandardDiscountParams): StandardDiscountResult {
  const originalPrice = Math.max(0, sanitizeNumber(params.originalPrice, 0));
  const discountPercent = Math.min(100, Math.max(0, sanitizeNumber(params.discountPercent, 0)));
  const taxPercent = Math.max(0, sanitizeNumber(params.taxPercent || 0, 0));
  const quantity = Math.max(1, Math.round(sanitizeNumber(params.quantity || 1, 1)));

  const discountAmount = (originalPrice * discountPercent) / 100;
  const discountedPrice = Math.max(0, originalPrice - discountAmount);

  const taxAmount = (discountedPrice * taxPercent) / 100;
  const finalPricePerUnit = discountedPrice + taxAmount;

  const totalOriginalPrice = originalPrice * quantity;
  const totalSavings = discountAmount * quantity;
  const totalFinalPrice = finalPricePerUnit * quantity;

  const effectiveDiscountPercent =
    totalOriginalPrice > 0
      ? ((totalOriginalPrice - totalFinalPrice) / totalOriginalPrice) * 100
      : 0;

  return {
    originalPrice: roundToTwo(originalPrice),
    discountPercent: roundToTwo(discountPercent),
    discountAmount: roundToTwo(discountAmount),
    discountedPrice: roundToTwo(discountedPrice),
    taxPercent: roundToTwo(taxPercent),
    taxAmount: roundToTwo(taxAmount),
    finalPricePerUnit: roundToTwo(finalPricePerUnit),
    quantity,
    totalOriginalPrice: roundToTwo(totalOriginalPrice),
    totalSavings: roundToTwo(totalSavings),
    totalFinalPrice: roundToTwo(totalFinalPrice),
    effectiveDiscountPercent: roundToTwo(effectiveDiscountPercent),
  };
}

/**
 * 2. Stacked / Sequential Discount Calculation (e.g. 20% off, then extra 10% off)
 * Correctly applies each discount sequentially rather than simply adding percentages.
 */
export function calculateStackedDiscounts(
  originalPrice: number,
  discountPercentages: number[]
): StackedDiscountResult {
  const safeOriginal = Math.max(0, sanitizeNumber(originalPrice, 0));
  let currentPrice = safeOriginal;
  const stepResults: StackedDiscountStepResult[] = [];

  discountPercentages.forEach((pct, idx) => {
    const safePct = Math.min(100, Math.max(0, sanitizeNumber(pct, 0)));
    const startingPrice = currentPrice;
    const savingsInStep = (startingPrice * safePct) / 100;
    const endingPrice = Math.max(0, startingPrice - savingsInStep);

    stepResults.push({
      stepIndex: idx + 1,
      discountPercent: roundToTwo(safePct),
      startingPrice: roundToTwo(startingPrice),
      savingsInStep: roundToTwo(savingsInStep),
      endingPrice: roundToTwo(endingPrice),
    });

    currentPrice = endingPrice;
  });

  const finalPrice = roundToTwo(currentPrice);
  const totalSavings = roundToTwo(Math.max(0, safeOriginal - finalPrice));
  const effectiveDiscountPercent =
    safeOriginal > 0 ? roundToTwo((totalSavings / safeOriginal) * 100) : 0;

  return {
    originalPrice: roundToTwo(safeOriginal),
    steps: stepResults,
    finalPrice,
    totalSavings,
    effectiveDiscountPercent,
  };
}

/**
 * 3. Find Discount Percentage & Savings (given original price and sale price)
 */
export function calculateFindPercent(params: FindPercentParams): FindPercentResult {
  const original = Math.max(0, sanitizeNumber(params.originalPrice, 0));
  const sale = Math.max(0, sanitizeNumber(params.salePrice, 0));

  if (original === 0) {
    return {
      originalPrice: 0,
      salePrice: roundToTwo(sale),
      discountAmount: 0,
      discountPercent: 0,
      isPriceIncrease: sale > 0,
    };
  }

  const diff = original - sale;
  const discountAmount = Math.abs(diff);
  const percent = (discountAmount / original) * 100;

  return {
    originalPrice: roundToTwo(original),
    salePrice: roundToTwo(sale),
    discountAmount: roundToTwo(discountAmount),
    discountPercent: roundToTwo(percent),
    isPriceIncrease: diff < 0,
  };
}

/**
 * 4. Reverse Discount Calculation (given sale price and discount %, finds original price)
 * Formula: Original = Sale / (1 - Discount/100)
 */
export function calculateReverseDiscount(params: ReverseDiscountParams): ReverseDiscountResult {
  const sale = Math.max(0, sanitizeNumber(params.salePrice, 0));
  const discountPercent = Math.min(99.99, Math.max(0, sanitizeNumber(params.discountPercent, 0)));

  if (discountPercent >= 100) {
    return {
      salePrice: roundToTwo(sale),
      discountPercent: 100,
      originalPrice: 0,
      savings: 0,
    };
  }

  const originalPrice = sale / (1 - discountPercent / 100);
  const savings = originalPrice - sale;

  return {
    salePrice: roundToTwo(sale),
    discountPercent: roundToTwo(discountPercent),
    originalPrice: roundToTwo(originalPrice),
    savings: roundToTwo(savings),
  };
}

/**
 * 5. Fixed-Amount Discount ($ Off / ₹ Off)
 */
export function calculateFixedOff(params: FixedOffParams): FixedOffResult {
  const original = Math.max(0, sanitizeNumber(params.originalPrice, 0));
  const fixedDiscount = Math.max(0, sanitizeNumber(params.discountAmount, 0));
  const quantity = Math.max(1, Math.round(sanitizeNumber(params.quantity || 1, 1)));

  const finalPerUnit = Math.max(0, original - fixedDiscount);
  const actualDiscountPerUnit = original - finalPerUnit;
  const effectivePercent = original > 0 ? (actualDiscountPerUnit / original) * 100 : 0;

  const totalOriginal = original * quantity;
  const totalSavings = actualDiscountPerUnit * quantity;
  const totalFinal = finalPerUnit * quantity;

  return {
    originalPrice: roundToTwo(original),
    discountAmount: roundToTwo(actualDiscountPerUnit),
    finalPrice: roundToTwo(finalPerUnit),
    effectivePercent: roundToTwo(effectivePercent),
    quantity,
    totalOriginal: roundToTwo(totalOriginal),
    totalSavings: roundToTwo(totalSavings),
    totalFinal: roundToTwo(totalFinal),
  };
}

/**
 * Currency formatter with Indian numbering system
 */
export function formatDiscountCurrency(amount: number, symbol = '₹'): string {
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
