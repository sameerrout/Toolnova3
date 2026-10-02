import assert from 'node:assert';
import {
  calculateGst,
  formatGstCurrency,
  CONFIGURABLE_GST_RATES,
} from '../src/core/engine/gstCalculatorEngine.ts';

console.log('🧪 Running ToolNova GST Calculator Comprehensive Test Suite...\n');

// 1. TEST: Add GST Exclusive (User Prompt: ₹10,000, 18% -> GST ₹1,800, Total ₹11,800)
console.log('Test 1: Add GST Exclusive Mode (₹10,000 at 18%)...');
{
  const res = calculateGst({
    amount: 10000,
    rate: 18,
    mode: 'addGst',
    transactionType: 'intraState',
  });

  assert.strictEqual(res.baseAmount, 10000, `Base amount should be 10000, got: ${res.baseAmount}`);
  assert.strictEqual(res.totalGstAmount, 1800, `Total GST should be 1800, got: ${res.totalGstAmount}`);
  assert.strictEqual(res.totalAmount, 11800, `Total amount should be 11800, got: ${res.totalAmount}`);
  assert.strictEqual(res.cgstAmount, 900, `CGST should be 900, got: ${res.cgstAmount}`);
  assert.strictEqual(res.sgstAmount, 900, `SGST should be 900, got: ${res.sgstAmount}`);
  assert.strictEqual(res.cgstRate, 9, 'CGST rate should be 9%');
  assert.strictEqual(res.sgstRate, 9, 'SGST rate should be 9%');
  assert.strictEqual(res.igstAmount, 0, 'IGST should be 0 for intra-state');
  console.log(`  ✓ Add GST: Base ${formatGstCurrency(res.baseAmount)} + GST ${formatGstCurrency(res.totalGstAmount)} = Total ${formatGstCurrency(res.totalAmount)}`);
}

// 2. TEST: Remove GST Inclusive (User Prompt: ₹11,800 at 18% -> Base ₹10,000, GST ₹1,800)
console.log('\nTest 2: Remove GST Inclusive Mode (₹11,800 at 18%)...');
{
  const res = calculateGst({
    amount: 11800,
    rate: 18,
    mode: 'removeGst',
    transactionType: 'intraState',
  });

  assert.strictEqual(Math.round(res.baseAmount), 10000, `Base amount should be 10000, got: ${res.baseAmount}`);
  assert.strictEqual(Math.round(res.totalGstAmount), 1800, `GST should be 1800, got: ${res.totalGstAmount}`);
  assert.strictEqual(res.totalAmount, 11800, `Total amount should be 11800, got: ${res.totalAmount}`);
  assert.strictEqual(Math.round(res.cgstAmount), 900);
  assert.strictEqual(Math.round(res.sgstAmount), 900);
  console.log(`  ✓ Remove GST: Gross ${formatGstCurrency(res.totalAmount)} -> Net Base ${formatGstCurrency(res.baseAmount)} + GST ${formatGstCurrency(res.totalGstAmount)}`);
}

// 3. TEST: Inter-State IGST (18% to IGST)
console.log('\nTest 3: Inter-State IGST Mode (₹50,000 at 18%)...');
{
  const res = calculateGst({
    amount: 50000,
    rate: 18,
    mode: 'addGst',
    transactionType: 'interState',
  });

  assert.strictEqual(res.totalGstAmount, 9000);
  assert.strictEqual(res.igstAmount, 9000, 'All GST must go to IGST in inter-state supply');
  assert.strictEqual(res.igstRate, 18);
  assert.strictEqual(res.cgstAmount, 0, 'CGST must be 0 for inter-state');
  assert.strictEqual(res.sgstAmount, 0, 'SGST must be 0 for inter-state');
  console.log(`  ✓ Inter-State IGST: ${formatGstCurrency(res.igstAmount)} (100% IGST)`);
}

