'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Home,
  Car,
  User,
  GraduationCap,
  Coins,
  Calendar,
  Percent,
  IndianRupee,
  ArrowRight,
  Download,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Sparkles,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  calculateEmi,
  formatCurrency,
  LOAN_PRESETS,
  LoanType,
  TenureUnit,
  EmiCalculationResult,
} from '@/core/engine/emiCalculatorEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

export function EmiCalculator() {
  const [loanType, setLoanType] = useState<LoanType>('home');
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(5);
  const [tenureUnit, setTenureUnit] = useState<TenureUnit>('years');

  // Input string state to permit clean typing & backspacing
  const [amountStr, setAmountStr] = useState<string>('1000000');
  const [rateStr, setRateStr] = useState<string>('8.5');
  const [tenureStr, setTenureStr] = useState<string>('5');

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [calculatePulse, setCalculatePulse] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Lock desktop viewport scrolling on large screens so the workspace fits in one screen
  useEffect(() => {
    const applyOverflow = () => {
      if (window.innerWidth >= 1024 && !showScheduleModal) {
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
  }, [showScheduleModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showScheduleModal) {
        setShowScheduleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScheduleModal]);

  // Current preset configuration
  const currentPreset = LOAN_PRESETS[loanType];

  // Switch preset
  const handlePresetSelect = (presetId: LoanType) => {
    const preset = LOAN_PRESETS[presetId];
    setLoanType(presetId);
    setLoanAmount(preset.defaultAmount);
    setAmountStr(preset.defaultAmount.toString());
    setInterestRate(preset.defaultRate);
    setRateStr(preset.defaultRate.toString());
    setTenure(preset.defaultTenureYears);
    setTenureStr(preset.defaultTenureYears.toString());
    setTenureUnit('years');
    setExpandedYear(null);
  };

  // Perform calculation live from numeric values
  const result: EmiCalculationResult = useMemo(() => {
    return calculateEmi({
      principal: Math.max(0, loanAmount),
      annualRate: Math.max(0, interestRate),
      tenure: Math.max(1, tenure),
      tenureUnit,
    });
  }, [loanAmount, interestRate, tenure, tenureUnit]);

  // Synchronized Handlers for Amount
  const handleAmountChange = (valStr: string) => {
    setAmountStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0) {
      setLoanAmount(parsed);
    }
  };

  const handleAmountSlider = (val: number) => {
    setLoanAmount(val);
    setAmountStr(val.toString());
  };

  // Synchronized Handlers for Rate
  const handleRateChange = (valStr: string) => {
    setRateStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0) {
      setInterestRate(parsed);
    }
  };

  const handleRateSlider = (val: number) => {
    setInterestRate(val);
    setRateStr(val.toString());
  };

  // Synchronized Handlers for Tenure
  const handleTenureChange = (valStr: string) => {
    setTenureStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setTenure(parsed);
    }
  };

  const handleTenureSlider = (val: number) => {
    setTenure(val);
    setTenureStr(val.toString());
  };

  // Switch Tenure Unit (Years <-> Months)
  const handleToggleTenureUnit = (newUnit: TenureUnit) => {
    if (newUnit === tenureUnit) return;
    if (newUnit === 'months') {
      const newMonths = Math.max(1, Math.round(tenure * 12));
      setTenure(newMonths);
      setTenureStr(newMonths.toString());
    } else {
      const newYears = Math.max(1, Math.round(tenure / 12));
      setTenure(newYears);
      setTenureStr(newYears.toString());
    }
    setTenureUnit(newUnit);
  };

  // Calculate Action Click
  const handleCalculateClick = () => {
    setCalculatePulse(true);
    setTimeout(() => setCalculatePulse(false), 300);
    trackToolEvent('emi-calculator', 'tool_completed');
  };

  // Reset to sensible defaults
  const handleReset = () => {
    setLoanAmount(1000000);
    setAmountStr('1000000');
    setInterestRate(8.5);
    setRateStr('8.5');
    setTenure(5);
    setTenureStr('5');
    setTenureUnit('years');
    setExpandedYear(null);
  };

  // Copy result summary
  const handleCopySummary = () => {
    const summary =
      `Toolino Loan EMI Report:\n` +
      `• Loan Amount: ${formatCurrency(result.principalAmount)}\n` +
      `• Interest Rate: ${interestRate}% p.a.\n` +
      `• Loan Tenure: ${tenure} ${tenureUnit} (${result.totalMonths} months)\n` +
      `• Monthly EMI: ${formatCurrency(result.monthlyEmi)}\n` +
      `• Total Interest: ${formatCurrency(result.totalInterest)}\n` +
      `• Total Repayment: ${formatCurrency(result.totalPayment)}\n` +
      `• Principal: ${result.principalPercentage}% | Interest: ${result.interestPercentage}%`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export Amortization Schedule to CSV
  const handleDownloadCsv = () => {
    let csv = 'Year,Month,Opening Balance,Principal Paid,Interest Paid,EMI Payment,Closing Balance\n';
    result.monthlySchedule.forEach((m) => {
      csv += `${m.year},${m.monthInYear},${m.openingBalance},${m.principalPaid},${m.interestPaid},${m.emi},${m.closingBalance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Toolino_Loan_Amortization_Schedule_${loanType}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick amount presets
  const QUICK_AMOUNTS = [
    { label: '₹5L', value: 500000 },
    { label: '₹10L', value: 1000000 },
    { label: '₹20L', value: 2000000 },
    { label: '₹50L', value: 5000000 },
    { label: '₹1Cr', value: 10000000 },
  ];

  // Quick rate chips
  const QUICK_RATES = [7.5, 8.5, 9.0, 10.5, 12.0];

  // Quick tenure chips
  const QUICK_TENURES = tenureUnit === 'years' ? [3, 5, 10, 15, 20] : [36, 60, 120, 180, 240];

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
            <span className="font-bold text-slate-900">EMI Calculator</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>EMI Calculator</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200/60">
                  v1.0.0
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Calculate your monthly EMI, total interest and total repayment for your loan.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>🔒 Your loan details stay on your device • 100% private</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOAN PRESETS TAB BAR                                                      */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-2 pb-2">
          <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {[
              { id: 'home', label: 'Home Loan', icon: Home },
              { id: 'car', label: 'Car Loan', icon: Car },
              { id: 'personal', label: 'Personal Loan', icon: User },
              { id: 'education', label: 'Education Loan', icon: GraduationCap },
              { id: 'custom', label: 'Other / Custom', icon: Coins },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = loanType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handlePresetSelect(tab.id as LoanType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: TWO-COLUMN LAYOUT (LEFT: INPUTS, RIGHT: RESULTS)          */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-3">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: LOAN DETAILS INPUTS (lg:col-span-6)                        */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0 lg:pr-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    {currentPreset.label} Parameters
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Adjust loan amount, interest rate and tenure to recalculate EMI instantly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Reset to default loan values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* 1. Loan Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="loan-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Loan Amount</span>
                    <span className="text-[11px] font-normal text-slate-400">({formatCurrency(loanAmount)})</span>
                  </label>
                  <div className="relative flex items-center w-36 sm:w-44">
                    <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      id="loan-amount-input"
                      type="number"
                      step={10000}
                      inputMode="decimal"
                      value={amountStr}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="1000000"
                      className="w-full pl-6 pr-3 py-1.5 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Amount Range Slider */}
                <input
                  type="range"
                  min={currentPreset.minAmount}
                  max={currentPreset.maxAmount}
                  step={10000}
                  value={loanAmount}
                  onChange={(e) => handleAmountSlider(Number(e.target.value))}
                  aria-label="Loan Amount Slider"
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>{formatCurrency(currentPreset.minAmount)}</span>
                  <span>{formatCurrency(currentPreset.maxAmount)}</span>
                </div>

                {/* Quick Amount Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {QUICK_AMOUNTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAmountSlider(item.value)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all ${
                        loanAmount === item.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Interest Rate */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="interest-rate-input" className="text-xs font-bold text-slate-700">
                    <span>Annual Interest Rate (% p.a.)</span>
                  </label>
                  <div className="relative flex items-center w-28 sm:w-32">
                    <input
                      id="interest-rate-input"
                      type="number"
                      step={0.1}
                      min={0}
                      max={40}
                      inputMode="decimal"
                      value={rateStr}
                      onChange={(e) => handleRateChange(e.target.value)}
                      placeholder="8.5"
                      className="w-full pl-3 pr-7 py-1.5 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                    />
                    <span className="absolute right-2.5 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>

                {/* Interest Slider */}
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => handleRateSlider(Number(e.target.value))}
                  aria-label="Interest Rate Slider"
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>0%</span>
                  <span>25%</span>
                </div>

                {/* Quick Rate Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {QUICK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRateSlider(rate)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all ${
                        interestRate === rate
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Loan Tenure */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="tenure-input" className="text-xs font-bold text-slate-700">
                    <span>Loan Tenure</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="tenure-input"
                      type="number"
                      step={1}
                      min={1}
                      max={tenureUnit === 'years' ? 40 : 480}
                      inputMode="numeric"
                      value={tenureStr}
                      onChange={(e) => handleTenureChange(e.target.value)}
                      placeholder="5"
                      className="w-20 sm:w-24 px-2.5 py-1.5 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                    />

                    {/* Unit Toggle: Years vs Months */}
                    <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => handleToggleTenureUnit('years')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          tenureUnit === 'years'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Yr
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleTenureUnit('months')}
                        className={`px-2 py-1 rounded-md transition-all ${
                          tenureUnit === 'months'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Mo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tenure Slider */}
                <input
                  type="range"
                  min={1}
                  max={tenureUnit === 'years' ? currentPreset.maxTenureYears : currentPreset.maxTenureYears * 12}
                  step={1}
                  value={tenure}
                  onChange={(e) => handleTenureSlider(Number(e.target.value))}
                  aria-label="Loan Tenure Slider"
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>1 {tenureUnit === 'years' ? 'Year' : 'Month'}</span>
                  <span>
                    {currentPreset.maxTenureYears} {tenureUnit === 'years' ? 'Years' : 'Years (' + currentPreset.maxTenureYears * 12 + ' Mo)'}
                  </span>
                </div>

                {/* Quick Tenure Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {QUICK_TENURES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTenureSlider(t)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all ${
                        tenure === t
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t} {tenureUnit === 'years' ? 'Y' : 'M'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: [ Calculate EMI → ] & [ View Schedule ] */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCalculateClick}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] ${
                    calculatePulse ? 'ring-4 ring-blue-300 scale-[0.99]' : ''
                  }`}
                >
                  <span>Calculate EMI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shrink-0"
                  title="View complete repayment table"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">View Schedule</span>
                  <span className="sm:hidden">Schedule</span>
                </button>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: YOUR EMI RESULTS & BREAKDOWN (lg:col-span-6)              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pl-0 lg:pl-1">
            {/* 1. Primary Monthly EMI Hero Card */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Your Monthly EMI</span>
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                    {formatCurrency(result.monthlyEmi)}
                    <span className="text-sm sm:text-base font-semibold text-blue-200 ml-1.5">/ month</span>
                  </div>
                  <p className="text-xs text-blue-100 font-medium mt-2">
                    For a <strong>{formatCurrency(result.principalAmount)}</strong> loan at{' '}
                    <strong>{interestRate}% p.a.</strong> for <strong>{tenure} {tenureUnit}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow transition-all active:scale-[0.98] self-start sm:self-auto shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '✓ Copied!' : 'Copy Result'}</span>
                </button>
              </div>
            </div>

            {/* 2. Total Interest & Total Repayment Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Interest Payable
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">
                  {formatCurrency(result.totalInterest)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.interestPercentage}% of total payment
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Repayment (P + I)
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(result.totalPayment)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Over {result.totalMonths} monthly installments
                </div>
              </div>
            </div>

            {/* 3. Payment Breakdown Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <span>Payment Breakdown</span>
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>Principal: {result.principalPercentage}%</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Interest: {result.interestPercentage}%</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div
                  style={{ width: `${result.principalPercentage}%` }}
                  className="h-full bg-blue-600 rounded-l-full transition-all duration-300"
                  title={`Principal Amount: ${formatCurrency(result.principalAmount)} (${result.principalPercentage}%)`}
                />
                <div
                  style={{ width: `${result.interestPercentage}%` }}
                  className="h-full bg-amber-500 rounded-r-full transition-all duration-300"
                  title={`Total Interest: ${formatCurrency(result.totalInterest)} (${result.interestPercentage}%)`}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Principal: {formatCurrency(result.principalAmount)}</span>
                <span>Interest: {formatCurrency(result.totalInterest)}</span>
              </div>
            </div>

            {/* 4. Loan Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Loan Summary
                </h3>
                <span className="text-[11px] font-semibold text-blue-600">
                  {LOAN_PRESETS[loanType].label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Principal</span>
                  <span className="font-bold text-slate-800">{formatCurrency(result.principalAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Interest Rate</span>
                  <span className="font-bold text-slate-800">{interestRate}% p.a.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tenure</span>
                  <span className="font-bold text-slate-800">{tenure} {tenureUnit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Monthly EMI</span>
                  <span className="font-bold text-blue-700">{formatCurrency(result.monthlyEmi)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Interest</span>
                  <span className="font-bold text-amber-600">{formatCurrency(result.totalInterest)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Repayment</span>
                  <span className="font-bold text-slate-900">{formatCurrency(result.totalPayment)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AMORTIZATION REPAYMENT SCHEDULE MODAL                                     */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Loan Amortization Repayment Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(result.principalAmount)} at {interestRate}% for {tenure} {tenureUnit} ({result.totalMonths} months)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* View Switcher: Yearly vs Monthly */}
                <div className="bg-slate-200/70 p-0.5 rounded-lg flex text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setScheduleView('yearly')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      scheduleView === 'yearly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleView('monthly')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      scheduleView === 'monthly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Export CSV button */}
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Download complete schedule as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* Close Modal button */}
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
                  title="Close schedule modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
              {scheduleView === 'yearly' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left text-slate-700 min-w-[650px]">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Year</th>
                        <th className="py-2.5 px-3 text-right">Opening Balance</th>
                        <th className="py-2.5 px-3 text-right">Principal Paid</th>
                        <th className="py-2.5 px-3 text-right">Interest Paid</th>
                        <th className="py-2.5 px-3 text-right">Total Payment</th>
                        <th className="py-2.5 px-3 text-right">Closing Balance</th>
                        <th className="py-2.5 px-3 text-center">Months</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.yearlySchedule.map((row) => {
                        const isExpanded = expandedYear === row.year;
                        return (
                          <React.Fragment key={row.year}>
                            <tr className="hover:bg-slate-50/70 transition-colors font-medium">
                              <td className="py-2.5 px-3 font-bold text-slate-900">Year {row.year}</td>
                              <td className="py-2.5 px-3 text-right">{formatCurrency(row.openingBalance)}</td>
                              <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">
                                {formatCurrency(row.principalPaid)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-amber-700">
                                {formatCurrency(row.interestPaid)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {formatCurrency(row.totalPayment)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold">
                                {formatCurrency(row.closingBalance)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExpandedYear(isExpanded ? null : row.year)}
                                  className="p-1 rounded-md hover:bg-slate-200/60 text-slate-500 transition-colors"
                                  title="Toggle monthly breakdown"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Collapsible Monthly Nested Rows */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 bg-blue-50/40">
                                  <div className="p-3 space-y-1.5">
                                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                                      Year {row.year} Monthly Breakdown
                                    </p>
                                    <div className="overflow-x-auto rounded-lg border border-blue-200/60 bg-white">
                                      <table className="w-full text-[11px] text-left text-slate-600 min-w-[550px]">
                                        <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                                          <tr>
                                            <th className="py-1.5 px-2.5">Month</th>
                                            <th className="py-1.5 px-2.5 text-right">Opening</th>
                                            <th className="py-1.5 px-2.5 text-right">Principal</th>
                                            <th className="py-1.5 px-2.5 text-right">Interest</th>
                                            <th className="py-1.5 px-2.5 text-right">EMI</th>
                                            <th className="py-1.5 px-2.5 text-right">Closing</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {row.monthlyBreakdown.map((m) => (
                                            <tr key={m.month} className="hover:bg-slate-50">
                                              <td className="py-1 px-2.5 font-semibold text-slate-800">
                                                M{m.monthInYear} (Month {m.month})
                                              </td>
                                              <td className="py-1 px-2.5 text-right">{formatCurrency(m.openingBalance)}</td>
                                              <td className="py-1 px-2.5 text-right text-blue-600 font-medium">
                                                {formatCurrency(m.principalPaid)}
                                              </td>
                                              <td className="py-1 px-2.5 text-right text-amber-600">
                                                {formatCurrency(m.interestPaid)}
                                              </td>
                                              <td className="py-1 px-2.5 text-right font-bold text-slate-900">
                                                {formatCurrency(m.emi)}
                                              </td>
                                              <td className="py-1 px-2.5 text-right">{formatCurrency(m.closingBalance)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {scheduleView === 'monthly' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left text-slate-700 min-w-[650px]">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                      <tr>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3 text-right">Opening Balance</th>
                        <th className="py-2.5 px-3 text-right">Principal Paid</th>
                        <th className="py-2.5 px-3 text-right">Interest Paid</th>
                        <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                        <th className="py-2.5 px-3 text-right">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.monthlySchedule.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50/70 transition-colors font-medium">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            Month {row.month} (Yr {row.year})
                          </td>
                          <td className="py-2 px-3 text-right">{formatCurrency(row.openingBalance)}</td>
                          <td className="py-2 px-3 text-right text-blue-700 font-semibold">
                            {formatCurrency(row.principalPaid)}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-700">
                            {formatCurrency(row.interestPaid)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(row.emi)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">
                            {formatCurrency(row.closingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Total Payments: {result.totalMonths} months ({result.yearlySchedule.length} years)</span>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
