'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Layers,
  Search,
  RotateCcw,
  Percent,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  calculateStandardDiscount,
  calculateStackedDiscounts,
  calculateFindPercent,
  calculateReverseDiscount,
  calculateFixedOff,
  formatDiscountCurrency,
  DiscountMode,
  StandardDiscountResult,
  StackedDiscountResult,
  FindPercentResult,
  ReverseDiscountResult,
  FixedOffResult,
} from '@/core/engine/discountCalculatorEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

export function DiscountCalculator() {
  const [mode, setMode] = useState<DiscountMode>('standard');
  const [copied, setCopied] = useState<boolean>(false);
  const [calculatePulse, setCalculatePulse] = useState<boolean>(false);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  // 1. Standard Mode State (strings for natural typing)
  const [stdOriginalStr, setStdOriginalStr] = useState<string>('2000');
  const [stdDiscountStr, setStdDiscountStr] = useState<string>('20');
  const [stdIncludeTax, setStdIncludeTax] = useState<boolean>(false);
  const [stdTaxStr, setStdTaxStr] = useState<string>('18');
  const [stdQuantityStr, setStdQuantityStr] = useState<string>('1');

  // 2. Fixed Off State
  const [fixedOriginalStr, setFixedOriginalStr] = useState<string>('2500');
  const [fixedAmountStr, setFixedAmountStr] = useState<string>('500');
  const [fixedQtyStr, setFixedQtyStr] = useState<string>('1');

  // 3. Stacked Discounts State
  const [stackedOriginalStr, setStackedOriginalStr] = useState<string>('10000');
  const [stackedDiscounts, setStackedDiscounts] = useState<number[]>([20, 10]);

  // 4. Find Discount % State (Original vs Sale Price)
  const [findOriginalStr, setFindOriginalStr] = useState<string>('1000');
  const [findSaleStr, setFindSaleStr] = useState<string>('800');

  // 5. Reverse Mode State (Sale Price + Discount % -> Original)
  const [revSaleStr, setRevSaleStr] = useState<string>('1600');
  const [revDiscountStr, setRevDiscountStr] = useState<string>('20');

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

  // Quick preset shortcuts
  const QUICK_PERCENT_PRESETS = [10, 20, 25, 30, 40, 50];
  const QUICK_TAX_PRESETS = [5, 12, 18, 28];

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  // Mode 1: Standard
  const standardResult: StandardDiscountResult = useMemo(() => {
    const orig = parseFloat(stdOriginalStr) || 0;
    const disc = parseFloat(stdDiscountStr) || 0;
    const tax = stdIncludeTax ? parseFloat(stdTaxStr) || 0 : 0;
    const qty = parseInt(stdQuantityStr, 10) || 1;

    return calculateStandardDiscount({
      originalPrice: Math.max(0, orig),
      discountPercent: Math.max(0, Math.min(100, disc)),
      taxPercent: Math.max(0, tax),
      quantity: Math.max(1, qty),
    });
  }, [stdOriginalStr, stdDiscountStr, stdIncludeTax, stdTaxStr, stdQuantityStr]);

  // Mode 2: Fixed Off
  const fixedResult: FixedOffResult = useMemo(() => {
    const orig = parseFloat(fixedOriginalStr) || 0;
    const amt = parseFloat(fixedAmountStr) || 0;
    const qty = parseInt(fixedQtyStr, 10) || 1;

    return calculateFixedOff({
      originalPrice: Math.max(0, orig),
      discountAmount: Math.max(0, amt),
      quantity: Math.max(1, qty),
    });
  }, [fixedOriginalStr, fixedAmountStr, fixedQtyStr]);

  // Mode 3: Stacked
  const stackedResult: StackedDiscountResult = useMemo(() => {
    const orig = parseFloat(stackedOriginalStr) || 0;
    return calculateStackedDiscounts(Math.max(0, orig), stackedDiscounts);
  }, [stackedOriginalStr, stackedDiscounts]);

  // Mode 4: Find %
  const findResult: FindPercentResult = useMemo(() => {
    const orig = parseFloat(findOriginalStr) || 0;
    const sale = parseFloat(findSaleStr) || 0;
    return calculateFindPercent({
      originalPrice: Math.max(0, orig),
      salePrice: Math.max(0, sale),
    });
  }, [findOriginalStr, findSaleStr]);

  // Mode 5: Reverse
  const reverseResult: ReverseDiscountResult = useMemo(() => {
    const sale = parseFloat(revSaleStr) || 0;
    const disc = parseFloat(revDiscountStr) || 0;
    return calculateReverseDiscount({
      salePrice: Math.max(0, sale),
      discountPercent: Math.max(0, disc),
    });
  }, [revSaleStr, revDiscountStr]);

  // Action Click
  const handleCalculateClick = () => {
    setCalculatePulse(true);
    setTimeout(() => setCalculatePulse(false), 300);
    trackToolEvent('discount-calculator', 'tool_completed');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculateClick();
    }
  };

  // Reset to sensible defaults
  const handleReset = () => {
    switch (mode) {
      case 'standard':
        setStdOriginalStr('2000');
        setStdDiscountStr('20');
        setStdIncludeTax(false);
        setStdTaxStr('18');
        setStdQuantityStr('1');
        break;
      case 'fixedOff':
        setFixedOriginalStr('2500');
        setFixedAmountStr('500');
        setFixedQtyStr('1');
        break;
      case 'stacked':
        setStackedOriginalStr('10000');
        setStackedDiscounts([20, 10]);
        break;
      case 'findPercent':
        setFindOriginalStr('1000');
        setFindSaleStr('800');
        break;
      case 'reverse':
        setRevSaleStr('1600');
        setRevDiscountStr('20');
        break;
    }
    setShowFormula(false);
  };

  // Copy current result summary
  const handleCopySummary = () => {
    let text = '';
    if (mode === 'standard') {
      text =
        `Toolino Discount Report:\n` +
        `• Original Price: ${formatDiscountCurrency(standardResult.totalOriginalPrice)}\n` +
        `• Discount: ${standardResult.discountPercent}%\n` +
        `• You Save: ${formatDiscountCurrency(standardResult.totalSavings)}\n` +
        `• Price After Discount: ${formatDiscountCurrency(standardResult.discountedPrice * standardResult.quantity)}\n` +
        (standardResult.taxPercent > 0
          ? `• GST/Tax (${standardResult.taxPercent}%): +${formatDiscountCurrency(standardResult.taxAmount * standardResult.quantity)}\n`
          : '') +
        `• Final Price: ${formatDiscountCurrency(standardResult.totalFinalPrice)}`;
    } else if (mode === 'fixedOff') {
      text =
        `Toolino Discount Report:\n` +
        `• Original Price: ${formatDiscountCurrency(fixedResult.totalOriginal)}\n` +
        `• Flat Discount: -${formatDiscountCurrency(fixedResult.discountAmount * fixedResult.quantity)}\n` +
        `• You Save: ${formatDiscountCurrency(fixedResult.totalSavings)} (${fixedResult.effectivePercent.toFixed(1)}% off)\n` +
        `• Final Price: ${formatDiscountCurrency(fixedResult.totalFinal)}`;
    } else if (mode === 'stacked') {
      text =
        `Toolino Stacked Discount Report:\n` +
        `• Original Price: ${formatDiscountCurrency(stackedResult.originalPrice)}\n` +
        `• Sequential Discounts: ${stackedDiscounts.join('% then ')}%\n` +
        `• Total Saved: ${formatDiscountCurrency(stackedResult.totalSavings)}\n` +
        `• Effective Total Discount: ${stackedResult.effectiveDiscountPercent}%\n` +
        `• Final Price: ${formatDiscountCurrency(stackedResult.finalPrice)}`;
    } else if (mode === 'findPercent') {
      text =
        `Toolino Discount Analysis:\n` +
        `• Original Tag Price: ${formatDiscountCurrency(findResult.originalPrice)}\n` +
        `• Sale Price: ${formatDiscountCurrency(findResult.salePrice)}\n` +
        `• Discount: ${findResult.discountPercent.toFixed(2)}%\n` +
        `• You Save: ${formatDiscountCurrency(findResult.discountAmount)}`;
    } else if (mode === 'reverse') {
      text =
        `Toolino Reverse Discount Report:\n` +
        `• Sale Price Paid: ${formatDiscountCurrency(reverseResult.salePrice)}\n` +
        `• Discount Given: ${reverseResult.discountPercent}%\n` +
        `• Original List Price: ${formatDiscountCurrency(reverseResult.originalPrice)}\n` +
        `• Total Savings: ${formatDiscountCurrency(reverseResult.savings)}`;
    }

    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            <span className="font-bold text-slate-900">Discount Calculator</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Discount Calculator</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200/60">
                  v1.0.0
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Calculate your discount, savings and final price instantly.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>🔒 Calculations stay on your device • 100% private</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE SELECTOR TABS                                                        */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-2 pb-2">
          <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {[
              { id: 'standard', label: 'Discount %', icon: Tag },
              { id: 'fixedOff', label: 'Discount Amount (₹ Off)', icon: DollarSign },
              { id: 'stacked', label: 'Stacked Discounts', icon: Layers },
              { id: 'findPercent', label: 'Find Discount %', icon: Search },
              { id: 'reverse', label: 'Reverse Calculator', icon: RotateCcw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMode(tab.id as DiscountMode);
                    setShowFormula(false);
                  }}
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
          {/* LEFT COLUMN: ENTER DETAILS (lg:col-span-5)                              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0 lg:pr-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    {mode === 'standard' && 'Enter Price & Discount'}
                    {mode === 'fixedOff' && 'Enter Flat Cash Off Details'}
                    {mode === 'stacked' && 'Enter Stacked Sequential Discounts'}
                    {mode === 'findPercent' && 'Find Discount % from Price'}
                    {mode === 'reverse' && 'Find Original Pre-Sale Price'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {mode === 'standard' && 'Simple percentage markdown with optional GST/tax.'}
                    {mode === 'fixedOff' && 'Flat amount deducted directly from item price.'}
                    {mode === 'stacked' && 'Multiple sequential discounts applied in steps.'}
                    {mode === 'findPercent' && 'Calculate percentage saved from original and sale prices.'}
                    {mode === 'reverse' && 'Determine original tag price from the discounted total.'}
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

              {/* ---------------- MODE 1: STANDARD DISCOUNT ---------------- */}
              {mode === 'standard' && (
                <div className="space-y-3.5">
                  {/* Original Price */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="std-original" className="text-xs font-bold text-slate-700">
                        Original Price
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatDiscountCurrency(parseFloat(stdOriginalStr) || 0)}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="std-original"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={stdOriginalStr}
                        onChange={(e) => setStdOriginalStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="2000"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Discount Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="std-discount" className="text-xs font-bold text-slate-700">
                        Discount Percentage
                      </label>
                      <span className="text-[11px] font-bold text-blue-600">
                        {parseFloat(stdDiscountStr) || 0}% OFF
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="std-discount"
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        inputMode="decimal"
                        value={stdDiscountStr}
                        onChange={(e) => setStdDiscountStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="20"
                        className="w-full pl-3 pr-7 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                      />
                      <span className="absolute right-3 text-slate-400 font-bold text-xs">%</span>
                    </div>

                    {/* Quick Percentage Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {QUICK_PERCENT_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setStdDiscountStr(p.toString())}
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-all ${
                            stdDiscountStr === p.toString()
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Tax / GST Toggle & Fields */}
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={stdIncludeTax}
                        onChange={(e) => setStdIncludeTax(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">Add Tax / GST after discount</span>
                    </label>

                    {stdIncludeTax && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <label htmlFor="std-tax" className="text-xs font-semibold text-slate-600">
                            GST / Tax Rate (%)
                          </label>
                          <div className="relative flex items-center w-28">
                            <input
                              id="std-tax"
                              type="number"
                              min={0}
                              max={100}
                              step="any"
                              inputMode="decimal"
                              value={stdTaxStr}
                              onChange={(e) => setStdTaxStr(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="18"
                              className="w-full pr-6 pl-2 py-1 text-right font-black text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <span className="absolute right-2 text-slate-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        {/* Quick Tax Chips */}
                        <div className="flex gap-1.5">
                          {QUICK_TAX_PRESETS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setStdTaxStr(t.toString())}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                                stdTaxStr === t.toString()
                                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {t}% GST
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- MODE 2: FIXED CASH OFF ---------------- */}
              {mode === 'fixedOff' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="fixed-original" className="text-xs font-bold text-slate-700">
                      Original Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="fixed-original"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={fixedOriginalStr}
                        onChange={(e) => setFixedOriginalStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="2500"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="fixed-amount" className="text-xs font-bold text-slate-700">
                      Discount Amount (₹ Off)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="fixed-amount"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={fixedAmountStr}
                        onChange={(e) => setFixedAmountStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="500"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 3: STACKED DISCOUNTS ---------------- */}
              {mode === 'stacked' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="stacked-original" className="text-xs font-bold text-slate-700">
                      Original Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="stacked-original"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={stackedOriginalStr}
                        onChange={(e) => setStackedOriginalStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="10000"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Discounts Sequence
                      </span>
                      {stackedDiscounts.length < 4 && (
                        <button
                          type="button"
                          onClick={() => setStackedDiscounts([...stackedDiscounts, 10])}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Step</span>
                        </button>
                      )}
                    </div>

                    {stackedDiscounts.map((val, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <span className="text-xs font-semibold text-slate-700">
                          {idx === 0 ? 'First Discount' : `Discount #${idx + 1}`}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center w-24">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="any"
                              inputMode="decimal"
                              value={val}
                              onChange={(e) => {
                                const updated = [...stackedDiscounts];
                                updated[idx] = parseFloat(e.target.value) || 0;
                                setStackedDiscounts(updated);
                              }}
                              className="w-full pr-6 pl-2 py-1 text-right font-black text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <span className="absolute right-2 text-slate-400 font-bold text-xs">%</span>
                          </div>

                          {stackedDiscounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = stackedDiscounts.filter((_, i) => i !== idx);
                                setStackedDiscounts(updated);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Remove step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------- MODE 4: FIND DISCOUNT % ---------------- */}
              {mode === 'findPercent' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="find-orig" className="text-xs font-bold text-slate-700">
                      Original Tag Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="find-orig"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={findOriginalStr}
                        onChange={(e) => setFindOriginalStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="1000"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="find-sale" className="text-xs font-bold text-slate-700">
                      Actual Sale / Checkout Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="find-sale"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={findSaleStr}
                        onChange={(e) => setFindSaleStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="800"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 5: REVERSE DISCOUNT ---------------- */}
              {mode === 'reverse' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label htmlFor="rev-sale" className="text-xs font-bold text-slate-700">
                      Sale Price Paid
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        id="rev-sale"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={revSaleStr}
                        onChange={(e) => setRevSaleStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="1600"
                        className="w-full pl-7 pr-3 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="rev-disc" className="text-xs font-bold text-slate-700">
                      Discount Percentage Applied
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="rev-disc"
                        type="number"
                        min={0}
                        max={99.9}
                        step="any"
                        inputMode="decimal"
                        value={revDiscountStr}
                        onChange={(e) => setRevDiscountStr(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="20"
                        className="w-full pl-3 pr-7 py-2 text-right font-black text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      />
                      <span className="absolute right-3 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Actions: [ Calculate Discount → ] & [ Reset ] */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCalculateClick}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] ${
                    calculatePulse ? 'ring-4 ring-blue-300 scale-[0.99]' : ''
                  }`}
                >
                  <span>Calculate Discount</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: RESULTS & BREAKDOWN (lg:col-span-7)                       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pl-0 lg:pl-1">
            {/* ---------------- MODE 1: STANDARD RESULT ---------------- */}
            {mode === 'standard' && (
              <div className="space-y-3">
                {/* Hero Result Card: FINAL PRICE IS THE STRONGEST VISUAL ELEMENT */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                        <Tag className="w-3 h-3 text-emerald-300" />
                        <span>Final Payable Price</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight">
                        {formatDiscountCurrency(standardResult.totalFinalPrice)}
                      </div>
                      <p className="text-sm text-emerald-300 font-semibold mt-2">
                        You save {formatDiscountCurrency(standardResult.totalSavings)} with a{' '}
                        {standardResult.discountPercent}% discount
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

                {/* Savings & Comparison Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Original Price
                    </div>
                    <div className="text-base font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(standardResult.totalOriginalPrice)}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      You Save ({standardResult.discountPercent}%)
                    </div>
                    <div className="text-base font-black text-emerald-700 mt-1">
                      -{formatDiscountCurrency(standardResult.totalSavings)}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      After Discount
                    </div>
                    <div className="text-base font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(standardResult.discountedPrice * standardResult.quantity)}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      GST/Tax ({standardResult.taxPercent}%)
                    </div>
                    <div className="text-base font-black text-amber-700 mt-1">
                      +{formatDiscountCurrency(standardResult.taxAmount * standardResult.quantity)}
                    </div>
                  </div>
                </div>

                {/* Savings Proportion Bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">Payment Breakdown</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-blue-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                        <span>You Pay: {Math.max(0, 100 - standardResult.discountPercent)}%</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>You Save: {standardResult.discountPercent}%</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                    <div
                      style={{ width: `${Math.max(0, 100 - standardResult.discountPercent)}%` }}
                      className="h-full bg-blue-600 rounded-l-full transition-all duration-300"
                    />
                    <div
                      style={{ width: `${standardResult.discountPercent}%` }}
                      className="h-full bg-emerald-500 rounded-r-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Optional Formula Accordion */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFormula(!showFormula)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>How it is calculated</span>
                    </span>
                    {showFormula ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {showFormula && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 bg-slate-50/50">
                      <p>
                        <strong>1. Discount Amount:</strong> {formatDiscountCurrency(standardResult.totalOriginalPrice)} ×{' '}
                        {standardResult.discountPercent}% ={' '}
                        <strong className="text-emerald-700">
                          {formatDiscountCurrency(standardResult.totalSavings)}
                        </strong>
                      </p>
                      <p>
                        <strong>2. Discounted Price:</strong> {formatDiscountCurrency(standardResult.totalOriginalPrice)} −{' '}
                        {formatDiscountCurrency(standardResult.totalSavings)} ={' '}
                        <strong>
                          {formatDiscountCurrency(standardResult.discountedPrice * standardResult.quantity)}
                        </strong>
                      </p>
                      {standardResult.taxPercent > 0 && (
                        <p>
                          <strong>3. Sales Tax ({standardResult.taxPercent}%):</strong>{' '}
                          {formatDiscountCurrency(standardResult.discountedPrice * standardResult.quantity)} ×{' '}
                          {standardResult.taxPercent}% ={' '}
                          <strong className="text-amber-700">
                            +{formatDiscountCurrency(standardResult.taxAmount * standardResult.quantity)}
                          </strong>{' '}
                          → Final: <strong>{formatDiscountCurrency(standardResult.totalFinalPrice)}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- MODE 2: FIXED CASH OFF RESULT ---------------- */}
            {mode === 'fixedOff' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                        <Tag className="w-3 h-3 text-emerald-300" />
                        <span>Final Price</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight">
                        {formatDiscountCurrency(fixedResult.totalFinal)}
                      </div>
                      <p className="text-sm text-emerald-300 font-semibold mt-2">
                        You save {formatDiscountCurrency(fixedResult.totalSavings)} (
                        {fixedResult.effectivePercent.toFixed(1)}% off)
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Original Price</div>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(fixedResult.totalOriginal)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-emerald-700">Flat Discount</div>
                    <div className="text-lg font-black text-emerald-700 mt-1">
                      -{formatDiscountCurrency(fixedResult.totalSavings)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Effective Discount</div>
                    <div className="text-lg font-black text-blue-700 mt-1">
                      {fixedResult.effectivePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- MODE 3: STACKED DISCOUNTS RESULT ---------------- */}
            {mode === 'stacked' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                        <Layers className="w-3 h-3 text-indigo-300" />
                        <span>Effective Stacked Price</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight">
                        {formatDiscountCurrency(stackedResult.finalPrice)}
                      </div>
                      <p className="text-sm text-emerald-300 font-semibold mt-2">
                        Total Saved: {formatDiscountCurrency(stackedResult.totalSavings)} (
                        {stackedResult.effectiveDiscountPercent}% total effective discount)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow transition-all active:scale-[0.98] self-start sm:self-auto shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '✓ Copied!' : 'Copy Result'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Step-by-Step Amortization:
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {stackedResult.steps.map((st) => (
                      <div
                        key={st.stepIndex}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700">
                          Step {st.stepIndex}: <strong>-{st.discountPercent}%</strong> off{' '}
                          {formatDiscountCurrency(st.startingPrice)} (save {formatDiscountCurrency(st.savingsInStep)})
                        </span>
                        <span className="font-bold text-blue-700">
                          → {formatDiscountCurrency(st.endingPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- MODE 4: FIND DISCOUNT % RESULT ---------------- */}
            {mode === 'findPercent' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                        <Search className="w-3 h-3 text-amber-300" />
                        <span>Calculated Discount</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight">
                        {findResult.discountPercent.toFixed(2)}%
                      </div>
                      <p className="text-sm text-emerald-300 font-semibold mt-2">
                        {findResult.isPriceIncrease
                          ? `Price increased by ${formatDiscountCurrency(findResult.discountAmount)}`
                          : `You save ${formatDiscountCurrency(findResult.discountAmount)} off the tag price`}
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Original Tag Price</div>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(findResult.originalPrice)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Actual Sale Price</div>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(findResult.salePrice)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- MODE 5: REVERSE DISCOUNT RESULT ---------------- */}
            {mode === 'reverse' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                        <RotateCcw className="w-3 h-3 text-amber-300" />
                        <span>Original List Price</span>
                      </div>
                      <div className="text-4xl sm:text-5xl font-black tracking-tight">
                        {formatDiscountCurrency(reverseResult.originalPrice)}
                      </div>
                      <p className="text-sm text-emerald-300 font-semibold mt-2">
                        Total discount deducted: {formatDiscountCurrency(reverseResult.savings)} (
                        {reverseResult.discountPercent}%)
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Sale Price Paid</div>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      {formatDiscountCurrency(reverseResult.salePrice)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center shadow-sm">
                    <div className="text-[11px] font-bold uppercase text-emerald-700">Savings Deducted</div>
                    <div className="text-lg font-black text-emerald-700 mt-1">
                      {formatDiscountCurrency(reverseResult.savings)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
