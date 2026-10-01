'use client';

import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  AlertCircle,
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
  const [amount, setAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute GST result
  const result: GstCalculationResult = useMemo(() => {
    return calculateGst({
      amount,
      rate: gstRate,
      mode,
      transactionType,
    });
  }, [amount, gstRate, mode, transactionType]);

  // Copy summary
  const handleCopySummary = () => {
    const summary = `Toolino GST Calculation Summary:
• Mode: ${mode === 'addGst' ? 'Add GST (Exclusive)' : 'Remove GST (Inclusive)'}
• Transaction: ${transactionType === 'intraState' ? 'Intra-State (Within State)' : 'Inter-State'}
• Base Price: ${formatGstCurrency(result.baseAmount)}
• GST Rate: ${result.gstRate}%
${
  result.transactionType === 'intraState'
    ? `• CGST (${result.cgstRate}%): ${formatGstCurrency(result.cgstAmount)}\n• SGST (${result.sgstRate}%): ${formatGstCurrency(result.sgstAmount)}`
    : `• IGST (${result.igstRate}%): ${formatGstCurrency(result.igstAmount)}`
}
• Total GST Tax: ${formatGstCurrency(result.totalGstAmount)}
• Final Gross Amount: ${formatGstCurrency(result.totalAmount)}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* PRIMARY MODE SELECTOR: ADD GST vs REMOVE GST                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 justify-center sm:justify-start">
        <button
          onClick={() => setMode('addGst')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            mode === 'addGst'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add GST (Exclusive)</span>
        </button>

        <button
          onClick={() => setMode('removeGst')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            mode === 'removeGst'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Minus className="w-4 h-4" />
          <span>Remove GST (Inclusive)</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN CALCULATOR INTERFACE                          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs & GST Slab Selectors */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>
                {mode === 'addGst' ? 'Enter Net Base Amount' : 'Enter Gross (GST-Inclusive) Amount'}
              </span>
            </h3>
            <button
              onClick={() => {
                setAmount(10000);
                setGstRate(18);
                setTransactionType('intraState');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {mode === 'addGst' ? 'Base / Net Amount' : 'Total Invoice Amount (Incl. GST)'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-40 sm:w-48 pl-7 pr-3 py-1.5 text-right font-extrabold text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    amount === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ₹{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* GST Tax Slabs (Configurable Preset Rates) */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Select GST Tax Slab</span>
              <span className="text-blue-600 font-bold">{gstRate}% Rate Selected</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CONFIGURABLE_GST_RATES.map((slab) => (
                <button
                  key={slab.rate}
                  onClick={() => setGstRate(slab.rate)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    gstRate === slab.rate
                      ? 'border-blue-600 bg-blue-50/80 text-blue-800 font-extrabold shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 font-semibold'
                  }`}
                >
                  <p className="text-sm">{slab.label}</p>
                </button>
              ))}
            </div>

            {/* Custom rate input */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Or enter custom rate:</span>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={gstRate || ''}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-24 pr-6 pl-2 py-1 text-right font-bold text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
                <span className="absolute right-2 text-slate-400 text-xs font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Transaction Type: Intra-State (CGST + SGST) vs Inter-State (IGST) */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transaction Territory
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransactionType('intraState')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  transactionType === 'intraState'
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    transactionType === 'intraState' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Intra-State (Within State)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Split equally into CGST ({(gstRate / 2).toFixed(1)}%) + SGST ({(gstRate / 2).toFixed(1)}%)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('interState')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  transactionType === 'interState'
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    transactionType === 'interState' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Inter-State (Outside State)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Integrated GST: IGST ({gstRate.toFixed(1)}%)
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live GST Results & Tax Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                {mode === 'addGst' ? 'Total Payable (Gross)' : 'Pre-Tax Base Price'}
              </span>
              <button
                onClick={handleCopySummary}
                className="text-xs text-blue-200 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Big Amount */}
            <div>
              <p className="text-xs text-blue-200">
                {mode === 'addGst' ? 'Final Invoice Amount' : 'Net Base Amount'}
              </p>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatGstCurrency(mode === 'addGst' ? result.totalAmount : result.baseAmount)}
              </div>
              <p className="text-xs text-amber-300 mt-1 font-semibold">
                Total GST: {formatGstCurrency(result.totalGstAmount)} ({result.gstRate}%)
              </p>
            </div>

            <div className="h-px bg-white/10" />

            {/* Detailed Tax Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Pre-Tax Base Amount:</span>
                <span className="font-bold text-white">{formatGstCurrency(result.baseAmount)}</span>
              </div>

              {result.transactionType === 'intraState' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">CGST ({result.cgstRate}%):</span>
                    <span className="font-semibold text-amber-300">
                      +{formatGstCurrency(result.cgstAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">SGST ({result.sgstRate}%):</span>
                    <span className="font-semibold text-amber-300">
                      +{formatGstCurrency(result.sgstAmount)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-blue-200">IGST ({result.igstRate}%):</span>
                  <span className="font-semibold text-amber-300">
                    +{formatGstCurrency(result.igstAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10 font-bold">
                <span className="text-blue-100">Total Invoice Amount:</span>
                <span className="text-white text-base">{formatGstCurrency(result.totalAmount)}</span>
              </div>
            </div>

            {/* Proportional Tax Bar */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-blue-300">Base: {result.basePercentage.toFixed(1)}%</span>
                <span className="text-amber-300">Tax: {result.taxPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-1">
                <div
                  style={{ width: `${result.basePercentage}%` }}
                  className="h-full bg-blue-400 rounded-full"
                />
                <div
                  style={{ width: `${result.taxPercentage}%` }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* GST Disclaimer as specifically required */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              This calculator provides an estimate based on the selected GST rate. Verify applicable GST rules for your transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
