'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Percent,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Tag,
  Receipt,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Minus,
  AlertCircle,
} from 'lucide-react';
import {
  calculateXPercentOfY,
  calculateXIsWhatPercentOfY,
  calculatePercentageChange,
  calculateDiscount,
  calculateTip,
  calculateMarginMarkup,
  BasicPercentageResult,
  PercentOfResult,
  PercentageChangeResult,
  DiscountResult,
  TipResult,
  MarginMarkupResult,
} from '@/core/engine/percentageCalculatorEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

type CalculatorMode = 'basic' | 'percentOf' | 'change' | 'discount' | 'tip' | 'margin';

/**
 * Formats a clean floating-point or integer number without scientific notation or trailing zeroes.
 */
function formatCleanNumber(num: number, maxDecimals = 4): string {
  if (!isFinite(num)) return '0';
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

/**
 * Formats a currency value with 2 decimal places.
 */
function formatCurrency(num: number): string {
  if (!isFinite(num)) return '$0.00';
  return (
    (num < 0 ? '-$' : '$') +
    Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function PercentageCalculator() {
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [copied, setCopied] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [calculatePulse, setCalculatePulse] = useState<boolean>(false);

  // 1. Basic: What is X% of Y?
  const [basicX, setBasicX] = useState<string>('20');
  const [basicY, setBasicY] = useState<string>('500');

  // 2. Percent Of: X is what % of Y?
  const [ofX, setOfX] = useState<string>('100');
  const [ofY, setOfY] = useState<string>('500');

  // 3. Percentage Change: from Original to New
  const [fromVal, setFromVal] = useState<string>('500');
  const [toVal, setToVal] = useState<string>('650');

  // 4. Discount & Sales Tax
  const [originalPrice, setOriginalPrice] = useState<string>('120');
  const [discountPercent, setDiscountPercent] = useState<string>('25');
  const [taxPercent, setTaxPercent] = useState<string>('8');

  // 5. Tip & Split
  const [billAmount, setBillAmount] = useState<string>('95');
  const [tipPercent, setTipPercent] = useState<string>('18');
  const [splitCount, setSplitCount] = useState<string>('3');

  // 6. Margin & Markup
  const [costPrice, setCostPrice] = useState<string>('60');
  const [sellingPrice, setSellingPrice] = useState<string>('100');

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

  // Quick Preset arrays
  const BASIC_PRESETS = [10, 15, 20, 25, 50, 75];
  const TIP_PRESETS = [10, 15, 18, 20, 25];
  const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  // Mode 1: What is X% of Y?
  const basicResult = useMemo((): { success: boolean; data?: BasicPercentageResult; error?: string } => {
    if (basicX.trim() === '' || basicY.trim() === '') {
      return { success: false, error: 'Enter a percentage and value to calculate.' };
    }
    const numX = parseFloat(basicX);
    const numY = parseFloat(basicY);
    if (isNaN(numX) || isNaN(numY)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    try {
      const res = calculateXPercentOfY(numX, numY);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [basicX, basicY]);

  // Mode 2: X is what % of Y?
  const ofResult = useMemo((): { success: boolean; data?: PercentOfResult; error?: string } => {
    if (ofX.trim() === '' || ofY.trim() === '') {
      return { success: false, error: 'Enter part and whole values to calculate.' };
    }
    const numX = parseFloat(ofX);
    const numY = parseFloat(ofY);
    if (isNaN(numX) || isNaN(numY)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    if (numY === 0) {
      return { success: false, error: 'This calculation requires the second value (whole) to be non-zero.' };
    }
    try {
      const res = calculateXIsWhatPercentOfY(numX, numY);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [ofX, ofY]);

  // Mode 3: Percentage Increase / Decrease
  const changeResult = useMemo((): { success: boolean; data?: PercentageChangeResult; error?: string } => {
    if (fromVal.trim() === '' || toVal.trim() === '') {
      return { success: false, error: 'Enter original and new values to calculate.' };
    }
    const numFrom = parseFloat(fromVal);
    const numTo = parseFloat(toVal);
    if (isNaN(numFrom) || isNaN(numTo)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    if (numFrom === 0) {
      return { success: false, error: 'Original value cannot be zero when calculating percentage change.' };
    }
    try {
      const res = calculatePercentageChange(numFrom, numTo);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [fromVal, toVal]);

  // Mode 4: Discount & Tax
  const discountResult = useMemo((): { success: boolean; data?: DiscountResult; error?: string } => {
    if (originalPrice.trim() === '' || discountPercent.trim() === '') {
      return { success: false, error: 'Enter original price and discount percentage.' };
    }
    const numPrice = parseFloat(originalPrice);
    const numDisc = parseFloat(discountPercent);
    const numTax = taxPercent.trim() === '' ? 0 : parseFloat(taxPercent);
    if (isNaN(numPrice) || isNaN(numDisc) || isNaN(numTax)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    try {
      const res = calculateDiscount(numPrice, numDisc, numTax);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [originalPrice, discountPercent, taxPercent]);

  // Mode 5: Tip & Bill Split
  const tipResult = useMemo((): { success: boolean; data?: TipResult; error?: string } => {
    if (billAmount.trim() === '' || tipPercent.trim() === '') {
      return { success: false, error: 'Enter bill amount and tip percentage.' };
    }
    const numBill = parseFloat(billAmount);
    const numTip = parseFloat(tipPercent);
    const numSplit = splitCount.trim() === '' ? 1 : Math.max(1, parseInt(splitCount, 10));
    if (isNaN(numBill) || isNaN(numTip) || isNaN(numSplit)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    try {
      const res = calculateTip(numBill, numTip, numSplit);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [billAmount, tipPercent, splitCount]);

  // Mode 6: Margin & Markup
  const marginResult = useMemo((): { success: boolean; data?: MarginMarkupResult; error?: string } => {
    if (costPrice.trim() === '' || sellingPrice.trim() === '') {
      return { success: false, error: 'Enter cost of goods and selling price.' };
    }
    const numCost = parseFloat(costPrice);
    const numSell = parseFloat(sellingPrice);
    if (isNaN(numCost) || isNaN(numSell)) {
      return { success: false, error: 'Please enter valid numeric values.' };
    }
    try {
      const res = calculateMarginMarkup(numCost, numSell);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [costPrice, sellingPrice]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const triggerCalculate = () => {
    setCalculatePulse(true);
    setTimeout(() => setCalculatePulse(false), 300);
    trackToolEvent('percentage-calculator', 'tool_completed');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerCalculate();
    }
  };

  const handleReset = () => {
    switch (mode) {
      case 'basic':
        setBasicX('20');
        setBasicY('500');
        break;
      case 'percentOf':
        setOfX('100');
        setOfY('500');
        break;
      case 'change':
        setFromVal('500');
        setToVal('650');
        break;
      case 'discount':
        setOriginalPrice('120');
        setDiscountPercent('25');
        setTaxPercent('8');
        break;
      case 'tip':
        setBillAmount('95');
        setTipPercent('18');
        setSplitCount('3');
        break;
      case 'margin':
        setCostPrice('60');
        setSellingPrice('100');
        break;
    }
    setShowSteps(false);
  };

  const handleCopyCurrent = () => {
    let copyText = '';

    if (mode === 'basic' && basicResult.success && basicResult.data) {
      copyText = `${basicX}% of ${basicY} = ${formatCleanNumber(basicResult.data.value)}`;
    } else if (mode === 'percentOf' && ofResult.success && ofResult.data) {
      copyText = `${ofX} is ${formatCleanNumber(ofResult.data.percent)}% of ${ofY}`;
    } else if (mode === 'change' && changeResult.success && changeResult.data) {
      const d = changeResult.data;
      const sign = d.changePercent > 0 ? '+' : '';
      const diffSign = d.type === 'increase' ? '+' : d.type === 'decrease' ? '-' : '';
      copyText =
        `Original: ${fromVal}\n` +
        `New: ${toVal}\n` +
        `Difference: ${diffSign}${formatCleanNumber(d.absoluteDifference)}\n` +
        `Percentage ${d.type === 'increase' ? 'Increase' : d.type === 'decrease' ? 'Decrease' : 'Change'}: ${sign}${formatCleanNumber(d.changePercent)}%`;
    } else if (mode === 'discount' && discountResult.success && discountResult.data) {
      const d = discountResult.data;
      copyText =
        `Original Price: ${formatCurrency(d.originalPrice)}\n` +
        `Discount: ${d.discountPercent}% (-${formatCurrency(d.discountAmount)})\n` +
        `Pre-Tax Price: ${formatCurrency(d.discountedPrice)}\n` +
        `Sales Tax (${d.taxPercent}%): +${formatCurrency(d.taxAmount)}\n` +
        `Final Price: ${formatCurrency(d.finalPrice)}`;
    } else if (mode === 'tip' && tipResult.success && tipResult.data) {
      const d = tipResult.data;
      copyText =
        `Bill Amount: ${formatCurrency(d.billAmount)}\n` +
        `Tip (${d.tipPercent}%): ${formatCurrency(d.tipAmount)}\n` +
        `Grand Total: ${formatCurrency(d.totalAmount)}\n` +
        (d.splitCount > 1
          ? `Split Between: ${d.splitCount} people (${formatCurrency(d.totalPerPerson)} each, includes ${formatCurrency(d.tipPerPerson)} tip)`
          : '');
    } else if (mode === 'margin' && marginResult.success && marginResult.data) {
      const d = marginResult.data;
      copyText =
        `Cost of Goods: ${formatCurrency(d.cost)}\n` +
        `Selling Price: ${formatCurrency(d.sellingPrice)}\n` +
        `Gross Profit: ${formatCurrency(d.profit)}\n` +
        `Profit Margin: ${formatCleanNumber(d.marginPercent, 2)}%\n` +
        `Markup: ${formatCleanNumber(d.markupPercent, 2)}%`;
    }

    if (copyText) {
      navigator.clipboard.writeText(copyText);
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
            <span className="font-bold text-slate-900">Percentage Calculator</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Percentage Calculator</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200/60">
                  v1.0.0
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Calculate percentages, percentage changes, increases and decreases quickly and easily.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>🔒 Calculations stay on your device • 100% private</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CALCULATION TYPE SELECTOR BAR                                             */}
        {/* ========================================================================= */}
        <div className="shrink-0 pt-2 pb-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              What do you want to calculate?
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* Mode 1 */}
            <button
              onClick={() => {
                setMode('basic');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'basic'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>What is X% of Y?</span>
            </button>

            {/* Mode 2 */}
            <button
              onClick={() => {
                setMode('percentOf');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'percentOf'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>X is what % of Y?</span>
            </button>

            {/* Mode 3 */}
            <button
              onClick={() => {
                setMode('change');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'change'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Percentage Increase / Decrease</span>
            </button>

            {/* Mode 4 */}
            <button
              onClick={() => {
                setMode('discount');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'discount'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Discount &amp; Tax</span>
            </button>

            {/* Mode 5 */}
            <button
              onClick={() => {
                setMode('tip');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'tip'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tip &amp; Split</span>
            </button>

            {/* Mode 6 */}
            <button
              onClick={() => {
                setMode('margin');
                setShowSteps(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'margin'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Margin &amp; Markup</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: TWO-COLUMN LAYOUT (LEFT: INPUTS, RIGHT: RESULT)           */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-3">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: NATURAL-LANGUAGE INPUTS & ACTIONS (lg:col-span-5)           */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pr-0 lg:pr-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {mode === 'basic' && <Percent className="w-4 h-4" />}
                    {mode === 'percentOf' && <HelpCircle className="w-4 h-4" />}
                    {mode === 'change' && <TrendingUp className="w-4 h-4" />}
                    {mode === 'discount' && <Tag className="w-4 h-4" />}
                    {mode === 'tip' && <Receipt className="w-4 h-4" />}
                    {mode === 'margin' && <DollarSign className="w-4 h-4" />}
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">
                      {mode === 'basic' && 'Calculate Percentage of a Value'}
                      {mode === 'percentOf' && 'Calculate Proportion as a Percentage'}
                      {mode === 'change' && 'Calculate Increase or Decrease'}
                      {mode === 'discount' && 'Retail Discount & Sales Tax'}
                      {mode === 'tip' && 'Restaurant Tip & Bill Split'}
                      {mode === 'margin' && 'Profit Margin & Markup'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {mode === 'basic' && 'Find what any percentage of a number equals.'}
                      {mode === 'percentOf' && 'Find what percentage one number represents of another.'}
                      {mode === 'change' && 'Compare original and new values to see change.'}
                      {mode === 'discount' && 'Calculate final sale prices with optional sales tax.'}
                      {mode === 'tip' && 'Compute dining gratuity and per-person cost.'}
                      {mode === 'margin' && 'Analyze gross profit, profit margin, and markup.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ---------------- MODE 1: WHAT IS X% OF Y? ---------------- */}
              {mode === 'basic' && (
                <div className="space-y-4">
                  {/* Natural sentence input representation */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                    <span className="text-xs font-semibold text-slate-500">Natural Sentence Formula:</span>
                    <div className="flex flex-wrap items-center gap-2 text-slate-800 text-sm font-medium">
                      <span>What is</span>
                      <div className="relative inline-block w-24">
                        <input
                          id="basic-x-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={basicX}
                          onChange={(e) => setBasicX(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="20"
                          aria-label="Percentage value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                      <span className="font-bold text-slate-700">% of</span>
                      <div className="relative inline-block w-28">
                        <input
                          id="basic-y-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={basicY}
                          onChange={(e) => setBasicY(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="500"
                          aria-label="Total value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                      <span className="font-bold text-slate-700">?</span>
                    </div>
                  </div>

                  {/* Percentage preset chips */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Quick Percentage Shortcuts:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {BASIC_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setBasicX(p.toString())}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            basicX === p.toString()
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Common Examples:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { x: '20', y: '500', label: '20% of 500' },
                        { x: '15', y: '200', label: '15% of 200' },
                        { x: '25', y: '800', label: '25% of 800' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setBasicX(item.x);
                            setBasicY(item.y);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 2: X IS WHAT % OF Y? ---------------- */}
              {mode === 'percentOf' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                    <span className="text-xs font-semibold text-slate-500">Natural Sentence Formula:</span>
                    <div className="flex flex-wrap items-center gap-2 text-slate-800 text-sm font-medium">
                      <div className="relative inline-block w-24">
                        <input
                          id="of-x-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={ofX}
                          onChange={(e) => setOfX(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="100"
                          aria-label="Part value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                      <span className="font-bold text-slate-700">is what % of</span>
                      <div className="relative inline-block w-28">
                        <input
                          id="of-y-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={ofY}
                          onChange={(e) => setOfY(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="500"
                          aria-label="Whole total value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                      <span className="font-bold text-slate-700">?</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Part Value (X)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={ofX}
                        onChange={(e) => setOfX(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="100"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Total / Whole Value (Y)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={ofY}
                        onChange={(e) => setOfY(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="500"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Common Examples:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { x: '100', y: '500', label: '100 of 500 (20%)' },
                        { x: '45', y: '180', label: '45 of 180 (25%)' },
                        { x: '250', y: '1000', label: '250 of 1,000 (25%)' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setOfX(item.x);
                            setOfY(item.y);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 3: PERCENTAGE INCREASE / DECREASE ---------------- */}
              {mode === 'change' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                    <span className="text-xs font-semibold text-slate-500">Natural Sentence Comparison:</span>
                    <div className="flex flex-wrap items-center gap-2 text-slate-800 text-sm font-medium">
                      <span>From Original</span>
                      <div className="relative inline-block w-24">
                        <input
                          id="change-from-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={fromVal}
                          onChange={(e) => setFromVal(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="500"
                          aria-label="Original value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                      <span className="font-bold text-slate-700">to New</span>
                      <div className="relative inline-block w-24">
                        <input
                          id="change-to-input"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={toVal}
                          onChange={(e) => setToVal(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="650"
                          aria-label="New value"
                          className="w-full px-2.5 py-1.5 text-center text-base font-bold bg-white rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Original Value
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={fromVal}
                        onChange={(e) => setFromVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="500"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        New Value
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={toVal}
                        onChange={(e) => setToVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="650"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Common Scenarios:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { from: '500', to: '650', label: '500 → 650 (+30% increase)' },
                        { from: '500', to: '400', label: '500 → 400 (-20% decrease)' },
                        { from: '100', to: '125', label: '100 → 125 (+25% increase)' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFromVal(item.from);
                            setToVal(item.to);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 4: DISCOUNT & TAX ---------------- */}
              {mode === 'discount' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Original Price ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="120"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Discount Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="25"
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Sales Tax (%) Optional
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="8"
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Popular Discount Presets:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DISCOUNT_PRESETS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiscountPercent(d.toString())}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            discountPercent === d.toString()
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {d}% off
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 5: TIP & SPLIT ---------------- */}
              {mode === 'tip' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Bill Amount ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="95"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Tip Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={tipPercent}
                          onChange={(e) => setTipPercent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="18"
                          className="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Split Between (People)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={splitCount}
                        onChange={(e) => setSplitCount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="3"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Standard Gratuity:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {TIP_PRESETS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipPercent(t.toString())}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            tipPercent === t.toString()
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {t}% tip
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODE 6: MARGIN & MARKUP ---------------- */}
              {mode === 'margin' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Cost of Goods ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="60"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Selling Price / Revenue ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="100"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: [ Calculate → ] and [ Reset ] */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerCalculate}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] ${
                    calculatePulse ? 'ring-4 ring-blue-300 scale-[0.99]' : ''
                  }`}
                >
                  <span>Calculate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: HERO RESULT CARD & DETAILS (lg:col-span-7)                */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 lg:overflow-y-auto pl-0 lg:pl-1">
            {/* ---------------- MODE 1 RESULT ---------------- */}
            {mode === 'basic' && (
              <div className="space-y-3">
                {basicResult.success && basicResult.data ? (
                  <>
                    {/* Hero Result Card */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Calculation Result</span>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {formatCleanNumber(basicResult.data.value)}
                          </div>
                          <p className="text-sm text-blue-100 font-medium mt-2">
                            <strong>{basicX}%</strong> of <strong>{basicY}</strong> ={' '}
                            <strong className="underline underline-offset-2">
                              {formatCleanNumber(basicResult.data.value)}
                            </strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Result'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Breakdown Accordion */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowSteps(!showSteps)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                          <span>Show Calculation &amp; Steps</span>
                        </span>
                        {showSteps ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {showSteps && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2 text-xs text-slate-600 bg-slate-50/50">
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold">
                            {basicResult.data.formula}
                          </div>
                          <ol className="list-decimal list-inside space-y-1 pl-1">
                            {basicResult.data.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {basicResult.error || 'Enter values to see calculation'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Fill in the percentage and value fields on the left to instantly compute the answer.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE 2 RESULT ---------------- */}
            {mode === 'percentOf' && (
              <div className="space-y-3">
                {ofResult.success && ofResult.data ? (
                  <>
                    <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Calculated Percentage</span>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {formatCleanNumber(ofResult.data.percent)}%
                          </div>
                          <p className="text-sm text-indigo-100 font-medium mt-2">
                            <strong>{ofX}</strong> is{' '}
                            <strong className="underline underline-offset-2">
                              {formatCleanNumber(ofResult.data.percent)}%
                            </strong>{' '}
                            of <strong>{ofY}</strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-800 hover:bg-indigo-50 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Result'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visual Proportion Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Proportion of Total ({ofY})</span>
                        <span className="font-bold text-indigo-600">{formatCleanNumber(ofResult.data.percent)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, ofResult.data.percent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Steps Accordion */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowSteps(!showSteps)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Show Calculation &amp; Steps</span>
                        </span>
                        {showSteps ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {showSteps && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2 text-xs text-slate-600 bg-slate-50/50">
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold">
                            {ofResult.data.formula}
                          </div>
                          <ol className="list-decimal list-inside space-y-1 pl-1">
                            {ofResult.data.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {ofResult.error || 'Enter values to see percentage'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Fill in the part and total values on the left to see what percentage it represents.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE 3 RESULT ---------------- */}
            {mode === 'change' && (
              <div className="space-y-3">
                {changeResult.success && changeResult.data ? (
                  <>
                    <div
                      className={`rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden ${
                        changeResult.data.type === 'increase'
                          ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800'
                          : changeResult.data.type === 'decrease'
                          ? 'bg-gradient-to-br from-rose-600 via-red-700 to-rose-800'
                          : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
                      }`}
                    >
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            {changeResult.data.type === 'increase' && <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />}
                            {changeResult.data.type === 'decrease' && <TrendingDown className="w-3.5 h-3.5 text-rose-200" />}
                            {changeResult.data.type === 'no-change' && <Minus className="w-3.5 h-3.5 text-slate-300" />}
                            <span>
                              {changeResult.data.type === 'increase' && '📈 Percentage Increase'}
                              {changeResult.data.type === 'decrease' && '📉 Percentage Decrease'}
                              {changeResult.data.type === 'no-change' && 'No Change'}
                            </span>
                          </div>

                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {changeResult.data.changePercent > 0 ? '+' : ''}
                            {formatCleanNumber(changeResult.data.changePercent)}%
                          </div>

                          <p className="text-sm text-white/90 font-medium mt-2">
                            {changeResult.data.type === 'increase' && (
                              <>
                                Increase of <strong>+{formatCleanNumber(changeResult.data.absoluteDifference)}</strong>{' '}
                                from {fromVal} to {toVal}
                              </>
                            )}
                            {changeResult.data.type === 'decrease' && (
                              <>
                                Decrease of <strong>-{formatCleanNumber(changeResult.data.absoluteDifference)}</strong>{' '}
                                from {fromVal} to {toVal}
                              </>
                            )}
                            {changeResult.data.type === 'no-change' && (
                              <>Original and new values are equal ({fromVal})</>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Result'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Original</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">{fromVal}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">New</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">{toVal}</div>
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-center shadow-sm ${
                          changeResult.data.type === 'increase'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : changeResult.data.type === 'decrease'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">Difference</div>
                        <div className="text-base font-black mt-0.5">
                          {changeResult.data.type === 'increase' ? '+' : changeResult.data.type === 'decrease' ? '-' : ''}
                          {formatCleanNumber(changeResult.data.absoluteDifference)}
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-center shadow-sm ${
                          changeResult.data.type === 'increase'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : changeResult.data.type === 'decrease'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">Percent Change</div>
                        <div className="text-base font-black mt-0.5">
                          {changeResult.data.changePercent > 0 ? '+' : ''}
                          {formatCleanNumber(changeResult.data.changePercent)}%
                        </div>
                      </div>
                    </div>

                    {/* Steps Accordion */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowSteps(!showSteps)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-teal-600" />
                          <span>Show Calculation &amp; Steps</span>
                        </span>
                        {showSteps ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {showSteps && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2 text-xs text-slate-600 bg-slate-50/50">
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold">
                            {changeResult.data.formula}
                          </div>
                          <ol className="list-decimal list-inside space-y-1 pl-1">
                            {changeResult.data.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {changeResult.error || 'Enter values to see percentage change'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Fill in the initial and new values on the left to see the difference and percentage change.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE 4 RESULT ---------------- */}
            {mode === 'discount' && (
              <div className="space-y-3">
                {discountResult.success && discountResult.data ? (
                  <>
                    <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-green-800 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            <Tag className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Final Checkout Price</span>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {formatCurrency(discountResult.data.finalPrice)}
                          </div>
                          <p className="text-sm text-emerald-100 font-medium mt-2">
                            You save <strong>{formatCurrency(discountResult.data.totalSaved)}</strong> (
                            {discountResult.data.discountPercent}% off)
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Summary'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Original Price</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">
                          {formatCurrency(discountResult.data.originalPrice)}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-emerald-700">Discount ({discountResult.data.discountPercent}%)</div>
                        <div className="text-base font-black text-emerald-700 mt-0.5">
                          -{formatCurrency(discountResult.data.discountAmount)}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Pre-Tax Price</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">
                          {formatCurrency(discountResult.data.discountedPrice)}
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-amber-700">Sales Tax ({discountResult.data.taxPercent}%)</div>
                        <div className="text-base font-black text-amber-700 mt-0.5">
                          +{formatCurrency(discountResult.data.taxAmount)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {discountResult.error || 'Enter values to compute discount'}
                    </h3>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE 5 RESULT ---------------- */}
            {mode === 'tip' && (
              <div className="space-y-3">
                {tipResult.success && tipResult.data ? (
                  <>
                    <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            <Receipt className="w-3.5 h-3.5 text-blue-200" />
                            <span>{tipResult.data.splitCount > 1 ? 'Total Per Person' : 'Grand Total With Tip'}</span>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {formatCurrency(tipResult.data.totalPerPerson)}
                          </div>
                          <p className="text-sm text-blue-100 font-medium mt-2">
                            {tipResult.data.splitCount > 1 ? (
                              <>
                                Split among <strong>{tipResult.data.splitCount} people</strong> (includes{' '}
                                {formatCurrency(tipResult.data.tipPerPerson)} tip each)
                              </>
                            ) : (
                              <>
                                Bill: {formatCurrency(tipResult.data.billAmount)} + Tip: {formatCurrency(tipResult.data.tipAmount)}
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Summary'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Bill Amount</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">
                          {formatCurrency(tipResult.data.billAmount)}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-blue-700">Tip ({tipResult.data.tipPercent}%)</div>
                        <div className="text-base font-black text-blue-700 mt-0.5">
                          {formatCurrency(tipResult.data.tipAmount)}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Grand Total</div>
                        <div className="text-base font-black text-slate-800 mt-0.5">
                          {formatCurrency(tipResult.data.totalAmount)}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-purple-700">Per Person Total</div>
                        <div className="text-base font-black text-purple-700 mt-0.5">
                          {formatCurrency(tipResult.data.totalPerPerson)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {tipResult.error || 'Enter values to compute tip'}
                    </h3>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- MODE 6 RESULT ---------------- */}
            {mode === 'margin' && (
              <div className="space-y-3">
                {marginResult.success && marginResult.data ? (
                  <>
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm mb-2">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Gross Profit</span>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight">
                            {formatCurrency(marginResult.data.profit)}
                          </div>
                          <p className="text-sm text-slate-300 font-medium mt-2">
                            Profit Margin: <strong>{formatCleanNumber(marginResult.data.marginPercent, 2)}%</strong> • Markup:{' '}
                            <strong>{formatCleanNumber(marginResult.data.markupPercent, 2)}%</strong>
                          </p>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyCurrent}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow transition-all active:scale-[0.98]"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? '✓ Copied!' : 'Copy Summary'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Gross Profit ($)</div>
                        <div className="text-xl font-black text-slate-800 mt-0.5">
                          {formatCurrency(marginResult.data.profit)}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-emerald-700">Profit Margin (Profit ÷ Revenue)</div>
                        <div className="text-xl font-black text-emerald-800 mt-0.5">
                          {formatCleanNumber(marginResult.data.marginPercent, 2)}%
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-center shadow-sm">
                        <div className="text-xs font-semibold text-indigo-700">Markup (Profit ÷ Cost)</div>
                        <div className="text-xl font-black text-indigo-800 mt-0.5">
                          {formatCleanNumber(marginResult.data.markupPercent, 2)}%
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {marginResult.error || 'Enter cost and sell price'}
                    </h3>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
