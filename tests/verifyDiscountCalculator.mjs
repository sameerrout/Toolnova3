import assert from 'node:assert';
import {
  calculateStandardDiscount,
  calculateStackedDiscounts,
  calculateFindPercent,
  calculateReverseDiscount,
  calculateFixedOff,
  formatDiscountCurrency,
} from '../src/core/engine/discountCalculatorEngine.ts';

console.log('🧪 Running ToolNova Discount Calculator Comprehensive Test Suite...\n');

// 1. TEST: Standard Discount (User Prompt: ₹5,000 with 20% discount -> Discount: ₹1,000, Final: ₹4,000)
console.log('Test 1: Standard 20% Discount on ₹5,000...');
{
  const res = calculateStandardDiscount({
    originalPrice: 5000,
    discountPercent: 20,
  });

  assert.strictEqual(res.discountAmount, 1000, `Discount amount should be 1000, got: ${res.discountAmount}`);
  assert.strictEqual(res.discountedPrice, 4000, `Discounted price should be 4000, got: ${res.discountedPrice}`);
  assert.strictEqual(res.totalFinalPrice, 4000, `Total final price should be 4000, got: ${res.totalFinalPrice}`);
  assert.strictEqual(res.totalSavings, 1000, `Total savings should be 1000, got: ${res.totalSavings}`);
  console.log(`  ✓ 20% of ₹5,000: Saved ${formatDiscountCurrency(res.totalSavings)} | Final ${formatDiscountCurrency(res.totalFinalPrice)}`);
}

// 2. TEST: 10%, 50%, and 100% Free Discount
console.log('\nTest 2: Standard 10%, 50%, and 100% Discounts...');
{
  const res10 = calculateStandardDiscount({ originalPrice: 200, discountPercent: 10 });
  assert.strictEqual(res10.discountAmount, 20);
  assert.strictEqual(res10.totalFinalPrice, 180);

  const res50 = calculateStandardDiscount({ originalPrice: 500, discountPercent: 50 });
  assert.strictEqual(res50.discountAmount, 250);
  assert.strictEqual(res50.totalFinalPrice, 250);

  const res100 = calculateStandardDiscount({ originalPrice: 1000, discountPercent: 100 });
  assert.strictEqual(res100.discountAmount, 1000);
  assert.strictEqual(res100.totalFinalPrice, 0);
  console.log('  ✓ 10%, 50%, and 100% boundary discounts verified');
}

// 3. TEST: Stacked Sequential Discounts (User Prompt: ₹10,000 -> 20% off -> 10% off)
console.log('\nTest 3: Stacked Discounts (₹10,000 with 20% off then 10% off)...');
{
  // Step 1: 10,000 - 20% (2,000) = 8,000
  // Step 2: 8,000 - 10% (800) = 7,200
  // Total savings = 2,800. Effective discount = 28% (NOT 30%)
  const res = calculateStackedDiscounts(10000, [20, 10]);

  assert.strictEqual(res.finalPrice, 7200, `Final price should be 7200, got: ${res.finalPrice}`);
  assert.strictEqual(res.totalSavings, 2800, `Total savings should be 2800, got: ${res.totalSavings}`);
  assert.strictEqual(res.effectiveDiscountPercent, 28, `Effective discount must be 28%, got: ${res.effectiveDiscountPercent}`);
  assert.strictEqual(res.steps.length, 2);
  assert.strictEqual(res.steps[0].endingPrice, 8000);
  assert.strictEqual(res.steps[1].endingPrice, 7200);
  console.log(`  ✓ Stacked: ₹10,000 -> 20% -> 10% = ${formatDiscountCurrency(res.finalPrice)} (Effective 28% off)`);
}

// 4. TEST: Find Discount Percentage (User Prompt: Original ₹1,000, Sale ₹800 -> Discount ₹200, 20%)
console.log('\nTest 4: Find Discount Percentage (Original ₹1,000, Sale ₹800)...');
{
  const res = calculateFindPercent({ originalPrice: 1000, salePrice: 800 });

  assert.strictEqual(res.discountAmount, 200, `Discount amount should be 200, got: ${res.discountAmount}`);
  assert.strictEqual(res.discountPercent, 20, `Discount percent should be 20, got: ${res.discountPercent}`);
  assert.strictEqual(res.isPriceIncrease, false);
  console.log(`  ✓ Calculated: Discount ${res.discountPercent}% (${formatDiscountCurrency(res.discountAmount)})`);
}

// 5. TEST: Reverse Discount Calculation (User Prompt: Sale ₹800, Discount 20% -> Original ₹1,000)
console.log('\nTest 5: Reverse Discount Calculation (Sale ₹800, Discount 20%)...');
{
  const res = calculateReverseDiscount({ salePrice: 800, discountPercent: 20 });

  assert.strictEqual(Math.round(res.originalPrice), 1000, `Original price should be 1000, got: ${res.originalPrice}`);
  assert.strictEqual(Math.round(res.savings), 200, `Savings should be 200, got: ${res.savings}`);
  console.log(`  ✓ Reverse computed: Original was ${formatDiscountCurrency(res.originalPrice)}`);
}

// 6. TEST: Fixed Cash Off ($ Off / ₹ Off)
console.log('\nTest 6: Fixed Cash Off (₹2,500 with ₹500 off)...');
{
  const res = calculateFixedOff({ originalPrice: 2500, discountAmount: 500, quantity: 2 });

  assert.strictEqual(res.finalPrice, 2000);
  assert.strictEqual(res.effectivePercent, 20);
  assert.strictEqual(res.totalOriginal, 5000);
  assert.strictEqual(res.totalFinal, 4000);
  assert.strictEqual(res.totalSavings, 1000);
  console.log(`  ✓ Fixed Off: ₹500 off on ₹2,500 = ${res.effectivePercent}% discount`);
}

// 7. TEST: Robustness & Zero/Negative Inputs
console.log('\nTest 7: Boundary & Safety validation...');
{
  const zeroRes = calculateStandardDiscount({ originalPrice: 0, discountPercent: 25 });
  assert.strictEqual(zeroRes.totalFinalPrice, 0);

  const overflowDiscount = calculateStandardDiscount({ originalPrice: 100, discountPercent: 150 });
  assert.strictEqual(overflowDiscount.discountPercent, 100);
  assert.strictEqual(overflowDiscount.totalFinalPrice, 0);

  const nanRes = calculateStandardDiscount({ originalPrice: NaN, discountPercent: NaN });
  assert(!isNaN(nanRes.totalFinalPrice) && isFinite(nanRes.totalFinalPrice));
  console.log('  ✓ Zero, overflow, and NaN safely contained');
}

console.log('\n🎉 ALL TOOLNOVA DISCOUNT CALCULATOR TESTS PASSED WITH 100% SUCCESS!\n');
