'use client';

import React, { useState, useMemo } from 'react';
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
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  calculateStandardDiscount,
  calculateStackedDiscounts,
  calculateFindPercent,
  calculateReverseDiscount,
  calculateFixedOff,
  formatDiscountCurrency,
  DiscountMode,
} from '@/core/engine/discountCalculatorEngine';

export function DiscountCalculator() {
  const [mode, setMode] = useState<DiscountMode>('standard');
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Standard Mode State
  const [stdOriginal, setStdOriginal] = useState<number>(5000);
  const [stdDiscount, setStdDiscount] = useState<number>(20);
  const [stdTax, setStdTax] = useState<number>(0);
  const [stdQuantity, setStdQuantity] = useState<number>(1);

  // 2. Stacked Discounts State
  const [stackedOriginal, setStackedOriginal] = useState<number>(10000);
  const [stackedDiscounts, setStackedDiscounts] = useState<number[]>([20, 10]);

  // 3. Find Discount % State (Original vs Sale Price)
  const [findOriginal, setFindOriginal] = useState<number>(1000);
  const [findSale, setFindSale] = useState<number>(800);

  // 4. Reverse Mode State (Sale Price + Discount % -> Original)
  const [revSale, setRevSale] = useState<number>(4000);
  const [revDiscount, setRevDiscount] = useState<number>(20);

  // 5. Fixed Off State
  const [fixedOriginal, setFixedOriginal] = useState<number>(2500);
  const [fixedAmount, setFixedAmount] = useState<number>(500);
  const [fixedQuantity, setFixedQuantity] = useState<number>(1);

  // Memoized Results
  const standardResult = useMemo(() => {
    return calculateStandardDiscount({
      originalPrice: stdOriginal,
      discountPercent: stdDiscount,
      taxPercent: stdTax,
      quantity: stdQuantity,
    });
  }, [stdOriginal, stdDiscount, stdTax, stdQuantity]);

  const stackedResult = useMemo(() => {
    return calculateStackedDiscounts(stackedOriginal, stackedDiscounts);
  }, [stackedOriginal, stackedDiscounts]);

  const findResult = useMemo(() => {
    return calculateFindPercent({
      originalPrice: findOriginal,
      salePrice: findSale,
    });
  }, [findOriginal, findSale]);

  const reverseResult = useMemo(() => {
    return calculateReverseDiscount({
      salePrice: revSale,
      discountPercent: revDiscount,
    });
  }, [revSale, revDiscount]);

  const fixedResult = useMemo(() => {
    return calculateFixedOff({
      originalPrice: fixedOriginal,
      discountAmount: fixedAmount,
      quantity: fixedQuantity,
    });
  }, [fixedOriginal, fixedAmount, fixedQuantity]);

  // Copy helper
  const handleCopySummary = (summaryText: string) => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const QUICK_PERCENT_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50, 70];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* MODE SELECTOR TABS                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 justify-center sm:justify-start">
        {[
          { id: 'standard', label: 'Discount & Final Price', icon: Tag },
          { id: 'stacked', label: 'Stacked / Sequential Discounts', icon: Layers },
          { id: 'findPercent', label: 'Find Discount %', icon: Search },
          { id: 'reverse', label: 'Reverse Calculator', icon: RotateCcw },
          { id: 'fixedOff', label: 'Flat / Cash Off', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as DiscountMode)}
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
      {/* MODE 1: STANDARD DISCOUNT                                     */}
      {/* ------------------------------------------------------------- */}
      {mode === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Standard Percentage Discount</span>
            </h3>

            {/* Original Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Original Price
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={stdOriginal || ''}
                    onChange={(e) => setStdOriginal(Number(e.target.value))}
                    className="w-36 sm:w-44 pl-7 pr-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={50}
                value={stdOriginal}
                onChange={(e) => setStdOriginal(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Discount Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Discount Percentage
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={stdDiscount || ''}
                    onChange={(e) => setStdDiscount(Number(e.target.value))}
                    className="w-24 sm:w-28 pr-7 pl-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                  />
                  <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={stdDiscount}
                onChange={(e) => setStdDiscount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PERCENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setStdDiscount(p)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      stdDiscount === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Tax & Quantity in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Sales Tax (Optional)</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={stdTax || ''}
                    onChange={(e) => setStdTax(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pr-7 pl-3 py-2 text-right font-bold text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={stdQuantity || ''}
                  onChange={(e) => setStdQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-right font-bold text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                Final Checkout Total
              </span>
              <button
                onClick={() =>
                  handleCopySummary(
                    `Toolino Discount Summary:\nOriginal: ${formatDiscountCurrency(
                      standardResult.totalOriginalPrice
                    )}\nDiscount: ${standardResult.discountPercent}% (-${formatDiscountCurrency(
                      standardResult.totalSavings
                    )})\nFinal Price: ${formatDiscountCurrency(standardResult.totalFinalPrice)}`
                  )
                }
                className="text-xs text-blue-200 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div>
              <p className="text-xs text-blue-200">You Pay</p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatDiscountCurrency(standardResult.totalFinalPrice)}
              </div>
              {stdQuantity > 1 && (
                <p className="text-[11px] text-blue-300 mt-1">
                  ({formatDiscountCurrency(standardResult.finalPricePerUnit)} per unit × {stdQuantity})
                </p>
              )}
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Total Savings (Discount):</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  -{formatDiscountCurrency(standardResult.totalSavings)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Original Total:</span>
                <span className="font-medium text-slate-300">
                  {formatDiscountCurrency(standardResult.totalOriginalPrice)}
                </span>
              </div>
              {standardResult.taxAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">Sales Tax ({standardResult.taxPercent}%):</span>
                  <span className="font-medium text-white">
                    +{formatDiscountCurrency(standardResult.taxAmount * stdQuantity)}
                  </span>
                </div>
              )}
            </div>

            {/* Savings percentage bar */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-blue-300">Paid: {100 - standardResult.discountPercent}%</span>
                <span className="text-emerald-400">Saved: {standardResult.discountPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-1">
                <div
                  style={{ width: `${100 - standardResult.discountPercent}%` }}
                  className="h-full bg-blue-400 rounded-full"
                />
                <div
                  style={{ width: `${standardResult.discountPercent}%` }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: STACKED / SEQUENTIAL DISCOUNTS                        */}
      {/* ------------------------------------------------------------- */}
      {mode === 'stacked' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Stacked / Multi-Tier Discounts</span>
              </h3>
              <button
                onClick={() => {
                  if (stackedDiscounts.length < 5) {
                    setStackedDiscounts([...stackedDiscounts, 10]);
                  }
                }}
                disabled={stackedDiscounts.length >= 5}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Discount</span>
              </button>
            </div>

            {/* Original Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Original Price
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={stackedOriginal || ''}
                    onChange={(e) => setStackedOriginal(Number(e.target.value))}
                    className="w-36 sm:w-44 pl-7 pr-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Sequential Steps List */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Discount Sequence
              </p>
              {stackedDiscounts.map((val, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {idx === 0 ? 'Primary Discount' : `Sequential Discount #${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={val || ''}
                        onChange={(e) => {
                          const updated = [...stackedDiscounts];
                          updated[idx] = Number(e.target.value);
                          setStackedDiscounts(updated);
                        }}
                        className="w-20 pr-6 pl-2 py-1 text-right font-extrabold text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                      />
                      <span className="absolute right-2 text-slate-400 text-xs font-bold">%</span>
                    </div>

                    {stackedDiscounts.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = stackedDiscounts.filter((_, i) => i !== idx);
                          setStackedDiscounts(updated);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Important:</span> Stacked discounts do not simply add up. For example, 20% off followed by 10% off yields an effective total discount of <strong>28%</strong>, not 30%.
              </p>
            </div>
          </div>

          {/* Stacked Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
              Effective Stacked Result
            </span>

            <div>
              <p className="text-xs text-blue-200">Final Price</p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatDiscountCurrency(stackedResult.finalPrice)}
              </div>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                Total Saved: {formatDiscountCurrency(stackedResult.totalSavings)} (
                {stackedResult.effectiveDiscountPercent}% total)
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                Step-by-Step Breakdown:
              </p>
              <div className="space-y-2 text-xs">
                {stackedResult.steps.map((st) => (
                  <div
                    key={st.stepIndex}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <span>
                      Step {st.stepIndex}: <strong>-{st.discountPercent}%</strong> on{' '}
                      {formatDiscountCurrency(st.startingPrice)}
                    </span>
                    <span className="font-bold text-emerald-300">
                      → {formatDiscountCurrency(st.endingPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 3: FIND DISCOUNT % (ORIGINAL VS SALE PRICE)              */}
      {/* ------------------------------------------------------------- */}
      {mode === 'findPercent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Calculate Discount % Given Sale Price</span>
            </h3>

            {/* Original Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Original Tag Price
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  value={findOriginal || ''}
                  onChange={(e) => setFindOriginal(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Sale Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Actual Sale / Offer Price
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  value={findSale || ''}
                  onChange={(e) => setFindSale(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
              Calculated Discount
            </span>

            <div>
              <p className="text-xs text-blue-200">
                {findResult.isPriceIncrease ? 'Price Markup' : 'Discount Percentage'}
              </p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {findResult.discountPercent.toFixed(2)}%
              </div>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                {findResult.isPriceIncrease
                  ? `Price increased by ${formatDiscountCurrency(findResult.discountAmount)}`
                  : `You save ${formatDiscountCurrency(findResult.discountAmount)} off the tag price`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 4: REVERSE DISCOUNT                                      */}
      {/* ------------------------------------------------------------- */}
      {mode === 'reverse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Reverse Discount (Find Original Tag Price)</span>
            </h3>

            {/* Sale Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Sale Price Paid
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  value={revSale || ''}
                  onChange={(e) => setRevSale(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Discount % applied */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Discount Given (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={99.9}
                  step={0.5}
                  value={revDiscount || ''}
                  onChange={(e) => setRevDiscount(Number(e.target.value))}
                  className="w-full pr-7 pl-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
                <span className="absolute right-3 text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
              Original Before Discount
            </span>

            <div>
              <p className="text-xs text-blue-200">Original List Price</p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatDiscountCurrency(reverseResult.originalPrice)}
              </div>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                Total discount deducted: {formatDiscountCurrency(reverseResult.savings)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 5: FLAT / CASH OFF                                       */}
      {/* ------------------------------------------------------------- */}
      {mode === 'fixedOff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Fixed Cash / Coupon Discount</span>
            </h3>

            {/* Original Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Original Price
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  value={fixedOriginal || ''}
                  onChange={(e) => setFixedOriginal(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Flat discount amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Flat Discount Amount (₹ Off)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  value={fixedAmount || ''}
                  onChange={(e) => setFixedAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
              Checkout Total
            </span>

            <div>
              <p className="text-xs text-blue-200">Final Price</p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatDiscountCurrency(fixedResult.finalPrice)}
              </div>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                Equivalent to {fixedResult.effectivePercent.toFixed(1)}% off
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
