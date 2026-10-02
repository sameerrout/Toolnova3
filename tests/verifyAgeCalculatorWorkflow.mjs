import assert from 'node:assert';
import {
  calculateAge,
  calculateDateDifference,
  getWesternZodiac,
  getChineseZodiac,
} from '../src/core/engine/ageCalculatorEngine.ts';

console.log('🚀 Running Age Calculator Comprehensive Verification Suite...\n');

// 1. TEST: Chronological calculation (Jan 1, 2000 to Oct 2, 2026)
console.log('Test 1: Exact chronological age calculation...');
const birthDate1 = new Date(2000, 0, 1, 0, 0, 0); // Jan 1, 2000
const targetDate1 = new Date(2026, 9, 2, 23, 59, 59); // Oct 2, 2026
const res1 = calculateAge(birthDate1, targetDate1);

assert.strictEqual(res1.years, 26, 'Should be 26 years old');
assert.strictEqual(res1.months, 9, 'Should be 9 months');
assert.strictEqual(res1.days, 1, 'Should be 1 day');
assert.strictEqual(res1.bornDayOfWeek, 'Saturday', 'Jan 1, 2000 was a Saturday');
assert(res1.totalDays > 9700, 'Total days should be greater than 9,700');
console.log(`  ✓ Exact age verified: ${res1.years} Years, ${res1.months} Months, ${res1.days} Days (Born on ${res1.bornDayOfWeek}).`);

// 2. TEST: Leap year / Feb 29 birth date
console.log('\nTest 2: Leap year & February 29 handling...');
const feb29Birth = new Date(2004, 1, 29); // Feb 29, 2004 (Leap year)
const nonLeapTarget = new Date(2025, 2, 1); // March 1, 2025
const resLeap = calculateAge(feb29Birth, nonLeapTarget);
assert.strictEqual(resLeap.years, 21, 'Should be 21 years old');
console.log(`  ✓ Feb 29 leap year birthday calculated accurately (${resLeap.years} years).`);

// 3. TEST: Next Birthday countdown
console.log('\nTest 3: Next birthday calculation...');
assert(res1.nextBirthday.totalDaysRemaining > 0, 'Next birthday should be in the future');
assert.strictEqual(res1.nextBirthday.date.getMonth(), 0, 'Next birthday should be in January');
assert.strictEqual(res1.nextBirthday.date.getDate(), 1, 'Next birthday should be on the 1st');
console.log(`  ✓ Next birthday in ${res1.nextBirthday.totalDaysRemaining} days (${res1.nextBirthday.formattedDate}, ${res1.nextBirthday.dayOfWeek}).`);

// 4. TEST: Zodiac and astrology signs
console.log('\nTest 4: Zodiac calculations...');
const capricorn = getWesternZodiac(1, 1); // Jan 1
assert.strictEqual(capricorn.sign, 'Capricorn');
assert.strictEqual(capricorn.symbol, '♑');

const dragon = getChineseZodiac(2000); // 2000
assert(dragon.animal.includes('Dragon'), 'Year 2000 is Year of the Dragon');
console.log(`  ✓ Western Zodiac: ${capricorn.sign} ${capricorn.symbol}, Chinese Zodiac: ${dragon.animal}.`);

// 5. TEST: Date difference calculation
console.log('\nTest 5: Date difference calculation...');
const start = new Date(2024, 0, 1);
const end = new Date(2024, 0, 15);
const diff = calculateDateDifference(start, end, false);
assert.strictEqual(diff.totalDays, 14, 'Should be 14 days difference');
assert.strictEqual(diff.businessDays, 10, 'Should have 10 working days in 2 weeks');
assert.strictEqual(diff.weekendDays, 4, 'Should have 4 weekend days in 2 weeks');
console.log(`  ✓ Date difference verified: ${diff.totalDays} total days (${diff.businessDays} business, ${diff.weekendDays} weekend).`);

// 6. TEST: Error handling when birth date is after target date
console.log('\nTest 6: Validation when birth date is in the future...');
assert.throws(
  () => {
    calculateAge(new Date(2030, 0, 1), new Date(2026, 0, 1));
  },
  /Birth date cannot be after the target date/,
  'Should throw an error when birth date is after target date'
);
console.log('  ✓ Future birth date properly rejected.');

// 7. TEST: Live HTTP endpoint verification of /age-calculator
console.log('\nTest 7: Verifying HTTP response of /age-calculator...');
const response = await fetch('http://localhost:3000/age-calculator');
assert.strictEqual(response.status, 200, 'Route should return HTTP 200 OK');
const html = await response.text();

// Verify Header & Redesign
assert(html.includes('Age Calculator'), 'HTML must include Age Calculator');
assert(html.includes('v1.0.0'), 'HTML must include v1.0.0 badge');
assert(html.includes('Your dates stay on your device'), 'HTML must include privacy badge');
assert(html.includes('Date of Birth'), 'HTML must include Date of Birth input');
assert(html.includes('Calculate Age On'), 'HTML must include Calculate Age On input');
assert(html.includes('Calculate Age →'), 'HTML must include Calculate Age button');

// Verify Footer is REMOVED
assert(!html.includes('© 2026 Toolino. All rights reserved.'), 'Footer copyright should NOT be present on age-calculator page');
assert(!html.includes('Created by Sameer Rout &amp; Sampangi Sony'), 'Footer credits should NOT be present on age-calculator page');

// Verify NO Sidebars
assert(!html.includes('sidebar-left') && !html.includes('sidebar-right'), 'No sidebar classes should be present');

console.log('  ✓ HTTP 200 verified. Header present, Footer removed, No sidebars, Layout confirmed.');

console.log('\n🎉 ALL AGE CALCULATOR TESTS PASSED SUCCESSFULLY!');
