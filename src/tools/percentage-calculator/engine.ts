/**
 * Percentage Calculator — pure arithmetic for the seven percentage questions.
 *
 * Every function returns `number | null`, and `null` always means "this cannot
 * be worked out" (usually a division by zero). That is deliberate: the UI shows a
 * short explanation instead of `Infinity` or `NaN`, and the guard lives here
 * rather than in each component.
 *
 * No React, no DOM, no rounding: values are returned at full precision and the
 * UI formats them through `src/lib/format.ts`.
 */

import { formatNumber } from '@/lib/format';

/** True when the value is a usable finite number. */
function isUsable(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Result of a division, or `null` when the divisor is zero or unusable. */
function divide(numerator: number, denominator: number): number | null {
  if (!isUsable(numerator) || !isUsable(denominator) || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

/** `percent` % of `value`. `percentOf(15, 200)` → `30`. */
export function percentOf(percent: number, value: number): number | null {
  if (!isUsable(percent) || !isUsable(value)) return null;
  const result = (percent / 100) * value;
  return Number.isFinite(result) ? result : null;
}

/** What percentage `part` is of `whole`. `whatPercent(30, 200)` → `15`. */
export function whatPercent(part: number, whole: number): number | null {
  const ratio = divide(part, whole);
  return ratio === null ? null : ratio * 100;
}

/**
 * Percentage change from `from` to `to`. Positive means an increase.
 * `null` when the starting value is zero, because the change is undefined.
 */
export function percentChange(from: number, to: number): number | null {
  const difference = isUsable(from) && isUsable(to) ? to - from : null;
  if (difference === null) return null;
  const ratio = divide(difference, from);
  return ratio === null ? null : ratio * 100;
}

/** `value` increased by `percent`. `increaseBy(200, 15)` → `230`. */
export function increaseBy(value: number, percent: number): number | null {
  const extra = percentOf(percent, value);
  if (extra === null || !isUsable(value)) return null;
  return value + extra;
}

/** `value` decreased by `percent`. `decreaseBy(200, 15)` → `170`. */
export function decreaseBy(value: number, percent: number): number | null {
  const reduction = percentOf(percent, value);
  if (reduction === null || !isUsable(value)) return null;
  return value - reduction;
}

/**
 * The value that, after a change of `percent`, becomes `finalValue`.
 * A positive percent reverses an increase, a negative percent a decrease.
 * `null` when the percent is exactly -100%, where no original value exists.
 */
export function reversePercent(finalValue: number, percent: number): number | null {
  if (!isUsable(finalValue) || !isUsable(percent)) return null;
  const factor = 1 + percent / 100;
  const original = divide(finalValue, factor);
  return original;
}

/**
 * Percentage difference between two values, using the mean of their absolute
 * values as the base so the result is never negative whatever the signs.
 * `null` when both values are zero.
 */
export function percentageDifference(a: number, b: number): number | null {
  if (!isUsable(a) || !isUsable(b)) return null;
  const base = (Math.abs(a) + Math.abs(b)) / 2;
  const difference = Math.abs(a - b);
  const result = divide(difference, base);
  return result === null ? null : result * 100;
}

/** `a` as a percentage of `b`, i.e. the ratio written as a percentage. */
export function ratioToPercent(a: number, b: number): number | null {
  return whatPercent(a, b);
}

/**
 * Step-by-step working for a percentage change, written the way it would be
 * set out by hand. Returns an explanation rather than throwing when the change
 * cannot be calculated.
 */
export function explainPercentChange(from: number, to: number): string {
  if (!isUsable(from) || !isUsable(to)) {
    return 'Enter a starting value and an ending value to see the working.';
  }

  const difference = to - from;

  if (from === 0) {
    return [
      'Step 1: the percentage change is measured against the starting value.',
      'The starting value is 0, and dividing by 0 is not defined, so a percentage change cannot be calculated.',
      'Use the "X is what percent of Y" tab instead if you are comparing two amounts.',
    ].join('\n');
  }

  const ratio = difference / from;
  const percent = ratio * 100;
  const direction = difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'unchanged';

  const lines = [
    `Step 1: find the difference. ${formatNumber(to)} − (${formatNumber(from)}) = ${formatNumber(difference)}`,
    `Step 2: divide the difference by the starting value. ${formatNumber(difference)} ÷ ${formatNumber(from)} = ${formatNumber(ratio, 4)}`,
    `Step 3: multiply by 100 to make it a percentage. ${formatNumber(ratio, 4)} × 100 = ${formatNumber(percent)}%`,
  ];

  if (difference === 0) {
    lines.push('The value is unchanged, so the percentage change is 0%.');
  } else {
    lines.push(
      `The value has ${direction} by ${formatNumber(Math.abs(percent))}% from ${formatNumber(
        from
      )} to ${formatNumber(to)}.`
    );
  }

  return lines.join('\n');
}

/**
 * Step-by-step working for "what is X% of Y".
 * Provided so every tab can show its working in the same style.
 */
export function explainPercentOf(percent: number, value: number): string {
  if (!isUsable(percent) || !isUsable(value)) return 'Enter both numbers to see the working.';
  return [
    `Step 1: write the percentage as a decimal. ${formatNumber(percent)}% ÷ 100 = ${formatNumber(
      percent / 100,
      4
    )}`,
    `Step 2: multiply by the amount. ${formatNumber(percent / 100, 4)} × ${formatNumber(value)} = ${formatNumber(
      (percent / 100) * value
    )}`,
  ].join('\n');
}
