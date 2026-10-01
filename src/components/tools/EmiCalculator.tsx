'use client';

import React, { useState, useMemo } from 'react';
import {
  Home,
  Car,
  User,
  GraduationCap,
  Coins,
  Calculator,
  Calendar,
  Percent,
  IndianRupee,
  PieChart,
  ArrowRight,
  Download,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  calculateEmi,
  formatCurrency,
  LOAN_PRESETS,
  LoanType,
  TenureUnit,
  EmiCalculationResult,
} from '@/core/engine/emiCalculatorEngine';

export function EmiCalculator() {
  const [loanType, setLoanType] = useState<LoanType>('home');
  const [loanAmount, setLoanAmount] = useState<number>(LOAN_PRESETS.home.defaultAmount);
  const [interestRate, setInterestRate] = useState<number>(LOAN_PRESETS.home.defaultRate);
  const [tenure, setTenure] = useState<number>(LOAN_PRESETS.home.defaultTenureYears);
  const [tenureUnit, setTenureUnit] = useState<TenureUnit>('years');
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Switch preset
  const handlePresetSelect = (presetId: LoanType) => {
    const preset = LOAN_PRESETS[presetId];
    setLoanType(presetId);
    setLoanAmount(preset.defaultAmount);
    setInterestRate(preset.defaultRate);
    setTenure(preset.defaultTenureYears);
    setTenureUnit('years');
    setExpandedYear(null);
  };

  // Perform calculation
  const result: EmiCalculationResult = useMemo(() => {
    return calculateEmi({
      principal: loanAmount,
      annualRate: interestRate,
      tenure,
      tenureUnit,
    });
  }, [loanAmount, interestRate, tenure, tenureUnit]);

  // Copy loan summary
  const handleCopySummary = () => {
    const summary = `Toolino EMI Calculation Summary:
• Loan Type: ${LOAN_PRESETS[loanType].label}
• Loan Amount: ${formatCurrency(result.principalAmount)}
• Interest Rate: ${interestRate}% p.a.
• Loan Tenure: ${tenure} ${tenureUnit} (${result.totalMonths} months)
• Monthly EMI: ${formatCurrency(result.monthlyEmi)}
• Total Interest Payable: ${formatCurrency(result.totalInterest)}
• Total Amount Payable: ${formatCurrency(result.totalPayment)}
• Principal Ratio: ${result.principalPercentage}% | Interest Ratio: ${result.interestPercentage}%`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download Amortization Schedule as CSV
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

  // Reset to current preset defaults
  const handleReset = () => {
    const preset = LOAN_PRESETS[loanType];
    setLoanAmount(preset.defaultAmount);
    setInterestRate(preset.defaultRate);
    setTenure(preset.defaultTenureYears);
    setTenureUnit('years');
  };

  // Preset loan amount quick buttons
  const QUICK_AMOUNTS = [
    { label: '₹5L', value: 500000 },
    { label: '₹10L', value: 1000000 },
    { label: '₹25L', value: 2500000 },
    { label: '₹50L', value: 5000000 },
    { label: '₹1Cr', value: 10000000 },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* LOAN TYPE PRESET TABS                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 justify-center sm:justify-start">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CALCULATOR INTERFACE (2 COLUMNS: INPUTS + RESULTS)      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Sliders & Number Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {LOAN_PRESETS[loanType].label} Parameters
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {LOAN_PRESETS[loanType].description}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
              title="Reset to default values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Loan Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Loan Amount</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={loanAmount || ''}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-40 sm:w-48 pl-7 pr-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={10000}
              max={loanType === 'home' ? 30000000 : 10000000}
              step={10000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setLoanAmount(item.value)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    loanAmount === item.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Interest Rate Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Interest Rate (% per annum)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.1}
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-28 sm:w-32 pr-7 pl-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                />
                <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={25}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick rate chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[7.5, 8.5, 9.0, 10.5, 12.0, 14.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setInterestRate(rate)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    interestRate === rate
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* 3. Loan Tenure Input & Unit Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Loan Tenure</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={tenureUnit === 'years' ? 40 : 480}
                  value={tenure || ''}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-24 sm:w-28 px-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                />
                {/* Years vs Months toggle */}
                <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex text-xs font-bold">
                  <button
                    onClick={() => {
                      if (tenureUnit !== 'years') {
                        setTenure(Math.max(1, Math.round(tenure / 12)));
                        setTenureUnit('years');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      tenureUnit === 'years'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    onClick={() => {
                      if (tenureUnit !== 'months') {
                        setTenure(Math.max(1, tenure * 12));
                        setTenureUnit('months');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      tenureUnit === 'months'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={1}
              max={tenureUnit === 'years' ? 30 : 360}
              step={1}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick tenure chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(tenureUnit === 'years' ? [3, 5, 10, 15, 20, 25, 30] : [12, 24, 36, 60, 120, 240]).map(
                (val) => (
                  <button
                    key={val}
                    onClick={() => setTenure(val)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      tenure === val
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {val} {tenureUnit === 'years' ? 'Years' : 'Months'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live EMI Results Card & Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-950/20 space-y-6 relative overflow-hidden">
            {/* Background glow decoration */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  Monthly Repayment
                </span>
                <button
                  onClick={handleCopySummary}
                  className="text-xs text-blue-200 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
                  title="Copy calculation summary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Big Monthly EMI Display */}
              <div>
                <p className="text-xs font-medium text-blue-200">Equated Monthly Installment (EMI)</p>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-1 text-white">
                  {formatCurrency(result.monthlyEmi)}
                </div>
                <p className="text-[11px] text-blue-300 mt-1">
                  for {result.totalMonths} continuous monthly cycles
                </p>
              </div>

              <div className="h-px bg-white/10" />

              {/* Detailed Breakdown Metrics */}
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs">Principal Amount:</span>
                  <span className="font-bold text-white">{formatCurrency(result.principalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs">Total Interest Payable:</span>
                  <span className="font-bold text-amber-300">{formatCurrency(result.totalInterest)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-blue-100 font-semibold text-xs">Total Amount (Principal + Interest):</span>
                  <span className="font-extrabold text-white text-base">
                    {formatCurrency(result.totalPayment)}
                  </span>
                </div>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-blue-300">Principal: {result.principalPercentage}%</span>
                  <span className="text-amber-300">Interest: {result.interestPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-1">
                  <div
                    style={{ width: `${result.principalPercentage}%` }}
                    className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    title={`Principal: ${result.principalPercentage}%`}
                  />
                  <div
                    style={{ width: `${result.interestPercentage}%` }}
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    title={`Interest: ${result.interestPercentage}%`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Reducing-Balance Math</p>
              <p className="text-[11px] leading-relaxed">
                With reducing-balance calculations, monthly interest is calculated only on the remaining balance. Over time, your interest share shrinks while your principal repayment share expands.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPLETE AMORTIZATION REPAYMENT SCHEDULE                      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Amortization Repayment Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your month-by-month and year-by-year loan repayment progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher: Yearly vs Monthly */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex text-xs font-bold">
              <button
                onClick={() => setScheduleView('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  scheduleView === 'yearly'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly View
              </button>
              <button
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  scheduleView === 'monthly'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly View
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              title="Download schedule in CSV format"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* YEARLY VIEW TABLE                                           */}
        {/* ----------------------------------------------------------- */}
        {scheduleView === 'yearly' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4 text-right">Opening Balance</th>
                  <th className="py-3 px-4 text-right">Principal Paid</th>
                  <th className="py-3 px-4 text-right">Interest Paid</th>
                  <th className="py-3 px-4 text-right">Total Payment</th>
                  <th className="py-3 px-4 text-right">Closing Balance</th>
                  <th className="py-3 px-4 text-center">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.yearlySchedule.map((row) => {
                  const isExpanded = expandedYear === row.year;
                  return (
                    <React.Fragment key={row.year}>
                      <tr className="hover:bg-slate-50/70 transition-colors font-medium">
                        <td className="py-3 px-4 font-bold text-slate-900">Year {row.year}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.openingBalance)}</td>
                        <td className="py-3 px-4 text-right text-blue-700 font-semibold">
                          {formatCurrency(row.principalPaid)}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-700">
                          {formatCurrency(row.interestPaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(row.totalPayment)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(row.closingBalance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setExpandedYear(isExpanded ? null : row.year)}
                            className="p-1 rounded-md hover:bg-slate-200/60 text-slate-500 transition-colors"
                            title="Expand monthly breakdown"
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
                            <div className="p-4 space-y-2">
                              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                                Year {row.year} Monthly Detailed Breakdown
                              </p>
                              <div className="overflow-x-auto rounded-xl border border-blue-200/60 bg-white">
                                <table className="w-full text-[11px] text-left text-slate-600 min-w-[550px]">
                                  <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200">
                                    <tr>
                                      <th className="py-2 px-3">Month</th>
                                      <th className="py-2 px-3 text-right">Opening</th>
                                      <th className="py-2 px-3 text-right">Principal</th>
                                      <th className="py-2 px-3 text-right">Interest</th>
                                      <th className="py-2 px-3 text-right">EMI</th>
                                      <th className="py-2 px-3 text-right">Closing</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.monthlyBreakdown.map((m) => (
                                      <tr key={m.month} className="hover:bg-slate-50">
                                        <td className="py-1.5 px-3 font-semibold text-slate-800">
                                          M{m.monthInYear} (Month {m.month})
                                        </td>
                                        <td className="py-1.5 px-3 text-right">
                                          {formatCurrency(m.openingBalance)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right text-blue-600 font-medium">
                                          {formatCurrency(m.principalPaid)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right text-amber-600">
                                          {formatCurrency(m.interestPaid)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                          {formatCurrency(m.emi)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right">
                                          {formatCurrency(m.closingBalance)}
                                        </td>
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

        {/* ----------------------------------------------------------- */}
        {/* MONTHLY VIEW TABLE                                          */}
        {/* ----------------------------------------------------------- */}
        {scheduleView === 'monthly' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px]">
            <table className="w-full text-xs text-left text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Opening Balance</th>
                  <th className="py-3 px-4 text-right">Principal Paid</th>
                  <th className="py-3 px-4 text-right">Interest Paid</th>
                  <th className="py-3 px-4 text-right">Monthly EMI</th>
                  <th className="py-3 px-4 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.monthlySchedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/70 transition-colors font-medium">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      Month {row.month} (Yr {row.year})
                    </td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(row.openingBalance)}</td>
                    <td className="py-2.5 px-4 text-right text-blue-700 font-semibold">
                      {formatCurrency(row.principalPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-amber-700">
                      {formatCurrency(row.interestPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(row.emi)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      {formatCurrency(row.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
