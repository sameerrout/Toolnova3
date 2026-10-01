/**
 * Age Calculator Engine - Toolino
 * Handles precise chronological age, time units, next birthday countdown,
 * astrology/zodiac analysis, life milestone statistics, and date differences.
 */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  bornDayOfWeek: string;
  nextBirthday: {
    date: Date;
    formattedDate: string;
    dayOfWeek: string;
    monthsRemaining: number;
    daysRemaining: number;
    totalDaysRemaining: number;
  };
  zodiac: {
    sign: string;
    symbol: string;
    element: string;
  };
  chineseZodiac: {
    animal: string;
    element: string;
  };
  milestones: {
    heartbeatsApprox: number;
    breathsApprox: number;
    sleepHoursApprox: number;
    nextMilestoneDay: {
      targetDays: number;
      date: Date;
      daysRemaining: number;
    };
  };
}

export interface DateDiffResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  businessDays: number;
  weekendDays: number;
  totalWeeks: number;
  totalHours: number;
}

/**
 * Returns days in a specific month and year
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculates exact chronological age between birthDate and targetDate
 */
export function calculateAge(birthDate: Date, targetDate: Date = new Date()): AgeResult {
  if (birthDate.getTime() > targetDate.getTime()) {
    throw new Error('Birth date cannot be after the target date');
  }

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  const birthHours = birthDate.getHours();
  const birthMinutes = birthDate.getMinutes();
  const birthSeconds = birthDate.getSeconds();

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const targetHours = targetDate.getHours();
  const targetMinutes = targetDate.getMinutes();
  const targetSeconds = targetDate.getSeconds();

  let years = targetYear - birthYear;
  let months = targetMonth - birthMonth;
  let days = targetDay - birthDay;
  let hours = targetHours - birthHours;
  let minutes = targetMinutes - birthMinutes;
  let seconds = targetSeconds - birthSeconds;

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }

  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }

  if (hours < 0) {
    hours += 24;
    days -= 1;
  }

  if (days < 0) {
    // Days from previous month
    const prevMonthDays = getDaysInMonth(
      targetMonth === 0 ? targetYear - 1 : targetYear,
      targetMonth === 0 ? 11 : targetMonth - 1
    );
    days += prevMonthDays;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  // Total time units
  const diffMs = targetDate.getTime() - birthDate.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  // Day of week born
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bornDayOfWeek = dayNames[birthDate.getDay()];

  // Next Birthday Calculation
  let nextBdayYear = targetYear;
  let nextBday = new Date(nextBdayYear, birthMonth, birthDay);

  // If birthday already passed this year, take next year
  if (
    targetMonth > birthMonth ||
    (targetMonth === birthMonth && targetDay >= birthDay)
  ) {
    nextBdayYear += 1;
    nextBday = new Date(nextBdayYear, birthMonth, birthDay);
  }

  // Handle Feb 29 for leap year babies
  if (birthMonth === 1 && birthDay === 29) {
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!isLeapYear(nextBdayYear)) {
      nextBday = new Date(nextBdayYear, 1, 28);
    }
  }

  const msToNextBday = nextBday.getTime() - targetDate.getTime();
  const totalDaysRemaining = Math.max(0, Math.ceil(msToNextBday / (1000 * 60 * 60 * 24)));

  let bdayMonthsRemaining = nextBday.getMonth() - targetMonth;
  let bdayDaysRemaining = nextBday.getDate() - targetDay;
  if (bdayDaysRemaining < 0) {
    const prevDays = getDaysInMonth(targetYear, targetMonth);
    bdayDaysRemaining += prevDays;
    bdayMonthsRemaining -= 1;
  }
  if (bdayMonthsRemaining < 0) {
    bdayMonthsRemaining += 12;
  }

  // Zodiac sign
  const zodiac = getWesternZodiac(birthMonth + 1, birthDay);
  const chineseZodiac = getChineseZodiac(birthYear);

  // Life milestones & fun facts
  const heartbeatsApprox = totalDays * 24 * 60 * 80; // ~80 bpm
  const breathsApprox = totalDays * 24 * 60 * 16; // ~16 breaths/min
  const sleepHoursApprox = Math.round(totalDays * 8); // ~8 hours sleep/day

  // Next milestone (e.g. 5,000, 10,000, 15,000, 20,000, 25,000, 30,000 days)
  const milestoneStep = 5000;
  const nextMilestoneDays = Math.ceil((totalDays + 1) / milestoneStep) * milestoneStep;
  const daysUntilMilestone = nextMilestoneDays - totalDays;
  const milestoneDate = new Date(targetDate.getTime() + daysUntilMilestone * 24 * 60 * 60 * 1000);

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours,
    totalMinutes,
    totalSeconds,
    bornDayOfWeek,
    nextBirthday: {
      date: nextBday,
      formattedDate: nextBday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dayOfWeek: dayNames[nextBday.getDay()],
      monthsRemaining: bdayMonthsRemaining,
      daysRemaining: bdayDaysRemaining,
      totalDaysRemaining,
    },
    zodiac,
    chineseZodiac,
    milestones: {
      heartbeatsApprox,
      breathsApprox,
      sleepHoursApprox,
      nextMilestoneDay: {
        targetDays: nextMilestoneDays,
        date: milestoneDate,
        daysRemaining: daysUntilMilestone,
      },
    },
  };
}

