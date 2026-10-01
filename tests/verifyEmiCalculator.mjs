import assert from 'node:assert';
import {
  calculateEmi,
  formatCurrency,
  LOAN_PRESETS,
} from '../src/core/engine/emiCalculatorEngine.ts';

console.log('🧪 Running ToolNova EMI Calculator Comprehensive Test Suite...\n');

// 1. TEST: Normal Standard Reducing-Balance Loan (Example from User Prompt: 10 Lakhs, 8.5%, 20 Years)
console.log('Test 1: Standard Home Loan (₹10,00,000, 8.5%, 20 Years)...');
{
  const res = calculateEmi({
    principal: 1000000,
    annualRate: 8.5,
    tenure: 20,
    tenureUnit: 'years',
  });

  assert(res.monthlyEmi > 8000 && res.monthlyEmi < 9500, `Monthly EMI should be realistic, got: ${res.monthlyEmi}`);
  // Standard math: P=10L, r=8.5%/12, n=240 -> EMI is approx 8678.23
  assert.strictEqual(Math.round(res.monthlyEmi), 8678, `Monthly EMI expected around 8678, got: ${res.monthlyEmi}`);
  assert.strictEqual(res.totalMonths, 240, 'Total months should be 240');
  assert.strictEqual(res.principalAmount, 1000000, 'Principal amount should match 10,00,000');
  assert(res.totalInterest > 1000000, 'Total interest on 20yr 8.5% loan should exceed 10L');
  assert.strictEqual(res.yearlySchedule.length, 20, 'Should have exactly 20 yearly schedule rows');
  assert.strictEqual(res.monthlySchedule.length, 240, 'Should have exactly 240 monthly schedule rows');

  // Verify conservation of principal: Sum of all principal paid must equal initial principal
  const totalPrincipalPaid = res.monthlySchedule.reduce((sum, item) => sum + item.principalPaid, 0);
  assert(
    Math.abs(totalPrincipalPaid - 1000000) < 1.0,
    `Sum of principal paid (${totalPrincipalPaid}) should equal initial principal (1000000)`
  );

  // Closing balance on last month must be 0
  const finalClosing = res.monthlySchedule[res.monthlySchedule.length - 1].closingBalance;
  assert.strictEqual(finalClosing, 0, `Closing balance at loan end must be 0, got: ${finalClosing}`);
  console.log(`  ✓ Monthly EMI: ${formatCurrency(res.monthlyEmi)} | Total Interest: ${formatCurrency(res.totalInterest)}`);
}

// 2. TEST: 0% Interest Scheme (e.g. 0% EMI promotion, ₹60,000 for 6 months)
console.log('\nTest 2: Zero-Percent Interest (0% EMI, ₹60,000 for 6 months)...');
{
  const res = calculateEmi({
    principal: 60000,
    annualRate: 0,
    tenure: 6,
    tenureUnit: 'months',
  });

  assert.strictEqual(res.monthlyEmi, 10000, `0% EMI for 60,000 / 6 should be exactly 10,000, got: ${res.monthlyEmi}`);
  assert.strictEqual(res.totalInterest, 0, `0% loan must have 0 total interest, got: ${res.totalInterest}`);
  assert.strictEqual(res.totalPayment, 60000, `0% loan total payment must equal principal, got: ${res.totalPayment}`);
  assert.strictEqual(res.interestPercentage, 0, 'Interest percentage should be 0');
  assert.strictEqual(res.principalPercentage, 100, 'Principal percentage should be 100');
  console.log(`  ✓ 0% Interest correctly handled: EMI = ${formatCurrency(res.monthlyEmi)}, Interest = ₹0`);
}

// 3. TEST: Decimal Rates & High-Precision Floating Rates (e.g. 9.75% for 3.5 years)
console.log('\nTest 3: Decimal Interest Rate & Fractional Tenures (9.75%, 42 months)...');
{
  const res = calculateEmi({
    principal: 450000,
    annualRate: 9.75,
    tenure: 42,
    tenureUnit: 'months',
  });

  assert(!isNaN(res.monthlyEmi) && isFinite(res.monthlyEmi), 'EMI must be a valid finite number');
  assert(res.monthlyEmi > 12000 && res.monthlyEmi < 13500, `EMI should be approx 12700, got ${res.monthlyEmi}`);
  assert.strictEqual(res.totalMonths, 42);
  assert.strictEqual(res.monthlySchedule[41].closingBalance, 0, 'Final closing balance must be 0');
  console.log(`  ✓ Decimal interest correctly amortized: EMI = ${formatCurrency(res.monthlyEmi)}`);
}

