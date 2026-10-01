'use client';

import React, { useState, useMemo } from 'react';
import {
  Percent,
  TrendingUp,
  Tag,
  Receipt,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  calculateXPercentOfY,
  calculateXIsWhatPercentOfY,
  calculatePercentageChange,
  calculateDiscount,
  calculateTip,
  calculateMarginMarkup
} from '@/core/engine/percentageCalculatorEngine';

type Mode = 'basic' | 'percentOf' | 'change' | 'discount' | 'tip' | 'margin';

export function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>('basic');
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Basic (X% of Y)
  const [basicX, setBasicX] = useState<number>(15);
  const [basicY, setBasicY] = useState<number>(200);

  // 2. Percent Of (X is what % of Y)
  const [ofX, setOfX] = useState<number>(45);
  const [ofY, setOfY] = useState<number>(180);

  // 3. Change (from X to Y)
  const [fromVal, setFromVal] = useState<number>(50);
  const [toVal, setToVal] = useState<number>(85);

  // 4. Discount
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [taxPercent, setTaxPercent] = useState<number>(8);

  // 5. Tip & Split
  const [billAmount, setBillAmount] = useState<number>(95);
  const [tipPercent, setTipPercent] = useState<number>(18);
  const [splitCount, setSplitCount] = useState<number>(3);

  // 6. Margin & Markup
  const [costPrice, setCostPrice] = useState<number>(60);
  const [sellingPrice, setSellingPrice] = useState<number>(100);

  // Calculations
  const basicResult = useMemo(() => {
    try {
      return { success: true, data: calculateXPercentOfY(basicX, basicY) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [basicX, basicY]);

  const ofResult = useMemo(() => {
    try {
      return { success: true, data: calculateXIsWhatPercentOfY(ofX, ofY) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [ofX, ofY]);

  const changeResult = useMemo(() => {
    try {
      return { success: true, data: calculatePercentageChange(fromVal, toVal) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [fromVal, toVal]);

  const discountResult = useMemo(() => {
    try {
      return { success: true, data: calculateDiscount(originalPrice, discountPercent, taxPercent) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [originalPrice, discountPercent, taxPercent]);

  const tipResult = useMemo(() => {
    try {
      return { success: true, data: calculateTip(billAmount, tipPercent, splitCount) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [billAmount, tipPercent, splitCount]);

  const marginResult = useMemo(() => {
    try {
      return { success: true, data: calculateMarginMarkup(costPrice, sellingPrice) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Calculation error' };
    }
  }, [costPrice, sellingPrice]);

  const handleCopy = (summary: string) => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const QUICK_PERCENT_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50, 75];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Navigation Mode Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 justify-center sm:justify-start">
        <button
          onClick={() => setMode('basic')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'basic'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>X% of Y</span>
        </button>

        <button
          onClick={() => setMode('percentOf')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'percentOf'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>X is What % of Y</span>
        </button>

        <button
          onClick={() => setMode('change')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'change'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Increase / Decrease</span>
        </button>

        <button
          onClick={() => setMode('discount')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'discount'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Discount &amp; Tax</span>
        </button>

        <button
          onClick={() => setMode('tip')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'tip'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tip &amp; Split</span>
        </button>

        <button
          onClick={() => setMode('margin')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            mode === 'margin'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Margin &amp; Markup</span>
        </button>
      </div>

      {/* MODE 1: WHAT IS X% OF Y? */}
      {mode === 'basic' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <span>What is X% of Y?</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Percentage (X%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={basicX}
                    onChange={(e) => setBasicX(Number(e.target.value))}
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-bold">%</span>
                </div>

                {/* Preset shortcuts */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {QUICK_PERCENT_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setBasicX(p)}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold transition ${
                        basicX === p ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Total Value (Y)
                </label>
                <input
                  type="number"
                  value={basicY}
                  onChange={(e) => setBasicY(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {basicResult.success && basicResult.data && (
            <div className="space-y-6">
              {/* Hero Result Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                    Calculated Result
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    {basicResult.data.value.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-100 mt-2">
                    <strong>{basicX}%</strong> of <strong>{basicY}</strong> is{' '}
                    <strong>{basicResult.data.value}</strong>
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(`${basicX}% of ${basicY} = ${basicResult.data.value}`)
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>
              </div>

              {/* Step-by-Step Explanation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Formula &amp; Mathematical Breakdown</span>
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 font-semibold mb-3">
                  {basicResult.data.formula}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                  {basicResult.data.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: X IS WHAT PERCENT OF Y? */}
      {mode === 'percentOf' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>X is What Percent of Y?</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Part Value (X)
                </label>
                <input
                  type="number"
                  value={ofX}
                  onChange={(e) => setOfX(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Whole / Total Value (Y)
                </label>
                <input
                  type="number"
                  value={ofY}
                  onChange={(e) => setOfY(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {!ofResult.success && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {ofResult.error}
            </div>
          )}

          {ofResult.success && ofResult.data && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Calculated Percentage
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    {ofResult.data.percent.toLocaleString()}%
                  </div>
                  <p className="text-sm text-indigo-100 mt-2">
                    <strong>{ofX}</strong> is <strong>{ofResult.data.percent}%</strong> of{' '}
                    <strong>{ofY}</strong>
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(`${ofX} is ${ofResult.data.percent}% of ${ofY}`)
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>
              </div>

              {/* Progress Representation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between text-xs text-slate-600 font-semibold mb-2">
                  <span>Proportion of Total</span>
                  <span>{ofResult.data.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, ofResult.data.percent))}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Formula &amp; Mathematical Breakdown</span>
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 font-semibold mb-3">
                  {ofResult.data.formula}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                  {ofResult.data.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: PERCENTAGE INCREASE / DECREASE */}
      {mode === 'change' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Percentage Increase or Decrease</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Initial / Original Value
                </label>
                <input
                  type="number"
                  value={fromVal}
                  onChange={(e) => setFromVal(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Final / New Value
                </label>
                <input
                  type="number"
                  value={toVal}
                  onChange={(e) => setToVal(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {!changeResult.success && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {changeResult.error}
            </div>
          )}

          {changeResult.success && changeResult.data && (
            <div className="space-y-6">
              <div
                className={`rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
                  changeResult.data.type === 'increase'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : changeResult.data.type === 'decrease'
                    ? 'bg-gradient-to-br from-rose-600 to-red-700'
                    : 'bg-gradient-to-br from-slate-700 to-slate-900'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    {changeResult.data.type === 'increase'
                      ? '📈 Percentage Increase'
                      : changeResult.data.type === 'decrease'
                      ? '📉 Percentage Decrease'
                      : 'No Change'}
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    {changeResult.data.changePercent > 0 ? '+' : ''}
                    {changeResult.data.changePercent.toLocaleString()}%
                  </div>
                  <p className="text-sm text-white/90 mt-2">
                    Difference of <strong>{changeResult.data.absoluteDifference}</strong> from{' '}
                    <strong>{fromVal}</strong> to <strong>{toVal}</strong>
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `Change from ${fromVal} to ${toVal} = ${changeResult.data.changePercent > 0 ? '+' : ''}${changeResult.data.changePercent}%`
                    )
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center space-x-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Formula &amp; Mathematical Breakdown</span>
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 font-semibold mb-3">
                  {changeResult.data.formula}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                  {changeResult.data.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: DISCOUNT & SALES TAX */}
      {mode === 'discount' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <span>Discount &amp; Sales Tax Calculator</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Original Price ($)
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Sales Tax (%) Optional
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {discountResult.success && discountResult.data && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                    Final Price After Discount
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    ${discountResult.data.finalPrice.toFixed(2)}
                  </div>
                  <p className="text-sm text-emerald-100 mt-2">
                    You save <strong>${discountResult.data.totalSaved.toFixed(2)}</strong> (
                    {discountPercent}% off)
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `Original: $${originalPrice}, Discount: ${discountPercent}%, Final: $${discountResult.data.finalPrice.toFixed(2)}`
                    )
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* Price Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                  <div className="text-lg font-bold text-slate-900">${originalPrice.toFixed(2)}</div>
                  <div className="text-xs text-slate-500 mt-1">Original Price</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-lg font-bold text-emerald-700">
                    -${discountResult.data.discountAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">Discount Amount</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-lg font-bold text-slate-800">
                    ${discountResult.data.discountedPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Pre-Tax Price</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <div className="text-lg font-bold text-amber-700">
                    +${discountResult.data.taxAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">Sales Tax ({taxPercent}%)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 5: TIP & BILL SPLITTER */}
      {mode === 'tip' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <span>Tip &amp; Bill Splitter Calculator</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Bill Amount ($)
                </label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Tip Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(Number(e.target.value))}
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span className="absolute right-3.5 top-3 text-slate-400 font-bold">%</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[10, 15, 18, 20, 25].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipPercent(t)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        tipPercent === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Split Between (People)
                </label>
                <input
                  type="number"
                  min="1"
                  value={splitCount}
                  onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {tipResult.success && tipResult.data && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                    {splitCount > 1 ? 'Total Per Person' : 'Total With Tip'}
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    ${tipResult.data.totalPerPerson.toFixed(2)}
                  </div>
                  <p className="text-sm text-blue-100 mt-2">
                    {splitCount > 1 && (
                      <>
                        (Includes <strong>${tipResult.data.tipPerPerson.toFixed(2)}</strong> tip per person)
                      </>
                    )}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `Bill: $${billAmount}, Tip: ${tipPercent}%, Total: $${tipResult.data.totalAmount.toFixed(2)} ($${tipResult.data.totalPerPerson.toFixed(2)} per person)`
                    )
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                  <div className="text-lg font-bold text-slate-900">${billAmount.toFixed(2)}</div>
                  <div className="text-xs text-slate-500 mt-1">Raw Bill</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    ${tipResult.data.tipAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Total Tip ({tipPercent}%)</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-lg font-bold text-slate-900">
                    ${tipResult.data.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Grand Total</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center">
                  <div className="text-lg font-bold text-purple-700">
                    ${tipResult.data.tipPerPerson.toFixed(2)}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Tip Per Person</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 6: MARGIN & MARKUP */}
      {mode === 'margin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Profit Margin &amp; Markup Calculator</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Cost of Goods ($)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Selling Price / Revenue ($)
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {marginResult.success && marginResult.data && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Gross Profit
                  </span>
                  <div className="text-4xl sm:text-5xl font-black mt-2">
                    ${marginResult.data.profit.toFixed(2)}
                  </div>
                  <p className="text-sm text-slate-300 mt-2">
                    Margin: <strong>{marginResult.data.marginPercent.toFixed(1)}%</strong> • Markup:{' '}
                    <strong>{marginResult.data.markupPercent.toFixed(1)}%</strong>
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `Cost: $${costPrice}, Sell: $${sellingPrice}, Profit: $${marginResult.data.profit.toFixed(2)}, Margin: ${marginResult.data.marginPercent.toFixed(1)}%, Markup: ${marginResult.data.markupPercent.toFixed(1)}%`
                    )
                  }
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur-md transition self-start sm:self-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-extrabold text-slate-900">
                    ${marginResult.data.profit.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">Gross Profit ($)</div>
                </div>

                <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-3xl font-extrabold text-emerald-800">
                    {marginResult.data.marginPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-1">
                    Profit Margin (Profit ÷ Revenue)
                  </div>
                </div>

                <div className="p-5 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-center">
                  <div className="text-3xl font-extrabold text-indigo-800">
                    {marginResult.data.markupPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mt-1">
                    Markup (Profit ÷ Cost)
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
