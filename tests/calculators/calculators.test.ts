import { describe, it, expect } from 'vitest';
import {
  calculateStandardDiscount,
  calculateStackedDiscounts,
  calculateReverseDiscount,
  calculateFindPercent,
  calculateFixedOff,
} from '@/tools/discount-calculator/engine';
import { calculateEmi } from '@/tools/emi-calculator/engine';
import { calculateGst } from '@/tools/gst-calculator/engine';
import { calculateAge } from '@/tools/age-calculator/engine';
import { percentOf, whatPercent, percentChange } from '@/tools/percentage-calculator/engine';

describe('Financial & Numerical Calculators', () => {
  describe('Discount Calculator', () => {
    it('calculates standard percentage discount accurately', () => {
      const res = calculateStandardDiscount({
        originalPrice: 200,
        discountPercent: 25,
        taxPercent: 10,
        quantity: 1,
      });

      expect(res.discountAmount).toBe(50);
      expect(res.discountedPrice).toBe(150);
      expect(res.taxAmount).toBe(15);
      expect(res.finalPricePerUnit).toBe(165);
    });

    it('calculates sequential stacked discounts correctly', () => {
      // $100 with 20% off ($80) then 10% off ($72) = 28% effective discount
      const res = calculateStackedDiscounts(100, [20, 10]);
      expect(res.finalPrice).toBe(72);
      expect(res.totalSavings).toBe(28);
      expect(res.effectiveDiscountPercent).toBe(28);
    });

    it('computes reverse discount to find original price', () => {
      // $80 sale price after 20% discount should give $100 original
      const res = calculateReverseDiscount({ salePrice: 80, discountPercent: 20 });
      expect(res.originalPrice).toBe(100);
      expect(res.savings).toBe(20);
    });

    it('finds discount percentage from original and sale price', () => {
      const res = calculateFindPercent({ originalPrice: 150, salePrice: 120 });
      expect(res.discountPercent).toBe(20);
      expect(res.discountAmount).toBe(30);
    });

    it('calculates fixed-amount cash off discounts', () => {
      const res = calculateFixedOff({ originalPrice: 100, discountAmount: 25, quantity: 2 });
      expect(res.finalPrice).toBe(75);
      expect(res.totalFinal).toBe(150);
      expect(res.effectivePercent).toBe(25);
    });
  });

  describe('EMI Calculator', () => {
    it('computes reducing-balance monthly loan EMI and total payment', () => {
      // $100,000 loan at 10% annual rate for 1 year (12 months)
      const res = calculateEmi({
        principal: 100000,
        annualRate: 10,
        tenure: 1,
        tenureUnit: 'years',
      });

      expect(res.totalMonths).toBe(12);
      expect(res.monthlyEmi).toBeGreaterThan(8700);
      expect(res.monthlyEmi).toBeLessThan(8900);
      expect(res.totalPayment).toBeGreaterThan(100000);
      expect(res.monthlySchedule.length).toBe(12);
    });

    it('handles 0% promotional interest financing safely', () => {
      const res = calculateEmi({
        principal: 12000,
        annualRate: 0,
        tenure: 12,
        tenureUnit: 'months',
      });

      expect(res.monthlyEmi).toBe(1000);
      expect(res.totalInterest).toBe(0);
      expect(res.totalPayment).toBe(12000);
    });
  });

  describe('GST Calculator', () => {
    it('calculates Exclusive GST (Add GST)', () => {
      const res = calculateGst({
        amount: 10000,
        rate: 18,
        mode: 'addGst',
        transactionType: 'intraState',
      });

      expect(res.baseAmount).toBe(10000);
      expect(res.totalGstAmount).toBe(1800);
      expect(res.totalAmount).toBe(11800);
      expect(res.cgstAmount).toBe(900);
      expect(res.sgstAmount).toBe(900);
    });

    it('calculates Inclusive GST (Remove GST)', () => {
      const res = calculateGst({
        amount: 11800,
        rate: 18,
        mode: 'removeGst',
        transactionType: 'interState',
      });

      expect(res.baseAmount).toBe(10000);
      expect(res.totalGstAmount).toBe(1800);
      expect(res.totalAmount).toBe(11800);
      expect(res.igstAmount).toBe(1800);
    });
  });

  describe('Percentage & Age Calculators', () => {
    it('calculates percentOf, whatPercent, and percentChange correctly', () => {
      expect(percentOf(15, 200)).toBe(30);
      expect(whatPercent(30, 200)).toBe(15);
      expect(percentChange(100, 150)).toBe(50);
      expect(percentChange(100, 75)).toBe(-25);
    });

    it('computes exact chronological age and leap years', () => {
      const birth = new Date(2000, 0, 1); // Jan 1, 2000
      const ref = new Date(2025, 0, 1); // Jan 1, 2025
      const age = calculateAge(birth, ref);

      expect(age.years).toBe(25);
      expect(age.months).toBe(0);
      expect(age.days).toBe(0);
      expect(age.totalDays).toBeGreaterThan(9000);
    });
  });
});