/**
 * Calculates date difference between two dates
 */
export function calculateDateDifference(
  startDate: Date,
  endDate: Date,
  includeEndDay = false
): DateDiffResult {
  const isReversed = startDate.getTime() > endDate.getTime();
  const d1 = isReversed ? endDate : startDate;
  const d2 = isReversed ? startDate : endDate;

  let y = d2.getFullYear() - d1.getFullYear();
  let m = d2.getMonth() - d1.getMonth();
  let d = d2.getDate() - d1.getDate();

  if (includeEndDay) {
    d += 1;
  }

  if (d < 0) {
    const prevMonthDays = getDaysInMonth(
      d2.getMonth() === 0 ? d2.getFullYear() - 1 : d2.getFullYear(),
      d2.getMonth() === 0 ? 11 : d2.getMonth() - 1
    );
    d += prevMonthDays;
    m -= 1;
  }

  if (m < 0) {
    m += 12;
    y -= 1;
  }

  // Count total, business, and weekend days
  let totalDays = 0;
  let businessDays = 0;
  let weekendDays = 0;

  const cur = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const endLimit = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());

  if (includeEndDay) {
    endLimit.setDate(endLimit.getDate() + 1);
  }

  while (cur < endLimit) {
    totalDays++;
    const day = cur.getDay();
    if (day === 0 || day === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;

  return {
    years: y,
    months: m,
    days: d,
    totalDays,
    businessDays,
    weekendDays,
    totalWeeks,
    totalHours,
  };
}

/**
 * Determines Western Zodiac Sign
 */
export function getWesternZodiac(month: number, day: number): { sign: string; symbol: string; element: string } {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { sign: 'Aries', symbol: '♈', element: 'Fire' };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { sign: 'Taurus', symbol: '♉', element: 'Earth' };
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { sign: 'Gemini', symbol: '♊', element: 'Air' };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { sign: 'Cancer', symbol: '♋', element: 'Water' };
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { sign: 'Leo', symbol: '♌', element: 'Fire' };
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { sign: 'Virgo', symbol: '♍', element: 'Earth' };
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { sign: 'Libra', symbol: '♎', element: 'Air' };
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { sign: 'Scorpio', symbol: '♏', element: 'Water' };
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { sign: 'Sagittarius', symbol: '♐', element: 'Fire' };
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { sign: 'Capricorn', symbol: '♑', element: 'Earth' };
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { sign: 'Aquarius', symbol: '♒', element: 'Air' };
  }
  return { sign: 'Pisces', symbol: '♓', element: 'Water' };
}

/**
 * Determines Chinese Zodiac Animal and Element
 */
export function getChineseZodiac(year: number): { animal: string; element: string } {
  const animals = [
    'Rat 🐀', 'Ox 🐂', 'Tiger 🐅', 'Rabbit 🐇',
    'Dragon 🐉', 'Snake 🐍', 'Horse 🐎', 'Goat 🐐',
    'Monkey 🐒', 'Rooster 🐓', 'Dog 🐕', 'Pig 🐖'
  ];
  // 1900 was Year of the Rat
  const animalIndex = (year - 4) % 12;
  const positiveAnimalIndex = animalIndex < 0 ? animalIndex + 12 : animalIndex;

  const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  // Last digit determines stem/element
  const lastDigit = Math.abs(year) % 10;
  let elementIndex = 0;
  if (lastDigit === 4 || lastDigit === 5) elementIndex = 0; // Wood
  else if (lastDigit === 6 || lastDigit === 7) elementIndex = 1; // Fire
  else if (lastDigit === 8 || lastDigit === 9) elementIndex = 2; // Earth
  else if (lastDigit === 0 || lastDigit === 1) elementIndex = 3; // Metal
  else if (lastDigit === 2 || lastDigit === 3) elementIndex = 4; // Water

  return {
    animal: animals[positiveAnimalIndex],
    element: elements[elementIndex],
  };
}
