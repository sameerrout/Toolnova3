/**
 * Age Calculator — pure calendar arithmetic.
 *
 * No React, no DOM: `calculateAge` takes two dates and returns plain numbers and
 * strings, so the rules below can be tested directly.
 *
 * Calendar rules used here:
 *
 *  - Years, months and days are counted the way a person would: whole months are
 *    added to the birth date, and the leftover days are counted from there. When
 *    the borrow crosses a month, the **real** length of that month is used (28,
 *    29, 30 or 31 days), never a fixed 30. A birth date of 31 January is
 *    therefore one month and one day old on 1 March, because 31 January plus one
 *    month clamps to the last day of February.
 *  - Totals (days, weeks, hours, minutes, seconds) count whole calendar days, so
 *    they are not affected by daylight-saving changes.
 *  - A 29 February birthday is celebrated on 29 February in a leap year and on
 *    28 February in other years.
 *  - The Chinese zodiac follows the lunar new year, which falls between 21
 *    January and 20 February; dates before 4 February are attributed to the
 *    previous animal, the closest simple approximation.
 */

import { formatDate } from '@/lib/format';

export interface NextBirthday {
  date: Date;
  daysAway: number;
  /** Weekday name, e.g. `Saturday`. */
  weekday: string;
}

export interface ZodiacSign {
  name: string;
  /** Astronomical symbol, e.g. `♌`. */
  symbol: string;
  /** Human-readable date range, e.g. `23 July – 22 August`. */
  dateRange: string;
}

export interface ChineseZodiac {
  animal: string;
  element: string;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  nextBirthday: NextBirthday;
  dayOfWeekBorn: string;
  zodiacSign: ZodiacSign;
  chineseZodiac: ChineseZodiac;
  lifePathNumber: number;
  isBirthdayToday: boolean;
}

const MS_PER_DAY = 86_400_000;

const ZODIAC_SIGNS: (ZodiacSign & { startMonth: number; startDay: number })[] = [
  { name: 'Aquarius', symbol: '♒', dateRange: '20 January – 18 February', startMonth: 1, startDay: 20 },
  { name: 'Pisces', symbol: '♓', dateRange: '19 February – 20 March', startMonth: 2, startDay: 19 },
  { name: 'Aries', symbol: '♈', dateRange: '21 March – 19 April', startMonth: 3, startDay: 21 },
  { name: 'Taurus', symbol: '♉', dateRange: '20 April – 20 May', startMonth: 4, startDay: 20 },
  { name: 'Gemini', symbol: '♊', dateRange: '21 May – 20 June', startMonth: 5, startDay: 21 },
  { name: 'Cancer', symbol: '♋', dateRange: '21 June – 22 July', startMonth: 6, startDay: 21 },
  { name: 'Leo', symbol: '♌', dateRange: '23 July – 22 August', startMonth: 7, startDay: 23 },
  { name: 'Virgo', symbol: '♍', dateRange: '23 August – 22 September', startMonth: 8, startDay: 23 },
  { name: 'Libra', symbol: '♎', dateRange: '23 September – 22 October', startMonth: 9, startDay: 23 },
  { name: 'Scorpio', symbol: '♏', dateRange: '23 October – 21 November', startMonth: 10, startDay: 23 },
  { name: 'Sagittarius', symbol: '♐', dateRange: '22 November – 21 December', startMonth: 11, startDay: 22 },
  { name: 'Capricorn', symbol: '♑', dateRange: '22 December – 19 January', startMonth: 12, startDay: 22 },
];

const CHINESE_ANIMALS = [
  'Rat',
  'Ox',
  'Tiger',
  'Rabbit',
  'Dragon',
  'Snake',
  'Horse',
  'Goat',
  'Monkey',
  'Rooster',
  'Dog',
  'Pig',
] as const;

const CHINESE_ELEMENTS = [
  'Wood',
  'Wood',
  'Fire',
  'Fire',
  'Earth',
  'Earth',
  'Metal',
  'Metal',
  'Water',
  'Water',
] as const;

/** True for Gregorian leap years (divisible by 4, except centuries not by 400). */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in a month. `month` is 0-based, as in `Date`. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Strips the time of day, so every comparison is date-only. */
export function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole days between two dates, computed on the UTC timeline so a
 * daylight-saving change can never add or remove a day.
 */
export function daysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}

/**
 * Adds whole months, clamping the day to the target month's real length.
 * 31 January plus one month is 28 February (29 in a leap year).
 */
