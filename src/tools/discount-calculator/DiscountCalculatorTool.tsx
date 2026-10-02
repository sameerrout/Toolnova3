'use client';

import { useMemo, useState } from 'react';
import { Tag, Layers, Search, RotateCcw, DollarSign, Check, Copy } from 'lucide-react';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import {
  calculateStandardDiscount,
  calculateStackedDiscounts,
  calculateFindPercent,
  calculateReverseDiscount,
  calculateFixedOff,
  formatDiscountCurrency,
  type DiscountMode,
} from './engine';

export function DiscountCalculatorTool() {
  const [mode, setMode] = useState<DiscountMode>('standard');
  const [copied, setCopied] = useState(false);

  // 1. Standard Mode
  const [stdOriginal, setStdOriginal] = useState('100');
  const [stdDiscount, setStdDiscount] = useState('20');
  const [stdTax, setStdTax] = useState('0');
  const [stdQuantity, setStdQuantity] = useState('1');

  // 2. Stacked Mode
  const [stackedOriginal, setStackedOriginal] = useState('100');
  const [step1, setStep1] = useState('20');
  const [step2, setStep2] = useState('10');
  const [step3, setStep3] = useState('');

  // 3. Find Percent Mode
  const [findOriginal, setFindOriginal] = useState('120');
  const [findSale, setFindSale] = useState('90');

  // 4. Reverse Mode
  const [revSale, setRevSale] = useState('80');
  const [revDiscount, setRevDiscount] = useState('20');

  // 5. Fixed Off Mode
  const [fixedOriginal, setFixedOriginal] = useState('100');
  const [fixedAmount, setFixedAmount] = useState('15');
  const [fixedQuantity, setFixedQuantity] = useState('1');

  useAdFreeZone(true);

  const standardResult = useMemo(() => {
    return calculateStandardDiscount({
      originalPrice: parseFloat(stdOriginal) || 0,
      discountPercent: parseFloat(stdDiscount) || 0,
      taxPercent: parseFloat(stdTax) || 0,
      quantity: parseInt(stdQuantity, 10) || 1,
    });
  }, [stdOriginal, stdDiscount, stdTax, stdQuantity]);

  const stackedResult = useMemo(() => {
    const steps = [parseFloat(step1) || 0, parseFloat(step2) || 0];
    if (step3.trim()) steps.push(parseFloat(step3) || 0);
    return calculateStackedDiscounts(parseFloat(stackedOriginal) || 0, steps);
  }, [stackedOriginal, step1, step2, step3]);

  const findPercentResult = useMemo(() => {
    return calculateFindPercent({
      originalPrice: parseFloat(findOriginal) || 0,
      salePrice: parseFloat(findSale) || 0,
    });
  }, [findOriginal, findSale]);

  const reverseResult = useMemo(() => {
    return calculateReverseDiscount({
      salePrice: parseFloat(revSale) || 0,
      discountPercent: parseFloat(revDiscount) || 0,
    });
  }, [revSale, revDiscount]);

  const fixedResult = useMemo(() => {
    return calculateFixedOff({
      originalPrice: parseFloat(fixedOriginal) || 0,
      discountAmount: parseFloat(fixedAmount) || 0,
      quantity: parseInt(fixedQuantity, 10) || 1,
    });
  }, [fixedOriginal, fixedAmount, fixedQuantity]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Mode navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'standard', label: 'Standard Discount', icon: Tag },
          { id: 'stacked', label: 'Stacked (% + %)', icon: Layers },
          { id: 'findPercent', label: 'Find % Off', icon: Search },
          { id: 'reverse', label: 'Reverse (Before Sale)', icon: RotateCcw },
          { id: 'fixedOff', label: 'Fixed ($ / ₹ Off)', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id as DiscountMode)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Inputs Card */}
        <div className="card space-y-4 lg:col-span-6">
          <h2 className="text-base font-semibold text-slate-900">
            {mode === 'standard' && 'Standard % Discount Parameters'}
            {mode === 'stacked' && 'Multi-Coupon Stacked Discounts'}
            {mode === 'findPercent' && 'Find Discount Percentage from Prices'}
            {mode === 'reverse' && 'Calculate Original Price Before Discount'}
            {mode === 'fixedOff' && 'Fixed Cash Amount Discount'}
          </h2>

          {mode === 'standard' && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Original Price</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stdOriginal}
                  onChange={(e) => setStdOriginal(e.target.value)}
                  className="field-input"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={stdDiscount}
                    onChange={(e) => setStdDiscount(e.target.value)}
                    className="field-input"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="field-label">Tax / VAT (%) [Optional]</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={stdTax}
                    onChange={(e) => setStdTax(e.target.value)}
                    className="field-input"
                    placeholder="e.g. 8"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={stdQuantity}
                  onChange={(e) => setStdQuantity(e.target.value)}
                  className="field-input"
                  placeholder="1"
                />
              </div>
            </div>
          )}

          {mode === 'stacked' && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Original Price</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stackedOriginal}
                  onChange={(e) => setStackedOriginal(e.target.value)}
                  className="field-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">First Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={step1}
                    onChange={(e) => setStep1(e.target.value)}
                    className="field-input"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="field-label">Second Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={step2}
                    onChange={(e) => setStep2(e.target.value)}
                    className="field-input"
                    placeholder="10"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Third Discount (%) [Optional]</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={step3}
                  onChange={(e) => setStep3(e.target.value)}
                  className="field-input"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          )}

          {mode === 'findPercent' && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Original Price</label>
                <input
                  type="number"
                  min="0"
                  value={findOriginal}
                  onChange={(e) => setFindOriginal(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Final Sale Price</label>
                <input
                  type="number"
                  min="0"
                  value={findSale}
                  onChange={(e) => setFindSale(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>
          )}

          {mode === 'reverse' && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Discounted Sale Price</label>
                <input
                  type="number"
                  min="0"
                  value={revSale}
                  onChange={(e) => setRevSale(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Discount Received (%)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={revDiscount}
                  onChange={(e) => setRevDiscount(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>
          )}

          {mode === 'fixedOff' && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Original Price</label>
                <input
                  type="number"
                  min="0"
                  value={fixedOriginal}
                  onChange={(e) => setFixedOriginal(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Fixed Discount Amount ($ / ₹)</label>
                <input
                  type="number"
                  min="0"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={fixedQuantity}
                  onChange={(e) => setFixedQuantity(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Results Card */}
        <div className="card space-y-5 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Summary & Savings</h2>
            <button
              type="button"
              onClick={() => {
                const text =
                  mode === 'standard'
                    ? `Final Price: ${formatDiscountCurrency(standardResult.totalFinalPrice)}, Saved: ${formatDiscountCurrency(standardResult.totalSavings)}`
                    : mode === 'stacked'
                    ? `Final Price: ${formatDiscountCurrency(stackedResult.finalPrice)}, Total Saved: ${formatDiscountCurrency(stackedResult.totalSavings)}`
                    : mode === 'findPercent'
                    ? `Discount: ${findPercentResult.discountPercent}%, Saved: ${formatDiscountCurrency(findPercentResult.discountAmount)}`
                    : mode === 'reverse'
                    ? `Original Price: ${formatDiscountCurrency(reverseResult.originalPrice)}, Saved: ${formatDiscountCurrency(reverseResult.savings)}`
                    : `Final Price: ${formatDiscountCurrency(fixedResult.totalFinal)}, Total Saved: ${formatDiscountCurrency(fixedResult.totalSavings)}`;
                handleCopy(text);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Result'}
            </button>
          </div>

          {mode === 'standard' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Final Price</span>
                <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
                  {formatDiscountCurrency(standardResult.totalFinalPrice)}
                </div>
                <div className="mt-2 text-sm text-brand-800">
                  You save <span className="font-bold text-emerald-700">{formatDiscountCurrency(standardResult.totalSavings)}</span> ({standardResult.discountPercent}% off)
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-2 text-slate-600">
                  <span>Original Price</span>
                  <span className="font-semibold text-slate-900">{formatDiscountCurrency(standardResult.totalOriginalPrice)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span>Discount Amount ({standardResult.discountPercent}%)</span>
                  <span className="font-semibold text-emerald-600">-{formatDiscountCurrency(standardResult.totalSavings)}</span>
                </div>
                {standardResult.taxPercent > 0 && (
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Tax ({standardResult.taxPercent}%)</span>
                    <span className="font-semibold text-slate-900">+{formatDiscountCurrency(standardResult.taxAmount * standardResult.quantity)}</span>
                  </div>
                )}
                {standardResult.quantity > 1 && (
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Price Per Unit</span>
                    <span className="font-semibold text-slate-900">{formatDiscountCurrency(standardResult.finalPricePerUnit)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'stacked' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Final Stacked Price</span>
                <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
                  {formatDiscountCurrency(stackedResult.finalPrice)}
                </div>
                <div className="mt-2 text-sm text-brand-800">
                  Effective discount: <span className="font-bold text-emerald-700">{stackedResult.effectiveDiscountPercent}%</span> (Saved {formatDiscountCurrency(stackedResult.totalSavings)})
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step-by-Step Breakdown</h3>
                <div className="divide-y divide-slate-100 text-sm">
                  {stackedResult.steps.map((s) => (
                    <div key={s.stepIndex} className="flex justify-between py-2 text-slate-600">
                      <span>Step {s.stepIndex}: {s.discountPercent}% off {formatDiscountCurrency(s.startingPrice)}</span>
                      <span className="font-semibold text-slate-900">{formatDiscountCurrency(s.endingPrice)} (-{formatDiscountCurrency(s.savingsInStep)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'findPercent' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Calculated Discount</span>
                <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
                  {findPercentResult.discountPercent}% OFF
                </div>
                <div className="mt-2 text-sm text-brand-800">
                  Total price reduction: <span className="font-bold text-emerald-700">{formatDiscountCurrency(findPercentResult.discountAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {mode === 'reverse' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Original Price Before Sale</span>
                <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
                  {formatDiscountCurrency(reverseResult.originalPrice)}
                </div>
                <div className="mt-2 text-sm text-brand-800">
                  A {reverseResult.discountPercent}% discount reduced this to {formatDiscountCurrency(reverseResult.salePrice)}
                </div>
              </div>
            </div>
          )}

          {mode === 'fixedOff' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Total Price</span>
                <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
                  {formatDiscountCurrency(fixedResult.totalFinal)}
                </div>
                <div className="mt-2 text-sm text-brand-800">
                  Equivalent to <span className="font-bold text-emerald-700">{fixedResult.effectivePercent.toFixed(1)}%</span> off
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
