'use client';

import { useMemo, useState } from 'react';
import { Home, Car, User, GraduationCap, Coins, Check, Copy } from 'lucide-react';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import {
  calculateEmi,
  formatEmiCurrency,
  type TenureUnit,
} from './engine';

const LOAN_PRESETS = [
  { id: 'home', label: 'Home Loan', amount: '250000', rate: '6.5', tenure: '25', unit: 'years' as TenureUnit, icon: Home },
  { id: 'car', label: 'Car Loan', amount: '35000', rate: '7.5', tenure: '5', unit: 'years' as TenureUnit, icon: Car },
  { id: 'personal', label: 'Personal', amount: '15000', rate: '11.0', tenure: '3', unit: 'years' as TenureUnit, icon: User },
  { id: 'education', label: 'Education', amount: '40000', rate: '8.5', tenure: '7', unit: 'years' as TenureUnit, icon: GraduationCap },
  { id: 'custom', label: 'Custom', amount: '100000', rate: '8.0', tenure: '10', unit: 'years' as TenureUnit, icon: Coins },
];

export function EmiCalculatorTool() {
  const [activePreset, setActivePreset] = useState('home');
  const [principal, setPrincipal] = useState('250000');
  const [rate, setRate] = useState('6.5');
  const [tenure, setTenure] = useState('25');
  const [tenureUnit, setTenureUnit] = useState<TenureUnit>('years');
  const [showSchedule, setShowSchedule] = useState(false);
  const [copied, setCopied] = useState(false);

  useAdFreeZone(true);

  const applyPreset = (presetId: string) => {
    const p = LOAN_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    setActivePreset(p.id);
    setPrincipal(p.amount);
    setRate(p.rate);
    setTenure(p.tenure);
    setTenureUnit(p.unit);
  };

  const result = useMemo(() => {
    return calculateEmi({
      principal: parseFloat(principal) || 0,
      annualRate: parseFloat(rate) || 0,
      tenure: parseFloat(tenure) || 0,
      tenureUnit,
    });
  }, [principal, rate, tenure, tenureUnit]);

  const handleCopy = () => {
    const text = `Monthly EMI: ${formatEmiCurrency(result.monthlyEmi)}, Total Interest: ${formatEmiCurrency(result.totalInterest)}, Total Payment: ${formatEmiCurrency(result.totalPayment)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Preset selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {LOAN_PRESETS.map((p) => {
          const Icon = p.icon;
          const active = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="card space-y-4 lg:col-span-6">
          <h2 className="text-base font-semibold text-slate-900">Loan Details</h2>

          <div>
            <div className="flex justify-between">
              <label className="field-label">Loan Amount ($ / ₹)</label>
              <span className="text-xs font-semibold text-brand-600">{formatEmiCurrency(parseFloat(principal) || 0)}</span>
            </div>
            <input
              type="number"
              min="0"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="field-input"
              placeholder="e.g. 250000"
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="field-label">Interest Rate (% p.a.)</label>
              <span className="text-xs font-semibold text-brand-600">{rate}%</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="field-input"
              placeholder="e.g. 6.5"
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="field-label">Loan Tenure</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTenureUnit('years')}
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    tenureUnit === 'years' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Years
                </button>
                <button
                  type="button"
                  onClick={() => setTenureUnit('months')}
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    tenureUnit === 'months' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>
            <input
              type="number"
              min="1"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="field-input"
              placeholder={tenureUnit === 'years' ? '25' : '300'}
            />
          </div>
        </div>

        {/* Right Results */}
        <div className="card space-y-5 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">EMI & Repayment Summary</h2>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Result'}
            </button>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Monthly Loan EMI</span>
            <div className="mt-1 text-3xl font-extrabold text-brand-950 sm:text-4xl">
              {formatEmiCurrency(result.monthlyEmi)}
            </div>
            <div className="mt-2 text-sm text-brand-800">
              For a duration of <span className="font-bold">{result.totalMonths} months</span>
            </div>
          </div>

          {/* Visual Bar Breakdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Principal: {result.principalPercentage.toFixed(1)}%</span>
              <span>Interest: {result.interestPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                style={{ width: `${result.principalPercentage}%` }}
                className="bg-brand-600 transition-all duration-300"
              />
              <div
                style={{ width: `${result.interestPercentage}%` }}
                className="bg-amber-500 transition-all duration-300"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2 text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                Principal Loan Amount
              </span>
              <span className="font-semibold text-slate-900">{formatEmiCurrency(result.principalAmount)}</span>
            </div>
            <div className="flex justify-between py-2 text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Total Interest Payable
              </span>
              <span className="font-semibold text-amber-700">{formatEmiCurrency(result.totalInterest)}</span>
            </div>
            <div className="flex justify-between py-2 text-slate-600">
              <span className="font-medium text-slate-900">Total Payment (Principal + Interest)</span>
              <span className="font-bold text-slate-900">{formatEmiCurrency(result.totalPayment)}</span>
            </div>
          </div>

          {result.yearlySchedule.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showSchedule ? 'Hide Amortization Schedule' : 'Show Yearly Amortization Schedule'}
            </button>
          )}
        </div>
      </div>

      {/* Amortization Table */}
      {showSchedule && result.yearlySchedule.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Yearly Amortization Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Opening Balance</th>
                  <th className="px-4 py-3">Principal Paid</th>
                  <th className="px-4 py-3">Interest Paid</th>
                  <th className="px-4 py-3">Total Payment</th>
                  <th className="px-4 py-3">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {result.yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">Year {row.year}</td>
                    <td className="px-4 py-3">{formatEmiCurrency(row.openingBalance)}</td>
                    <td className="px-4 py-3 font-medium text-brand-700">{formatEmiCurrency(row.principalPaid)}</td>
                    <td className="px-4 py-3 font-medium text-amber-700">{formatEmiCurrency(row.interestPaid)}</td>
                    <td className="px-4 py-3">{formatEmiCurrency(row.totalPayment)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatEmiCurrency(row.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