function addMonths(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

/** Parses a `YYYY-MM-DD` input value as a local date, avoiding UTC shifts. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (day > daysInMonth(year, month - 1)) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today at midnight, in the visitor's own time zone. */
export function today(): Date {
  return atMidnight(new Date());
}

/** Zodiac sign for a month (1-12) and day. */
export function zodiacFor(month: number, day: number): ZodiacSign {
  let found = ZODIAC_SIGNS[ZODIAC_SIGNS.length - 1] as ZodiacSign & {
    startMonth: number;
    startDay: number;
  };
  for (const sign of ZODIAC_SIGNS) {
    if (month > sign.startMonth || (month === sign.startMonth && day >= sign.startDay)) {
      found = sign;
    }
  }
  return { name: found.name, symbol: found.symbol, dateRange: found.dateRange };
}

/**
 * Chinese zodiac animal and element for a date.
 * The animal changes at the lunar new year, approximated as 4 February.
 */
export function chineseZodiacFor(date: Date): ChineseZodiac {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const lunarYear = month === 1 || (month === 2 && day < 4) ? date.getFullYear() - 1 : date.getFullYear();

  const animalIndex = (((lunarYear - 4) % 12) + 12) % 12;
  const elementIndex = (((lunarYear - 4) % 10) + 10) % 10;

  return {
    animal: CHINESE_ANIMALS[animalIndex] ?? 'Rat',
    element: CHINESE_ELEMENTS[elementIndex] ?? 'Wood',
  };
}

/**
 * Numerology life path number: every digit of the date of birth is added
 * together and reduced to a single digit. 11, 22 and 33 are kept unreduced as
 * the master numbers.
 */
export function lifePathNumber(date: Date): number {
  const digits = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;

  let total = 0;
  for (const character of digits) total += Number(character);

  while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
    total = String(total)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return total;
}

/** The date a birthday falls on in a given year, handling 29 February. */
export function birthdayInYear(birth: Date, year: number): Date {
  const month = birth.getMonth();
  const day = birth.getDate();
  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28);
  }
  return new Date(year, month, Math.min(day, daysInMonth(year, month)));
}

/**
 * Calculates everything the tool shows for a date of birth.
 *
 * `reference` defaults to today. A birth date in the future is clamped to the
 * reference date, so the result is always zero-or-positive and never `NaN`.
 */
export function calculateAge(birth: Date, reference: Date = new Date()): AgeResult {
  const validBirth = Number.isNaN(birth.getTime()) ? atMidnight(reference) : atMidnight(birth);
  const validReference = Number.isNaN(reference.getTime()) ? atMidnight(new Date()) : atMidnight(reference);

  // Never report a negative age.
  const start = validBirth.getTime() <= validReference.getTime() ? validBirth : validReference;
  const end = validReference;

  // Whole months are added to the birth date and compared with the reference
  // date. `addMonths` clamps to the real length of the target month, so a birth
  // date of 31 January is exactly one month old on 28 February, and the borrowed
  // days always come from a real month (28, 29, 30 or 31 days), never a fixed 30.
  let wholeMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (wholeMonths < 0) wholeMonths = 0;
  if (addMonths(start, wholeMonths).getTime() > end.getTime()) wholeMonths -= 1;
  if (wholeMonths < 0) wholeMonths = 0;

  const anchor = addMonths(start, wholeMonths);
  const years = Math.floor(wholeMonths / 12);
  const months = wholeMonths % 12;
  const days = Math.max(0, daysBetween(anchor, end));

  const totalDays = Math.max(0, daysBetween(start, end));

  // Next birthday, using the real birthday date rather than the clamped `start`.
  const todayDate = end;
  let next = birthdayInYear(validBirth, todayDate.getFullYear());
  if (daysBetween(todayDate, next) < 0) {
    next = birthdayInYear(validBirth, todayDate.getFullYear() + 1);
  }
  const daysAway = Math.max(0, daysBetween(todayDate, next));

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalHours: totalDays * 24,
    totalMinutes: totalDays * 24 * 60,
    totalSeconds: totalDays * 24 * 60 * 60,
    nextBirthday: {
      date: next,
      daysAway,
      weekday: formatDate(next, 'en-GB', { weekday: 'long' }),
    },
    dayOfWeekBorn: formatDate(start, 'en-GB', { weekday: 'long' }),
    zodiacSign: zodiacFor(start.getMonth() + 1, start.getDate()),
    chineseZodiac: chineseZodiacFor(start),
    lifePathNumber: lifePathNumber(start),
    isBirthdayToday: daysAway === 0,
  };
}

/** Plain-English summary of the exact age, used in headings and reports. */
export function describeAge(result: AgeResult): string {
  const parts: string[] = [];
  parts.push(`${result.years} ${result.years === 1 ? 'year' : 'years'}`);
  parts.push(`${result.months} ${result.months === 1 ? 'month' : 'months'}`);
  parts.push(`${result.days} ${result.days === 1 ? 'day' : 'days'}`);
  return parts.join(', ');
}
