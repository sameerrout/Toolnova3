'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Minus,
  Percent,
  Copy,
  Check,
  RotateCcw,
  Building2,
  Globe2,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  calculateGst,
  formatGstCurrency,
  CONFIGURABLE_GST_RATES,
  GstCalculationMode,
  GstTransactionType,
  GstCalculationResult,
} from '@/core/engine/gstCalculatorEngine';

export function GstCalculator() {
  const [mode, setMode] = useState<GstCalculationMode>('addGst');
  const [transactionType, setTransactionType] = useState<GstTransactionType>('intraState');
  const [amountStr, setAmountStr] = useState<string>('10000');
  const [gstRateStr, setGstRateStr] = useState<string>('18');
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [calculatePulse, setCalculatePulse] = useState<boolean>(false);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  // Lock desktop viewport scrolling on large screens to fit SaaS single-viewport requirement
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

  // Helper to parse numeric string safely
  const parseNum = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[₹,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const parsedAmount = useMemo(() => parseNum(amountStr), [amountStr]);
  const parsedRate = useMemo(() => parseNum(gstRateStr), [gstRateStr]);

  // Validation
  const validationError = useMemo(() => {
    if (amountStr.trim() === '') {
      return 'Enter an amount to continue.';
    }
    const val = parseFloat(amountStr.replace(/[₹,\s]/g, ''));
    if (isNaN(val) || val < 0) {
      return 'Please enter a valid, positive amount.';
    }
    if (parsedRate < 0 || parsedRate > 100) {
      return 'Please enter a valid GST rate between 0% and 100%.';
    }
    return null;
  }, [amountStr, parsedRate]);

  // Calculation Result
  const result: GstCalculationResult = useMemo(() => {
    return calculateGst({
      amount: parsedAmount,
      rate: parsedRate,
      mode,
      transactionType,
    });
  }, [parsedAmount, parsedRate, mode, transactionType]);

  // Quick Amount presets
  const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

  // Presets from engine
  const handleSelectRatePreset = (rate: number) => {
    setIsCustomRate(false);
    setGstRateStr(rate.toString());
  };

  const handleCustomRateClick = () => {
    setIsCustomRate(true);
  };

  // Find description for currently selected rate
  const currentRateDesc = useMemo(() => {
    const matched = CONFIGURABLE_GST_RATES.find((r) => r.rate === parsedRate);
    if (matched) return matched.categoryDesc;
    return 'Custom user-specified tax rate';
  }, [parsedRate]);

  // Copy structured summary
  const handleCopySummary = () => {
    const isAdd = mode === 'addGst';
    const lines = [
      'Toolino GST Calculation Summary:',
      `• Calculation Type: ${isAdd ? 'Add GST (Exclusive)' : 'Remove GST (Inclusive)'}`,
      `• Transaction Territory: ${transactionType === 'intraState' ? 'Intra-State (Within Same State)' : 'Inter-State (Across States)'}`,
      `• ${isAdd ? 'Pre-Tax Taxable Base' : 'Total Invoice (Gross)'}: ${formatGstCurrency(result.inputAmount)}`,
      `• GST Rate: ${result.gstRate}%`,
    ];

    if (result.transactionType === 'intraState') {
      lines.push(`• Central GST (CGST ${result.cgstRate}%): ${formatGstCurrency(result.cgstAmount)}`);
      lines.push(`• State GST (SGST ${result.sgstRate}%): ${formatGstCurrency(result.sgstAmount)}`);
    } else {
      lines.push(`• Integrated GST (IGST ${result.igstRate}%): ${formatGstCurrency(result.igstAmount)}`);
    }

    lines.push(`• Total GST Tax: ${formatGstCurrency(result.totalGstAmount)}`);
    lines.push(`• ${isAdd ? 'Final Invoice Total' : 'Net Taxable Base'}: ${formatGstCurrency(isAdd ? result.totalAmount : result.baseAmount)}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset to clean defaults
  const handleReset = () => {
    setMode('addGst');
    setTransactionType('intraState');
    setAmountStr('10000');
    setGstRateStr('18');
    setIsCustomRate(false);
    setShowFormula(false);
  };

  // Trigger button action
  const handleCalculateClick = () => {
    setCalculatePulse(true);
    setTimeout(() => setCalculatePulse(false), 400);
  };

  return (
    <div className="w-full bg-slate-50 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden">
      {/* Main Responsive Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex-1 flex flex-col min-h-0">
        
        {/* ========================================================================= */}
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge                          */}
        {/* ========================================================================= */}
        <div className="shrink-0 space-y-1.5 pb-2 border-b border-slate-200/80">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/utility-tools" className="hover:text-blue-600 transition-colors">
              Calculators
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">GST Calculator</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>GST Calculator</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200/60">
                  v1.0.0
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Calculate GST, CGST, SGST, IGST and the final amount quickly and accurately.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>🔒 Calculations stay on your device • 100% private</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE SELECTOR: WHAT DO YOU WANT TO CALCULATE?                             */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-2 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 px-2 hidden md:inline">
                What do you want to calculate?
              </span>
              <button
                type="button"
                onClick={() => setMode('addGst')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'addGst'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add GST (Exclusive)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('removeGst')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'removeGst'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Remove GST (Inclusive)</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 px-2 font-medium hidden sm:block">
              {mode === 'addGst'
                ? 'Adds GST on top of net taxable base'
                : 'Extracts pre-tax base & GST from gross total'}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: TWO-COLUMN LAYOUT                                         */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-3">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: ENTER DETAILS (lg:col-span-5)                              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0 lg:pr-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span>
                      {mode === 'addGst' ? 'Enter Net Base Amount' : 'Enter Gross (GST-Inclusive) Amount'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {mode === 'addGst'
                      ? 'Calculate GST tax amount and final gross payable total.'
                      : 'Find the original pre-tax price and GST contained in invoice total.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Validation Warning */}
              {validationError && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    {mode === 'addGst' ? 'Amount Before GST' : 'Amount Including GST'}
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {mode === 'addGst' ? 'Net / Taxable' : 'Gross Total'}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-black text-sm select-none">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculateClick()}
                    placeholder="10,000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 font-black text-base sm:text-lg rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                {/* Range Slider for Tactile Scrubbing */}
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={500}
                  value={Math.min(100000, parsedAmount)}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-1"
                />

                {/* Quick Amount Shortcuts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_AMOUNTS.map((val) => {
                    const isSelected = parsedAmount === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountStr(val.toString())}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GST Rate Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                    GST Rate Slab
                  </label>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                    {parsedRate}% Rate Selected
                  </span>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {CONFIGURABLE_GST_RATES.map((slab) => {
                    const isSelected = !isCustomRate && parsedRate === slab.rate;
                    return (
                      <button
                        key={slab.rate}
                        type="button"
                        onClick={() => handleSelectRatePreset(slab.rate)}
                        className={`py-2 px-1 text-center rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-600'
                            : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 font-bold text-xs'
                        }`}
                        title={slab.categoryDesc}
                      >
                        <span className="text-xs">{slab.label}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleCustomRateClick}
                    className={`py-2 px-1 text-center rounded-xl border transition-all ${
                      isCustomRate
                        ? 'border-blue-600 bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700 font-bold text-xs'
                    }`}
                  >
                    <span className="text-xs">Custom</span>
                  </button>
                </div>

                {/* Helpful Category Hint */}
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <span className="font-semibold text-slate-700">Applies to: </span>
                  {currentRateDesc}
                </p>

                {/* Custom Rate Input when Selected */}
                {isCustomRate && (
                  <div className="pt-1 flex items-center justify-between bg-blue-50/50 border border-blue-200 p-2.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-700">Enter Custom GST Rate:</span>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={gstRateStr}
                        onChange={(e) => setGstRateStr(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCalculateClick()}
                        placeholder="18"
                        className="w-24 pr-6 pl-2.5 py-1 text-right font-black text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                      <span className="absolute right-2 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Territory (Intra-state vs Inter-state) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Transaction Territory</span>
                  <span className="text-[10px] text-slate-400 font-medium">Tax Allocation</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Intra-State Option */}
                  <button
                    type="button"
                    onClick={() => setTransactionType('intraState')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      transactionType === 'intraState'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        transactionType === 'intraState' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Within Same State</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Intra-State: CGST ({(parsedRate / 2).toFixed(1)}%) + SGST ({(parsedRate / 2).toFixed(1)}%)
                      </p>
                    </div>
                  </button>

                  {/* Inter-State Option */}
                  <button
                    type="button"
                    onClick={() => setTransactionType('interState')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      transactionType === 'interState'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        transactionType === 'interState' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Different States</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Inter-State: Integrated GST (IGST {parsedRate}%)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleCalculateClick}
                className={`w-full py-3 px-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                  calculatePulse
                    ? 'bg-blue-700 scale-[0.98]'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                <span>Calculate GST</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: MAIN RESULT CARD & BREAKDOWN (lg:col-span-7)              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pl-0 lg:pl-1">
            
            {/* HERO RESULT CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              {/* Subtle decorative gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                    {mode === 'addGst' ? 'Final Invoice Amount' : 'Pre-Tax Base Amount'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      title="Copy calculation summary"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">✓ Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Result</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Dominant Hero Number */}
                <div className="my-2">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {formatGstCurrency(mode === 'addGst' ? result.totalAmount : result.baseAmount)}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {mode === 'addGst'
                        ? `Includes ${result.gstRate}% GST (+${formatGstCurrency(result.totalGstAmount)})`
                        : `Pre-Tax Base (${formatGstCurrency(result.totalGstAmount)} GST removed)`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {transactionType === 'intraState' ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Card Arithmetic Comparison Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                {/* 1. Taxable Base */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {mode === 'addGst' ? 'Taxable Amount' : 'Invoice Total'}
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    {formatGstCurrency(result.inputAmount)}
                  </p>
                </div>

                {/* 2. GST Rate */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    GST Rate
                  </p>
                  <p className="text-sm sm:text-base font-black text-blue-700 mt-0.5">
                    {result.gstRate}%
                  </p>
                </div>

                {/* 3. GST Tax Amount */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {mode === 'addGst' ? 'GST Amount' : 'GST Included'}
                  </p>
                  <p className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
                    {mode === 'addGst' ? '+' : '−'}
                    {formatGstCurrency(result.totalGstAmount)}
                  </p>
                </div>

                {/* 4. Final Amount */}
                <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    {mode === 'addGst' ? 'Final Amount' : 'Net Taxable'}
                  </p>
                  <p className="text-sm sm:text-base font-black text-blue-900 mt-0.5">
                    {formatGstCurrency(mode === 'addGst' ? result.totalAmount : result.baseAmount)}
                  </p>
                </div>
              </div>

              {/* Territory Specific Tax Breakdown (CGST + SGST vs IGST) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    {transactionType === 'intraState' ? (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Intra-State GST Breakdown (50 / 50 Split)</span>
                      </>
                    ) : (
                      <>
                        <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inter-State GST Breakdown (Integrated)</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-bold text-blue-700">
                    Total Tax: {formatGstCurrency(result.totalGstAmount)}
                  </span>
                </div>

                {transactionType === 'intraState' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700">Central GST (CGST)</span>
                        <p className="text-[10px] text-slate-400">{result.cgstRate}% rate</p>
                      </div>
                      <span className="font-black text-slate-900">{formatGstCurrency(result.cgstAmount)}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700">State GST (SGST)</span>
                        <p className="text-[10px] text-slate-400">{result.sgstRate}% rate</p>
                      </div>
                      <span className="font-black text-slate-900">{formatGstCurrency(result.sgstAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="font-bold text-slate-700">Integrated GST (IGST)</span>
                      <p className="text-[10px] text-slate-400">{result.igstRate}% central collection</p>
                    </div>
                    <span className="font-black text-slate-900">{formatGstCurrency(result.igstAmount)}</span>
                  </div>
                )}
              </div>

              {/* Visual Proportion Bar */}
              <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">
                    Net Base Price ({result.basePercentage.toFixed(1)}%)
                  </span>
                  <span className="text-amber-700">
                    GST Tax ({result.taxPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                  <div
                    style={{ width: `${result.basePercentage}%` }}
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    title={`Net Price: ${result.basePercentage.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${result.taxPercentage}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    title={`GST: ${result.taxPercentage.toFixed(1)}%`}
                  />
                </div>
              </div>

              {/* Expandable "How It Is Calculated" Accordion */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormula(!showFormula)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>How it is calculated</span>
                  </span>
                  {showFormula ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFormula && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs text-slate-600 animate-in fade-in duration-200">
                    {mode === 'addGst' ? (
                      <>
                        <p className="font-semibold text-slate-800">
                          1. Calculate GST Amount:
                        </p>
                        <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                          {formatGstCurrency(result.baseAmount)} × {result.gstRate}% = {formatGstCurrency(result.totalGstAmount)} GST
                        </p>
                        <p className="font-semibold text-slate-800">
                          2. Add GST to Base Amount:
                        </p>
                        <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                          {formatGstCurrency(result.baseAmount)} + {formatGstCurrency(result.totalGstAmount)} = {formatGstCurrency(result.totalAmount)} Final Amount
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-800">
                          1. Extract Net Base Amount:
                        </p>
                        <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                          {formatGstCurrency(result.totalAmount)} ÷ (1 + {result.gstRate}/100) = {formatGstCurrency(result.baseAmount)} Net Base
                        </p>
                        <p className="font-semibold text-slate-800">
                          2. Deduce GST Tax Amount:
                        </p>
                        <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                          {formatGstCurrency(result.totalAmount)} − {formatGstCurrency(result.baseAmount)} = {formatGstCurrency(result.totalGstAmount)} GST
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Statutory Note */}
              <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                <span>GST calculated under Indian Goods &amp; Services Tax statutory rules.</span>
                <span className="font-semibold text-slate-500">100% In-Browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
