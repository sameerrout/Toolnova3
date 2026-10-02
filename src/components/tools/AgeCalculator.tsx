'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Cake,
  TrendingUp,
  Heart,
  Wind,
  Moon,
  Info,
} from 'lucide-react';
import {
  calculateAge,
  calculateDateDifference,
  AgeResult,
  DateDiffResult,
} from '@/core/engine/ageCalculatorEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

/**
 * Parses YYYY-MM-DD into a local Date without UTC timezone shifts
 */
function parseLocalDate(str: string, timeStr?: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formats a Date to YYYY-MM-DD using local time
 */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function AgeCalculator() {
  const [mode, setMode] = useState<'age' | 'difference'>('age');

  // Today's local date string
  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  // Age Calculator inputs
  const [birthDateStr, setBirthDateStr] = useState<string>('');
  const [birthTimeStr, setBirthTimeStr] = useState<string>('12:00');
  const [useBirthTime, setUseBirthTime] = useState<boolean>(false);
  const [targetDateStr, setTargetDateStr] = useState<string>(todayStr);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [isLiveTicker, setIsLiveTicker] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

  // Date Difference inputs
  const [startDateStr, setStartDateStr] = useState<string>('2024-01-01');
  const [endDateStr, setEndDateStr] = useState<string>(todayStr);
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(false);
  const [isDiffCalculated, setIsDiffCalculated] = useState<boolean>(true);

  // Status & copy feedback
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock desktop body and html scrolling on desktop viewports so workspace fits in one screen
  useEffect(() => {
    const applyOverflow = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };

    applyOverflow();
    window.addEventListener('resize', applyOverflow);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', applyOverflow);
    };
  }, []);

  // Live ticker updates every second when target date is today
  useEffect(() => {
    if (!isLiveTicker || targetDateStr !== todayStr) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveTicker, targetDateStr, todayStr]);

  // Compute Age Result
  const ageResult: { success: boolean; data?: AgeResult; error?: string } = useMemo(() => {
    if (!birthDateStr) {
      return { success: false, error: 'Please enter your date of birth.' };
    }

    try {
      const birth = parseLocalDate(birthDateStr, useBirthTime ? birthTimeStr : undefined);
      const target =
        targetDateStr === todayStr && isLiveTicker
          ? now
          : parseLocalDate(targetDateStr, '23:59');

      if (birth.getTime() > target.getTime()) {
        return {
          success: false,
          error:
            birthDateStr > todayStr
              ? 'Date of birth cannot be in the future.'
              : 'Calculation date must be on or after the date of birth.',
        };
      }

      const res = calculateAge(birth, target);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid date calculation' };
    }
  }, [birthDateStr, birthTimeStr, useBirthTime, targetDateStr, todayStr, isLiveTicker, now]);

  // Compute Date Difference Result
  const diffResult: { success: boolean; data?: DateDiffResult; error?: string } = useMemo(() => {
    if (!startDateStr || !endDateStr) {
      return { success: false, error: 'Please choose both start and end dates.' };
    }
    try {
      const start = parseLocalDate(startDateStr);
      const end = parseLocalDate(endDateStr);
      const res = calculateDateDifference(start, end, includeEndDay);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Date calculation error' };
    }
  }, [startDateStr, endDateStr, includeEndDay]);

  // Calculate Button Click
  const handleCalculate = () => {
    if (!birthDateStr) {
      setErrorMessage('Please enter your date of birth.');
      return;
    }
    if (!ageResult.success) {
      setErrorMessage(ageResult.error || 'Please enter valid dates.');
      return;
    }
    setIsCalculated(true);
    setErrorMessage(null);
    trackToolEvent('age-calculator', 'tool_completed');
  };

  // Reset to initial state
  const handleReset = () => {
    setBirthDateStr('');
    setBirthTimeStr('12:00');
    setUseBirthTime(false);
    setTargetDateStr(todayStr);
    setIsCalculated(false);
    setIsLiveTicker(false);
    setErrorMessage(null);
  };

  // Quick reset target date to today
  const handleSetToday = () => {
    setTargetDateStr(todayStr);
    setErrorMessage(null);
  };

  // Copy Result Handler
  const handleCopyResult = () => {
    if (mode === 'age' && ageResult.data) {
      const d = ageResult.data;
      const text =
        `Toolino Age Calculator Report:\n` +
        `• Exact Age: ${d.years} Years, ${d.months} Months, ${d.days} Days\n` +
        `• Date of Birth: ${birthDateStr}\n` +
        `• Age On: ${targetDateStr}\n` +
        `• Total Days: ${d.totalDays.toLocaleString()}\n` +
        `• Total Weeks: ${d.totalWeeks.toLocaleString()}\n` +
        `• Total Months: ${d.totalMonths.toLocaleString()}\n` +
        `• Next Birthday: in ${d.nextBirthday.totalDaysRemaining} days (${d.nextBirthday.formattedDate}, ${d.nextBirthday.dayOfWeek})\n` +
        `• Born on: ${d.bornDayOfWeek}\n` +
        `• Zodiac Sign: ${d.zodiac.sign} ${d.zodiac.symbol} (${d.zodiac.element})`;

      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (mode === 'difference' && diffResult.data) {
      const d = diffResult.data;
      const text =
        `Toolino Date Difference Report:\n` +
        `• Duration: ${d.years} Years, ${d.months} Months, ${d.days} Days\n` +
        `• Total Days: ${d.totalDays.toLocaleString()} days\n` +
        `• Business Days: ${d.businessDays.toLocaleString()} days\n` +
        `• Weekend Days: ${d.weekendDays.toLocaleString()} days\n` +
        `• Total Weeks: ${d.totalWeeks.toLocaleString()}`;

      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Is today user's birthday?
  const isBirthdayToday = useMemo(() => {
    if (!birthDateStr || !ageResult.data) return false;
    const [, bMonth, bDay] = birthDateStr.split('-').map(Number);
    const [, tMonth, tDay] = targetDateStr.split('-').map(Number);
    return bMonth === tMonth && bDay === tDay;
  }, [birthDateStr, targetDateStr, ageResult.data]);

  return (
    <div className="w-full bg-slate-50 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden">
      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex-1 flex flex-col min-h-0">
        {/* ========================================================================= */}
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge                          */}
        {/* ========================================================================= */}
        <div className="shrink-0 space-y-1.5 pb-2 border-b border-slate-200/80">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/utility-tools" className="hover:text-blue-600 transition-colors">
              Calculators
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Age Calculator</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Cake className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Age Calculator
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Calculate your exact age in years, months and days, and see useful birthday details.
                </p>
              </div>
            </div>

            {/* Mode Selector & Privacy Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMode('age')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    mode === 'age'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exact Age
                </button>
                <button
                  type="button"
                  onClick={() => setMode('difference')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    mode === 'difference'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Date Difference
                </button>
              </div>

              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 hidden sm:flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  Your dates stay on your device
                </span>
                <span className="text-[11px] text-emerald-700 font-medium before:content-['•_'] before:mr-1">
                  100% private
                </span>
              </div>
            </div>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-red-800 text-xs shrink-0 animate-in fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2 cursor-pointer"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: Two-Column Layout (Left: Inputs, Right: Results)          */}
        {/* ========================================================================= */}
        {mode === 'age' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0 my-2">
            {/* ===================================================================== */}
            {/* LEFT COLUMN: Date Inputs (5 cols on lg)                               */}
            {/* ===================================================================== */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Enter Your Dates</span>
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                  title="Reset inputs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Form Input Body */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* 1. Date of Birth Field */}
                <div>
                  <label
                    htmlFor="birth-date-input"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="birth-date-input"
                    type="date"
                    value={birthDateStr}
                    max={todayStr}
                    onChange={(e) => {
                      setBirthDateStr(e.target.value);
                      setIsCalculated(true);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/30 hover:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select your day, month, and year of birth.
                  </p>
                </div>

                {/* 2. Calculate Age On Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="target-date-input"
                      className="text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Calculate Age On
                    </label>
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className={`text-xs font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        targetDateStr === todayStr
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Today
                    </button>
                  </div>
                  <input
                    id="target-date-input"
                    type="date"
                    value={targetDateStr}
                    onChange={(e) => {
                      setTargetDateStr(e.target.value);
                      setIsCalculated(true);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/30 hover:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Defaults to today. Change date to calculate age on future/past milestones.
                  </p>
                </div>

                {/* 3. Optional Time of Birth Toggle */}
                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="use-time-toggle"
                      className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Include Time of Birth</span>
                    </label>
                    <input
                      id="use-time-toggle"
                      type="checkbox"
                      checked={useBirthTime}
                      onChange={(e) => setUseBirthTime(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                  {useBirthTime && (
                    <input
                      type="time"
                      value={birthTimeStr}
                      onChange={(e) => setBirthTimeStr(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    />
                  )}
                </div>

                {/* Quick Test Birthday Presets */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Sample Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setBirthDateStr('2000-01-01');
                        setIsCalculated(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Jan 1, 2000
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBirthDateStr('1995-06-15');
                        setIsCalculated(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      June 15, 1995
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBirthDateStr('1988-11-20');
                        setIsCalculated(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Nov 20, 1988
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCalculate}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>Calculate Age →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* RIGHT COLUMN: Age Result & Details (7 cols on lg)                     */}
            {/* ===================================================================== */}
            <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {isCalculated && ageResult.data ? 'Your Exact Age' : 'Age Results'}
                </span>
                {isCalculated && ageResult.data && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Result</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Result Content */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
                {isCalculated && ageResult.data ? (
                  <>
                    {/* Birthday Banner if today is Birthday */}
                    {isBirthdayToday && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-900 animate-in fade-in flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>
                          🎉 Happy Birthday! You are {ageResult.data.years} years old today!
                        </span>
                      </div>
                    )}

                    {/* HERO EXACT AGE CARD */}
                    <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                          Chronological Age
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          As of {targetDateStr}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-2xl sm:text-4xl font-extrabold text-blue-600 font-mono tracking-tight block">
                            {ageResult.data.years}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 mt-1 block">
                            {ageResult.data.years === 1 ? 'Year' : 'Years'}
                          </span>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight block">
                            {ageResult.data.months}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 mt-1 block">
                            {ageResult.data.months === 1 ? 'Month' : 'Months'}
                          </span>
                        </div>
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight block">
                            {ageResult.data.days}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 mt-1 block">
                            {ageResult.data.days === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>

                      {useBirthTime && (
                        <div className="mt-3 text-center text-xs font-medium text-slate-600">
                          Precise: {ageResult.data.hours} hours, {ageResult.data.minutes} mins, {ageResult.data.seconds} secs
                        </div>
                      )}
                    </div>

                    {/* NEXT BIRTHDAY CARD */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Next Birthday Countdown</span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          {ageResult.data.nextBirthday.dayOfWeek}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-slate-900 font-mono">
                          {ageResult.data.nextBirthday.totalDaysRemaining}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">days until next birthday</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Upcoming on <strong>{ageResult.data.nextBirthday.formattedDate}</strong> (turning{' '}
                        <strong>{ageResult.data.years + 1} years old</strong>).
                      </p>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              5,
                              Math.round(
                                ((365 - ageResult.data.nextBirthday.totalDaysRemaining) / 365) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* CUMULATIVE TIME TOTALS: 3 Compact Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center">
                        <span className="text-lg font-bold text-slate-900 font-mono block">
                          {ageResult.data.totalMonths.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          Total Months
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center">
                        <span className="text-lg font-bold text-slate-900 font-mono block">
                          {ageResult.data.totalWeeks.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          Total Weeks
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 text-center">
                        <span className="text-lg font-bold text-slate-900 font-mono block">
                          {ageResult.data.totalDays.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          Total Days
                        </span>
                      </div>
                    </div>

                    {/* BIRTH DATE DETAILS: Weekday & Zodiac */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Born on:</span>
                        <span className="font-bold text-slate-900">{ageResult.data.bornDayOfWeek}</span>
                      </div>
                      <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-purple-700 font-medium">Zodiac:</span>
                        <span className="font-bold text-purple-900">
                          {ageResult.data.zodiac.symbol} {ageResult.data.zodiac.sign}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Initial Empty State */
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                      <Cake className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                      Ready to Calculate Your Exact Age
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Enter your date of birth on the left and click <strong>Calculate Age →</strong> to see your exact chronological years, months, days, and next birthday countdown.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                      <span>• Calendar accurate</span>
                      <span>• Leap year aware</span>
                      <span>• 100% private in-browser</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* DATE DIFFERENCE MODE (Preserving existing working functionality)           */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0 my-2">
            {/* Left 5 Cols: Dates */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Date Difference Calculator</span>
              </span>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeEndDay}
                  onChange={(e) => setIncludeEndDay(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Include End Day (+1 day)</span>
              </label>

              <button
                type="button"
                onClick={handleCopyResult}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition"
              >
                {copied ? 'Copied Summary!' : 'Copy Difference Summary'}
              </button>
            </div>

            {/* Right 7 Cols: Difference Results */}
            <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 overflow-y-auto space-y-4">
              {diffResult.data ? (
                <>
                  <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block mb-2">
                      Total Duration
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                      {diffResult.data.years} Years, {diffResult.data.months} Months, {diffResult.data.days} Days
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-lg font-bold text-slate-900 font-mono block">
                        {diffResult.data.totalDays.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Calendar Days</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-lg font-bold text-slate-900 font-mono block">
                        {diffResult.data.businessDays.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Working Days</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-lg font-bold text-slate-900 font-mono block">
                        {diffResult.data.weekendDays.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Weekend Days</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-lg font-bold text-slate-900 font-mono block">
                        {diffResult.data.totalWeeks.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Total Weeks</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {diffResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
