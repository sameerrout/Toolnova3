'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Heart,
  Wind,
  Moon,
  Copy,
  Check,
  RotateCcw,
  Compass,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  calculateAge,
  calculateDateDifference,
  AgeResult,
  DateDiffResult
} from '@/core/engine/ageCalculatorEngine';

export function AgeCalculator() {
  const [activeTab, setActiveTab] = useState<'age' | 'difference'>('age');

  // Age Calculator inputs
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [birthDateStr, setBirthDateStr] = useState<string>('1998-05-15');
  const [birthTimeStr, setBirthTimeStr] = useState<string>('12:00');
  const [useBirthTime, setUseBirthTime] = useState<boolean>(false);
  const [targetDateStr, setTargetDateStr] = useState<string>(todayStr);
  const [isLiveTicker, setIsLiveTicker] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  // Date Difference inputs
  const [startDateStr, setStartDateStr] = useState<string>('2024-01-01');
  const [endDateStr, setEndDateStr] = useState<string>(todayStr);
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(false);

  // Copy toast state
  const [copied, setCopied] = useState<boolean>(false);

  // Live ticker updates every second when target date is today
  useEffect(() => {
    if (!isLiveTicker || targetDateStr !== todayStr) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveTicker, targetDateStr, todayStr]);

  // Compute Age
  const ageResult: { success: boolean; data?: AgeResult; error?: string } = useMemo(() => {
    try {
      if (!birthDateStr) return { success: false, error: 'Please select a birth date.' };

      let birth: Date;
      if (useBirthTime && birthTimeStr) {
        birth = new Date(`${birthDateStr}T${birthTimeStr}:00`);
      } else {
        birth = new Date(`${birthDateStr}T00:00:00`);
      }

      let target: Date;
      if (targetDateStr === todayStr && isLiveTicker) {
        target = now;
      } else {
        target = new Date(`${targetDateStr}T23:59:59`);
      }

      if (birth.getTime() > target.getTime()) {
        return { success: false, error: 'Birth date cannot be after the target date.' };
      }

      const res = calculateAge(birth, target);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid date calculation' };
    }
  }, [birthDateStr, birthTimeStr, useBirthTime, targetDateStr, todayStr, isLiveTicker, now]);

  // Compute Date Difference
  const diffResult: { success: boolean; data?: DateDiffResult; error?: string } = useMemo(() => {
    try {
      if (!startDateStr || !endDateStr) {
        return { success: false, error: 'Please choose both start and end dates.' };
      }
      const start = new Date(`${startDateStr}T00:00:00`);
      const end = new Date(`${endDateStr}T00:00:00`);
      const res = calculateDateDifference(start, end, includeEndDay);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Date calculation error' };
    }
  }, [startDateStr, endDateStr, includeEndDay]);

  const handleCopySummary = () => {
    if (activeTab === 'age' && ageResult.data) {
      const d = ageResult.data;
      const text = `Age Summary from Toolino:\n` +
        `• Exact Age: ${d.years} Years, ${d.months} Months, ${d.days} Days\n` +
        `• Total Days: ${d.totalDays.toLocaleString()}\n` +
        `• Total Weeks: ${d.totalWeeks.toLocaleString()}\n` +
        `• Next Birthday: in ${d.nextBirthday.totalDaysRemaining} days (${d.nextBirthday.formattedDate}, ${d.nextBirthday.dayOfWeek})\n` +
        `• Western Zodiac: ${d.zodiac.sign} ${d.zodiac.symbol} (${d.zodiac.element})\n` +
        `• Chinese Zodiac: ${d.chineseZodiac.animal} (${d.chineseZodiac.element})\n` +
        `• Born on: ${d.bornDayOfWeek}\n` +
        `Calculated free at https://toolnova.com/age-calculator`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (activeTab === 'difference' && diffResult.data) {
      const d = diffResult.data;
      const text = `Date Difference from Toolino:\n` +
        `• Duration: ${d.years} Years, ${d.months} Months, ${d.days} Days\n` +
        `• Total Days: ${d.totalDays.toLocaleString()} days\n` +
        `• Working Days: ${d.businessDays.toLocaleString()} weekdays\n` +
        `• Weekend Days: ${d.weekendDays.toLocaleString()} days\n` +
        `Calculated free at https://toolnova.com/age-calculator`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('age')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'age'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🎂 Exact Age Calculator
          </button>
          <button
            onClick={() => setActiveTab('difference')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'difference'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📅 Date Difference
          </button>
        </div>

        <button
          onClick={handleCopySummary}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          title="Copy summary to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
        </button>
      </div>

      {/* TAB 1: EXACT AGE CALCULATOR */}
      {activeTab === 'age' && (
        <div className="space-y-8">
          {/* Input Controls Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Enter Dates for Chronological Calculation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={birthDateStr}
                  onChange={(e) => setBirthDateStr(e.target.value)}
                  max={todayStr}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Age on Date (Target Date) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Calculate Age On
                  </label>
                  {targetDateStr !== todayStr && (
                    <button
                      onClick={() => setTargetDateStr(todayStr)}
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Today</span>
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Time of Birth (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Time of Birth (Optional)
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={useBirthTime}
                      onChange={(e) => setUseBirthTime(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Include</span>
                  </label>
                </div>
                <input
                  type="time"
                  disabled={!useBirthTime}
                  value={birthTimeStr}
                  onChange={(e) => setBirthTimeStr(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium ${
                    useBirthTime
                      ? 'border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Quick Helper presets */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-400">Quick Test Birthdays:</span>
              <button
                onClick={() => setBirthDateStr('2000-01-01')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              >
                Millennium (Jan 1, 2000)
              </button>
              <button
                onClick={() => setBirthDateStr('1990-06-15')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              >
                June 15, 1990
              </button>
              <button
                onClick={() => setBirthDateStr('1985-11-20')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
              >
                Nov 20, 1985
              </button>
              {targetDateStr === todayStr && (
                <label className="ml-auto flex items-center space-x-1.5 cursor-pointer text-blue-600 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={isLiveTicker}
                    onChange={(e) => setIsLiveTicker(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Live Real-Time Seconds</span>
                </label>
              )}
            </div>
          </div>

          {/* Calculation Error Alert */}
          {!ageResult.success && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center space-x-2">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span>{ageResult.error}</span>
            </div>
          )}

          {/* Results View */}
          {ageResult.success && ageResult.data && (
            <div className="space-y-6">
              {/* Main Age Hero Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white p-8 sm:p-10 shadow-lg">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                    Exact Age Calculation
                  </span>
                  <div className="grid grid-cols-3 gap-4 text-center max-w-xl">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                      <div className="text-3xl sm:text-5xl font-black">{ageResult.data.years}</div>
                      <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Years</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                      <div className="text-3xl sm:text-5xl font-black">{ageResult.data.months}</div>
                      <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Months</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                      <div className="text-3xl sm:text-5xl font-black">{ageResult.data.days}</div>
                      <div className="text-xs sm:text-sm font-medium text-blue-100 mt-1">Days</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-blue-100">
                    <span className="bg-white/10 px-3 py-1 rounded-lg">
                      🕒 {ageResult.data.hours} hours, {ageResult.data.minutes} mins, {ageResult.data.seconds} secs
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg">
                      🗓️ Born on a <strong>{ageResult.data.bornDayOfWeek}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Birthday & Astrology Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Next Birthday Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-900">Next Birthday Countdown</h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                        {ageResult.data.nextBirthday.dayOfWeek}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {ageResult.data.nextBirthday.totalDaysRemaining}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">days remaining</span>
                    </div>

                    <p className="text-sm text-slate-600 mt-2">
                      Upcoming on <strong>{ageResult.data.nextBirthday.formattedDate}</strong>
                    </p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                      Exactly <strong>{ageResult.data.nextBirthday.monthsRemaining} months</strong> and{' '}
                      <strong>{ageResult.data.nextBirthday.daysRemaining} days</strong> away.
                    </div>
                  </div>

                  {/* Progress Bar of Year */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Birthday Cycle Progress</span>
                      <span>
                        {Math.round(((365 - ageResult.data.nextBirthday.totalDaysRemaining) / 365) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, Math.round(((365 - ageResult.data.nextBirthday.totalDaysRemaining) / 365) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Astrology & Zodiac Sign */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Compass className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900">Zodiac &amp; Astrological Identity</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Western Zodiac */}
                    <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100">
                      <div className="text-2xl mb-1">{ageResult.data.zodiac.symbol}</div>
                      <div className="text-base font-bold text-purple-900">
                        {ageResult.data.zodiac.sign}
                      </div>
                      <div className="text-xs text-purple-700 font-medium mt-0.5">
                        Element: {ageResult.data.zodiac.element}
                      </div>
                      <div className="text-[11px] text-purple-600 mt-1">Western Sun Sign</div>
                    </div>

                    {/* Chinese Zodiac */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <div className="text-2xl mb-1">{ageResult.data.chineseZodiac.animal.split(' ')[1] || '🐉'}</div>
                      <div className="text-base font-bold text-emerald-900">
                        {ageResult.data.chineseZodiac.animal.split(' ')[0]}
                      </div>
                      <div className="text-xs text-emerald-700 font-medium mt-0.5">
                        Element: {ageResult.data.chineseZodiac.element}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-1">Lunar Calendar Animal</div>
                    </div>
                  </div>

                  {/* Day of Week Born */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <span>Day of the Week Born:</span>
                    <strong className="text-slate-900 font-bold">{ageResult.data.bornDayOfWeek}</strong>
                  </div>
                </div>
              </div>

              {/* Total Units Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Age in Cumulative Time Units</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {ageResult.data.totalMonths.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total Months</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {ageResult.data.totalWeeks.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total Weeks</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {ageResult.data.totalDays.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total Days</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {ageResult.data.totalHours.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total Hours</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {ageResult.data.totalMinutes.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total Minutes</div>
                  </div>
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                    <div className="text-lg font-bold text-blue-700">
                      {ageResult.data.totalSeconds.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600 font-medium mt-0.5">Total Seconds</div>
                  </div>
                </div>
              </div>

              {/* Life Statistics & Milestones */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Biological Estimates &amp; Lifetime Milestones</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Heartbeats */}
                  <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-100 flex items-start space-x-3">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-rose-900">
                        {Math.round(ageResult.data.milestones.heartbeatsApprox / 1_000_000).toLocaleString()}M
                      </div>
                      <div className="text-xs text-rose-700 mt-0.5">Estimated Heartbeats</div>
                      <div className="text-[11px] text-rose-500 mt-1">Based on avg ~80 bpm</div>
                    </div>
                  </div>

                  {/* Breaths */}
                  <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-100 flex items-start space-x-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-sky-900">
                        {Math.round(ageResult.data.milestones.breathsApprox / 1_000_000).toLocaleString()}M
                      </div>
                      <div className="text-xs text-sky-700 mt-0.5">Estimated Breaths</div>
                      <div className="text-[11px] text-sky-500 mt-1">Based on avg ~16/min</div>
                    </div>
                  </div>

                  {/* Sleep */}
                  <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-indigo-900">
                        {(ageResult.data.milestones.sleepHoursApprox / (24 * 365.25)).toFixed(1)} Yrs
                      </div>
                      <div className="text-xs text-indigo-700 mt-0.5">Approx. Time Asleep</div>
                      <div className="text-[11px] text-indigo-500 mt-1">
                        {ageResult.data.milestones.sleepHoursApprox.toLocaleString()} hours (~8h/day)
                      </div>
                    </div>
                  </div>

                  {/* Next Milestone */}
                  <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-100 flex items-start space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-900">
                        Day {ageResult.data.milestones.nextMilestoneDay.targetDays.toLocaleString()}
                      </div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        In {ageResult.data.milestones.nextMilestoneDay.daysRemaining} days
                      </div>
                      <div className="text-[11px] text-amber-600 mt-1">
                        {ageResult.data.milestones.nextMilestoneDay.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATE DIFFERENCE CALCULATOR */}
      {activeTab === 'difference' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Calculate Duration &amp; Business Days Between Two Dates</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeEndDay}
                  onChange={(e) => setIncludeEndDay(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Include End Day (+1 calendar day)</span>
              </label>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    setEndDateStr(d.toISOString().split('T')[0]);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  +1 Month
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + 1);
                    setEndDateStr(d.toISOString().split('T')[0]);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  +1 Year
                </button>
              </div>
            </div>
          </div>

          {/* Date Difference Results */}
          {diffResult.success && diffResult.data && (
            <div className="space-y-6">
              {/* Duration Hero */}
              <div className="bg-slate-900 rounded-2xl text-white p-8 shadow-sm">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Total Duration
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold mt-2 flex flex-wrap items-baseline gap-3">
                  <span>{diffResult.data.years} Years,</span>
                  <span>{diffResult.data.months} Months,</span>
                  <span>{diffResult.data.days} Days</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Between {startDateStr} and {endDateStr} {includeEndDay ? '(end date included)' : '(end date excluded)'}
                </p>
              </div>

              {/* Working Days vs Weekends Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {diffResult.data.totalDays.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">Total Calendar Days</div>
                </div>

                <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-3xl font-extrabold text-emerald-800">
                    {diffResult.data.businessDays.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1">
                    💼 Working / Business Days (Mon-Fri)
                  </div>
                </div>

                <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200 text-center">
                  <div className="text-3xl font-extrabold text-amber-800">
                    {diffResult.data.weekendDays.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-amber-700 mt-1">
                    🏖️ Weekend Days (Sat-Sun)
                  </div>
                </div>
              </div>

              {/* Extra units */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Converted Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Total Weeks:</span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {diffResult.data.totalWeeks.toLocaleString()} weeks
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Total Hours:</span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {diffResult.data.totalHours.toLocaleString()} hours
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Percent of Year:</span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {((diffResult.data.totalDays / 365.25) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