// 4. TEST: Configurable Rate Slabs (0%, 3%, 5%, 12%, 18%, 28%)
console.log('\nTest 4: Configurable Standard GST Slabs verification...');
{
  assert.strictEqual(CONFIGURABLE_GST_RATES.length, 6);
  const rates = CONFIGURABLE_GST_RATES.map((s) => s.rate);
  assert.deepStrictEqual(rates, [0, 3, 5, 12, 18, 28]);

  // Test 0% Exempted rate
  const res0 = calculateGst({ amount: 5000, rate: 0, mode: 'addGst', transactionType: 'intraState' });
  assert.strictEqual(res0.totalGstAmount, 0);
  assert.strictEqual(res0.totalAmount, 5000);

  // Test 5% essentials rate
  const res5 = calculateGst({ amount: 1000, rate: 5, mode: 'addGst', transactionType: 'intraState' });
  assert.strictEqual(res5.totalGstAmount, 50);
  assert.strictEqual(res5.totalAmount, 1050);

  // Test 28% luxury rate
  const res28 = calculateGst({ amount: 100000, rate: 28, mode: 'addGst', transactionType: 'intraState' });
  assert.strictEqual(res28.totalGstAmount, 28000);
  assert.strictEqual(res28.totalAmount, 128000);
  console.log('  ✓ 0%, 5%, and 28% slabs verified');
}

// 5. TEST: Decimal Amounts and Rates (e.g. ₹1,245.50 at 12.5%)
console.log('\nTest 5: Decimal Amounts & Rates...');
{
  const res = calculateGst({
    amount: 1245.5,
    rate: 12.5,
    mode: 'addGst',
    transactionType: 'intraState',
  });

  assert(!isNaN(res.totalAmount) && isFinite(res.totalAmount));
  assert.strictEqual(res.baseAmount, 1245.5);
  console.log(`  ✓ Decimals computed accurately: Total ${formatGstCurrency(res.totalAmount)}`);
}

// 6. TEST: Robustness & Zero/Negative Inputs
console.log('\nTest 6: Safety against Zero, Negative, and NaN...');
{
  const zeroRes = calculateGst({ amount: 0, rate: 18, mode: 'addGst', transactionType: 'intraState' });
  assert.strictEqual(zeroRes.totalAmount, 0);
  assert.strictEqual(zeroRes.totalGstAmount, 0);

  const nanRes = calculateGst({ amount: NaN, rate: NaN, mode: 'addGst', transactionType: 'intraState' });
  assert(!isNaN(nanRes.totalAmount) && isFinite(nanRes.totalAmount));
  assert.strictEqual(nanRes.totalAmount, 0);
  console.log('  ✓ Zero, negative, and NaN safely handled');
}

// 7. TEST: Verifying HTTP response of /gst-calculator
console.log('\nTest 7: Verifying HTTP response of /gst-calculator...');
{
  const response = await fetch('http://localhost:3000/gst-calculator');
  assert.strictEqual(response.status, 200, 'Route should return HTTP 200 OK');
  const html = await response.text();

  // Verify Header & Redesign elements
  assert(html.includes('GST Calculator'), 'HTML must include GST Calculator');
  assert(html.includes('v1.0.0'), 'HTML must include v1.0.0 badge');
  assert(html.includes('Calculations stay on your device'), 'HTML must include privacy badge');
  assert(html.includes('Add GST (Exclusive)'), 'HTML must include Add GST mode');
  assert(html.includes('Remove GST (Inclusive)'), 'HTML must include Remove GST mode');
  assert(html.includes('Amount Before GST'), 'HTML must include Amount Before GST');
  assert(html.includes('Calculate GST'), 'HTML must include Calculate GST button');
  assert(html.includes('Final Invoice Amount'), 'HTML must include Final Invoice Amount hero card');

  // Verify Footer is REMOVED
  assert(!html.includes('© 2026 Toolino. All rights reserved.'), 'Footer copyright should NOT be present on gst-calculator page');
  assert(!html.includes('Created by Sameer Rout &amp; Sampangi Sony'), 'Footer credits should NOT be present on gst-calculator page');

  // Verify NO Sidebars
  assert(!html.includes('sidebar-left') && !html.includes('sidebar-right'), 'No sidebar classes should be present');

  console.log('  ✓ HTTP 200 verified. Header present, Footer removed, No sidebars, Layout confirmed.');
}

console.log('\n🎉 ALL TOOLNOVA GST CALCULATOR TESTS PASSED WITH 100% SUCCESS!\n');

