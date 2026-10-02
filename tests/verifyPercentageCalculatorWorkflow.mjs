import assert from 'node:assert';
import {
  calculateXPercentOfY,
  calculateXIsWhatPercentOfY,
  calculatePercentageChange,
  calculateDiscount,
  calculateTip,
  calculateMarginMarkup,
} from '../src/core/engine/percentageCalculatorEngine.ts';

console.log('🚀 Running Percentage Calculator Comprehensive Verification Suite...\n');

// 1. TEST: Mode 1 - What is X% of Y?
console.log('Test 1: What is X% of Y calculations...');
const res1_1 = calculateXPercentOfY(20, 500);
assert.strictEqual(res1_1.value, 100, '20% of 500 must equal 100');

const res1_2 = calculateXPercentOfY(15, 200);
assert.strictEqual(res1_2.value, 30, '15% of 200 must equal 30');

const res1_3 = calculateXPercentOfY(25, 800);
assert.strictEqual(res1_3.value, 200, '25% of 800 must equal 200');

const res1_zero = calculateXPercentOfY(20, 0);
assert.strictEqual(res1_zero.value, 0, '20% of 0 must equal 0');

const res1_dec = calculateXPercentOfY(20.5, 99.99);
assert(Math.abs(res1_dec.value - 20.49795) < 0.001, 'Decimal percentage calculated correctly');
console.log(`  ✓ 20% of 500 = ${res1_1.value}, 15% of 200 = ${res1_2.value}, 20.5% of 99.99 = ${res1_dec.value}`);

// 2. TEST: Mode 2 - X is what % of Y?
console.log('\nTest 2: X is what % of Y calculations...');
const res2_1 = calculateXIsWhatPercentOfY(100, 500);
assert.strictEqual(res2_1.percent, 20, '100 is 20% of 500');

const res2_2 = calculateXIsWhatPercentOfY(45, 180);
assert.strictEqual(res2_2.percent, 25, '45 is 25% of 180');

const res2_3 = calculateXIsWhatPercentOfY(250, 1000);
assert.strictEqual(res2_3.percent, 25, '250 is 25% of 1000');

assert.throws(
  () => {
    calculateXIsWhatPercentOfY(50, 0);
  },
  /Base value \(Y\) cannot be zero/,
  'Must throw error when dividing by zero denominator'
);
console.log(`  ✓ 100 is ${res2_1.percent}% of 500. Zero denominator correctly throws exception.`);

// 3. TEST: Mode 3 - Percentage Increase / Decrease
console.log('\nTest 3: Percentage Increase / Decrease calculations...');
// Increase
const res3_inc = calculatePercentageChange(500, 650);
assert.strictEqual(res3_inc.type, 'increase', 'Type must be increase');
assert.strictEqual(res3_inc.absoluteDifference, 150, 'Difference must be 150');
assert.strictEqual(res3_inc.changePercent, 30, 'Percentage change must be +30%');

// Decrease
const res3_dec = calculatePercentageChange(500, 400);
assert.strictEqual(res3_dec.type, 'decrease', 'Type must be decrease');
assert.strictEqual(res3_dec.absoluteDifference, 100, 'Difference must be 100');
assert.strictEqual(res3_dec.changePercent, -20, 'Percentage change must be -20%');

// No Change
const res3_same = calculatePercentageChange(500, 500);
assert.strictEqual(res3_same.type, 'no-change', 'Type must be no-change');
assert.strictEqual(res3_same.absoluteDifference, 0, 'Difference must be 0');
assert.strictEqual(res3_same.changePercent, 0, 'Percentage change must be 0%');

// Zero Original
assert.throws(
  () => {
    calculatePercentageChange(0, 100);
  },
  /Initial value cannot be zero/,
  'Must throw error when initial value is zero'
);
console.log(`  ✓ Increase (500 -> 650): +${res3_inc.changePercent}%, Decrease (500 -> 400): ${res3_dec.changePercent}%, No change: ${res3_same.changePercent}%`);