// 4. TEST: Very Short Tenure (1 Month Loan)
console.log('\nTest 4: Ultra-Short Tenure (1 Month, ₹10,000, 12% p.a.)...');
{
  const res = calculateEmi({
    principal: 10000,
    annualRate: 12,
    tenure: 1,
    tenureUnit: 'months',
  });

  // 1 month at 12% p.a. (1% per month) -> interest = 100, EMI = 10100
  assert.strictEqual(Math.round(res.totalInterest), 100, `Expected 100 interest, got ${res.totalInterest}`);
  assert.strictEqual(Math.round(res.monthlyEmi), 10100, `Expected 10100 EMI, got ${res.monthlyEmi}`);
  assert.strictEqual(res.monthlySchedule.length, 1);
  assert.strictEqual(res.monthlySchedule[0].closingBalance, 0);
  console.log(`  ✓ 1-month tenure resolved perfectly`);
}

// 5. TEST: Very Long Tenure & Large Amount (30 Years, ₹5 Crore at 8.75%)
console.log('\nTest 5: Very Long Tenure & Large Principal (30 Years, ₹5,00,00,000, 8.75%)...');
{
  const res = calculateEmi({
    principal: 50000000,
    annualRate: 8.75,
    tenure: 30,
    tenureUnit: 'years',
  });

  assert(!isNaN(res.monthlyEmi) && isFinite(res.monthlyEmi), 'Must handle large numbers without overflow');
  assert.strictEqual(res.totalMonths, 360);
  assert.strictEqual(res.yearlySchedule.length, 30);
  const finalMonth = res.monthlySchedule[359];
  assert.strictEqual(finalMonth.closingBalance, 0, 'Final balance must be 0 after 30 years');
  console.log(`  ✓ ₹5 Cr loan EMI: ${formatCurrency(res.monthlyEmi)} | 360 months amortized safely`);
}

// 6. TEST: Robust Edge Cases & Invalid Values (No NaN, No Infinity)
console.log('\nTest 6: Safety & Error Handling (Negative, NaN, Zero inputs)...');
{
  const zeroRes = calculateEmi({
    principal: 0,
    annualRate: 10,
    tenure: 5,
    tenureUnit: 'years',
  });
  assert.strictEqual(zeroRes.monthlyEmi, 0);
  assert.strictEqual(zeroRes.totalPayment, 0);

  const nanRes = calculateEmi({
    principal: NaN,
    annualRate: NaN,
    tenure: NaN,
    tenureUnit: 'years',
  });
  assert(!isNaN(nanRes.monthlyEmi) && isFinite(nanRes.monthlyEmi), 'Must not return NaN for NaN inputs');
  assert.strictEqual(nanRes.monthlyEmi, 0);

  const negRes = calculateEmi({
    principal: -50000,
    annualRate: -5,
    tenure: -2,
    tenureUnit: 'years',
  });
  assert(!isNaN(negRes.monthlyEmi) && isFinite(negRes.monthlyEmi), 'Must not return NaN for negative inputs');
  console.log(`  ✓ Extreme & malformed inputs guarded against NaN and Infinity`);
}

// 7. TEST: Currency Formatter (Indian numbering format)
console.log('\nTest 7: Indian Currency Formatter verification...');
{
  assert.strictEqual(formatCurrency(1000), '₹1,000');
  assert.strictEqual(formatCurrency(100000), '₹1,00,000');
  assert.strictEqual(formatCurrency(1000000), '₹10,00,000');
  assert.strictEqual(formatCurrency(10000000), '₹1,00,00,000');
  assert.strictEqual(formatCurrency(0), '₹0');
  console.log(`  ✓ Indian numbering format (Lakhs and Crores) verified`);
}

console.log('\n🎉 ALL TOOLNOVA EMI CALCULATOR TESTS PASSED WITH 100% SUCCESS!\n');