// 4. TEST: Mode 4 - Discount and Tax
console.log('\nTest 4: Discount & Sales Tax calculations...');
const res4 = calculateDiscount(120, 25, 8);
assert.strictEqual(res4.discountAmount, 30, 'Discount on 120 at 25% is 30');
assert.strictEqual(res4.discountedPrice, 90, 'Pre-tax price is 90');
assert.strictEqual(res4.taxAmount, 7.2, 'Tax is 7.20');
assert.strictEqual(res4.finalPrice, 97.2, 'Final price is 97.20');
console.log(`  ✓ Original: $${res4.originalPrice}, Discount: -$${res4.discountAmount}, Tax: +$${res4.taxAmount}, Final: $${res4.finalPrice}`);

// 5. TEST: Mode 5 - Gratuity and Bill Splitting
console.log('\nTest 5: Tip & Bill Split calculations...');
const res5 = calculateTip(95, 18, 3);
assert.strictEqual(res5.tipAmount, 17.1, 'Tip amount is 17.10');
assert.strictEqual(res5.totalAmount, 112.1, 'Total amount is 112.10');
assert.strictEqual(res5.totalPerPerson, 37.37, 'Total per person is 37.37');
console.log(`  ✓ Bill: $${res5.billAmount}, Tip: $${res5.tipAmount}, Total: $${res5.totalAmount}, Per person: $${res5.totalPerPerson}`);

// 6. TEST: Mode 6 - Margin & Markup
console.log('\nTest 6: Profit Margin & Markup calculations...');
const res6 = calculateMarginMarkup(60, 100);
assert.strictEqual(res6.profit, 40, 'Profit is 40');
assert.strictEqual(res6.marginPercent, 40, 'Margin is 40%');
assert.strictEqual(res6.markupPercent, 66.67, 'Markup is 66.67%');
console.log(`  ✓ Cost: $${res6.cost}, Sell: $${res6.sellingPrice}, Profit: $${res6.profit}, Margin: ${res6.marginPercent}%, Markup: ${res6.markupPercent}%`);

// 7. TEST: Live HTTP endpoint verification of /percentage-calculator
console.log('\nTest 7: Verifying HTTP response of /percentage-calculator...');
const response = await fetch('http://localhost:3000/percentage-calculator');
assert.strictEqual(response.status, 200, 'Route should return HTTP 200 OK');
const html = await response.text();

// Verify Header & Redesign
assert(html.includes('Percentage Calculator'), 'HTML must include Percentage Calculator');
assert(html.includes('v1.0.0'), 'HTML must include v1.0.0 badge');
assert(html.includes('Calculations stay on your device'), 'HTML must include privacy badge');
assert(html.includes('What is X% of Y?'), 'HTML must include What is X% of Y mode');
assert(html.includes('X is what % of Y?'), 'HTML must include X is what % of Y mode');
assert(html.includes('Percentage Increase / Decrease'), 'HTML must include Increase/Decrease mode');
assert(html.includes('Calculate'), 'HTML must include Calculate button');
assert(html.includes('Reset'), 'HTML must include Reset button');

// Verify Footer is REMOVED
assert(!html.includes('© 2026 Toolino. All rights reserved.'), 'Footer copyright should NOT be present on percentage-calculator page');
assert(!html.includes('Created by Sameer Rout &amp; Sampangi Sony'), 'Footer credits should NOT be present on percentage-calculator page');

// Verify NO Sidebars
assert(!html.includes('sidebar-left') && !html.includes('sidebar-right'), 'No sidebar classes should be present');

console.log('  ✓ HTTP 200 verified. Header present, Footer removed, No sidebars, Layout confirmed.');

console.log('\n🎉 ALL PERCENTAGE CALCULATOR TESTS PASSED SUCCESSFULLY!');
