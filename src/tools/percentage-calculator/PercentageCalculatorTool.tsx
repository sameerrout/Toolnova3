'use client';

/**
 * Percentage Calculator — seven questions, one tab each.
 *
 * The arithmetic lives in `./engine`, which returns `null` whenever a value
 * cannot be worked out (a division by zero, for example). The UI turns that into
 * a plain-English explanation, so `Infinity` and `NaN` can never reach the page.
 *
 * Calculators are instant, so results recompute in `useMemo` as you type and no
 * progress bar is shown.
 */

import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { Calculator, Eraser } from 'lucide-react';

import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useToolLimits } from '@/hooks/useToolJob';
import { formatNumber } from '@/lib/format';
import {
  decreaseBy,
  explainPercentChange,
  increaseBy,
  percentChange,
  percentOf,
  percentageDifference,
  ratioToPercent,
  reversePercent,
  whatPercent,
} from './engine';

type TabId = 'of' | 'what' | 'change' | 'increase' | 'decrease' | 'reverse' | 'difference';

interface TabConfig {
  id: TabId;
  /** Short label on the tab button. */
  label: string;
  /** The question the tab answers. */
  question: string;
  formula: string;
  labelA: string;
  labelB: string;
  placeholderA: string;
  placeholderB: string;
  compute: (a: number, b: number) => number | null;
  /** Formats the live result, including any unit. */
  format: (result: number, a: number, b: number) => string;
  /** Step-by-step working, one line per step. */
  working: (a: number, b: number) => string[];
  /** Shown when the result is `null` even though both boxes have numbers. */
  nullMessage: string;
}

const percent = (value: number): string => `${formatNumber(value)}%`;

const signedPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatNumber(value)}%`;

const TABS: TabConfig[] = [
  {
    id: 'of',
    label: 'Percent of',
    question: 'What is X percent of Y?',
    formula: 'result = (percent ÷ 100) × amount',
    labelA: 'Percentage (%)',
    labelB: 'Amount',
    placeholderA: '15',
    placeholderB: '200',
    compute: (a, b) => percentOf(a, b),
    format: (result) => formatNumber(result),
    working: (a, b) => [
      `${formatNumber(a)}% ÷ 100 = ${formatNumber(a / 100, 4)}`,
      `${formatNumber(a / 100, 4)} × ${formatNumber(b)} = ${formatNumber((a / 100) * b)}`,
    ],
    nullMessage: 'Enter a percentage and an amount to see the answer.',
  },
  {
    id: 'what',
    label: 'What percent',
    question: 'X is what percent of Y?',
    formula: 'result = (part ÷ whole) × 100',
    labelA: 'Part',
    labelB: 'Whole',
    placeholderA: '30',
    placeholderB: '200',
    compute: (a, b) => whatPercent(a, b),
    format: (result) => percent(result),
    working: (a, b) => [
      `${formatNumber(a)} ÷ ${formatNumber(b)} = ${formatNumber(a / b, 4)}`,
      `${formatNumber(a / b, 4)} × 100 = ${formatNumber((a / b) * 100)}%`,
    ],
    nullMessage:
      'The whole is zero. A part cannot be expressed as a percentage of nothing, because that would mean dividing by zero.',
  },
  {
    id: 'change',
    label: 'Change',
    question: 'What is the percentage change from X to Y?',
    formula: 'result = ((to − from) ÷ from) × 100',
    labelA: 'Starting value',
    labelB: 'Ending value',
    placeholderA: '100',
    placeholderB: '150',
    compute: (a, b) => percentChange(a, b),
    format: (result) => signedPercent(result),
    working: (a, b) => explainPercentChange(a, b).split('\n'),
    nullMessage:
      'The starting value is zero. Percentage change is measured against the original amount, so it cannot be calculated from zero.',
  },
  {
    id: 'increase',
    label: 'Increase by',
    question: 'Increase X by Y percent',
    formula: 'result = value + (value × percent ÷ 100)',
    labelA: 'Starting value',
    labelB: 'Increase (%)',
    placeholderA: '200',
    placeholderB: '15',
    compute: (a, b) => increaseBy(a, b),
    format: (result) => formatNumber(result),
    working: (a, b) => [
      `${formatNumber(a)} × ${formatNumber(b)}% = ${formatNumber((a * b) / 100)} (the increase)`,
      `${formatNumber(a)} + ${formatNumber((a * b) / 100)} = ${formatNumber(a + (a * b) / 100)}`,
    ],
    nullMessage: 'Enter a starting value and a percentage to increase it by.',
  },
  {
    id: 'decrease',
    label: 'Decrease by',
    question: 'Decrease X by Y percent',
    formula: 'result = value − (value × percent ÷ 100)',
    labelA: 'Starting value',
    labelB: 'Decrease (%)',
    placeholderA: '200',
    placeholderB: '15',
    compute: (a, b) => decreaseBy(a, b),
    format: (result) => formatNumber(result),
    working: (a, b) => [
      `${formatNumber(a)} × ${formatNumber(b)}% = ${formatNumber((a * b) / 100)} (the reduction)`,
      `${formatNumber(a)} − ${formatNumber((a * b) / 100)} = ${formatNumber(a - (a * b) / 100)}`,
    ],
    nullMessage: 'Enter a starting value and a percentage to reduce it by.',
  },
  {
    id: 'reverse',
    label: 'Reverse',
    question: 'A value changed by X percent, what was it before?',
    formula: 'original = final ÷ (1 + percent ÷ 100)',
    labelA: 'Final value',
    labelB: 'Change (%)',
    placeholderA: '115',
    placeholderB: '15',
    compute: (a, b) => reversePercent(a, b),
    format: (result) => formatNumber(result),
    working: (a, b) => [
      `1 + (${formatNumber(b)} ÷ 100) = ${formatNumber(1 + b / 100, 4)}`,
      `${formatNumber(a)} ÷ ${formatNumber(1 + b / 100, 4)} = ${formatNumber(a / (1 + b / 100))}`,
    ],
    nullMessage:
      'A change of exactly −100% removes the whole value, so there is no original amount left to find.',
  },
  {
    id: 'difference',
    label: 'Difference',
    question: 'What is the percentage difference between X and Y?',
    formula: 'result = |X − Y| ÷ ((|X| + |Y|) ÷ 2) × 100',
    labelA: 'First value',
    labelB: 'Second value',
    placeholderA: '100',
    placeholderB: '120',
    compute: (a, b) => percentageDifference(a, b),
    format: (result) => percent(result),
    working: (a, b) => {
      const base = (Math.abs(a) + Math.abs(b)) / 2;
      return [
        `|${formatNumber(a)} − ${formatNumber(b)}| = ${formatNumber(Math.abs(a - b))}`,
        `(${formatNumber(Math.abs(a))} + ${formatNumber(Math.abs(b))}) ÷ 2 = ${formatNumber(base)}`,
        `${formatNumber(Math.abs(a - b))} ÷ ${formatNumber(base)} × 100 = ${formatNumber(
          (Math.abs(a - b) / base) * 100
        )}%`,
      ];
    },
    nullMessage:
      'Both values are zero, so there is no base to measure a difference against. Division by zero is undefined.',
  },
];

const EMPTY_INPUTS: Record<TabId, { a: string; b: string }> = {
  of: { a: '', b: '' },
  what: { a: '', b: '' },
  change: { a: '', b: '' },
  increase: { a: '', b: '' },
  decrease: { a: '', b: '' },
  reverse: { a: '', b: '' },
  difference: { a: '', b: '' },
};

/** Reads a number from an input box, tolerating thousands separators. */
function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/,/g, '');
  if (cleaned.length === 0) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PercentageCalculatorTool() {
  const limits = useToolLimits('percentage-calculator');
  const [active, setActive] = useState<TabId>('of');
  const [inputs, setInputs] = useState<Record<TabId, { a: string; b: string }>>(EMPTY_INPUTS);

  useAdFreeZone(true);

  const tab = useMemo(() => TABS.find((entry) => entry.id === active) ?? TABS[0], [active]);
  const current = inputs[active];
  const first = useMemo(() => parseNumber(current.a), [current.a]);
  const second = useMemo(() => parseNumber(current.b), [current.b]);

  const result = useMemo(() => {
    if (!tab || first === null || second === null) return null;
    return tab.compute(first, second);
  }, [tab, first, second]);

  const bothEntered = first !== null && second !== null;
  const activeIndex = TABS.findIndex((entry) => entry.id === active);

  const setField = useCallback(
    (field: 'a' | 'b', value: string) => {
      setInputs((previous) => ({
        ...previous,
        [active]: { ...previous[active], [field]: value },
      }));
    },
    [active]
  );

  const handleTabKeys = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const lastIndex = TABS.length - 1;
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = activeIndex === lastIndex ? 0 : activeIndex + 1;
      else if (event.key === 'ArrowLeft') nextIndex = activeIndex === 0 ? lastIndex : activeIndex - 1;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = lastIndex;
      if (nextIndex === null) return;

      event.preventDefault();
      const nextTab = TABS[nextIndex];
      if (!nextTab) return;
      setActive(nextTab.id);
      const button = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
        `#percent-tab-${nextTab.id}`
      );
      button?.focus();
    },
    [activeIndex]
  );

  const clearAll = useCallback(() => {
    setInputs(EMPTY_INPUTS);
  }, []);

  if (!tab) return null;

  return (
    <div className="space-y-6">
      <div className="card">
        <div
          role="tablist"
          aria-label="Percentage calculations"
          className="flex flex-wrap gap-2 border-b border-slate-200 pb-4"
        >
          {TABS.map((entry) => {
            const selected = entry.id === active;
            return (
              <button
                key={entry.id}
                id={`percent-tab-${entry.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`percent-panel-${entry.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(entry.id)}
                onKeyDown={handleTabKeys}
                className={
                  selected
                    ? 'rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white'
                    : 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                }
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`percent-panel-${tab.id}`}
          aria-labelledby={`percent-tab-${tab.id}`}
          tabIndex={0}
          className="mt-5 focus-visible:outline-none"
        >
          <h2 className="text-base font-semibold text-slate-900">{tab.question}</h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`percent-${tab.id}-a`} className="field-label">
                {tab.labelA}
              </label>
              <input
                id={`percent-${tab.id}-a`}
                type="text"
                inputMode="decimal"
                value={current.a}
                onChange={(event) => setField('a', event.target.value)}
                placeholder={tab.placeholderA}
                className="field-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor={`percent-${tab.id}-b`} className="field-label">
                {tab.labelB}
              </label>
              <input
                id={`percent-${tab.id}-b`}
                type="text"
                inputMode="decimal"
                value={current.b}
                onChange={(event) => setField('b', event.target.value)}
                placeholder={tab.placeholderB}
                className="field-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-800">Result</p>
            {result !== null ? (
              <p className="result-value mt-1">
                {tab.id === 'of' ? `${formatNumber(first ?? 0)}% of ${formatNumber(second ?? 0)} = ` : ''}
                {tab.format(result, first ?? 0, second ?? 0)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-brand-900">
                {bothEntered ? tab.nullMessage : 'Enter both numbers to see the result.'}
              </p>
            )}
          </div>

          {tab.id === 'what' && bothEntered && result !== null && first !== null && second !== null ? (
            <p className="mt-3 text-sm text-slate-700">
              The ratio {formatNumber(first)} : {formatNumber(second)} is{' '}
              <span className="font-semibold">{percent(ratioToPercent(first, second) ?? 0)}</span>,
              which is {formatNumber(first)} parts in every 100.
            </p>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Formula</h3>
              <code className="mt-2 block overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                {tab.formula}
              </code>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Working</h3>
              {bothEntered && result !== null ? (
                <ol className="mt-2 space-y-1 text-sm text-slate-700">
                  {tab.working(first, second).map((line, index) => (
                    <li key={index} className="flex gap-2">
                      <span aria-hidden="true" className="font-semibold text-slate-500">
                        {index + 1}.
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  {bothEntered
                    ? tab.nullMessage
                    : 'The working appears here once both boxes contain numbers.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Calculator aria-hidden="true" className="h-3.5 w-3.5" />
            {limits.note}
          </p>
          <button
            type="button"
            onClick={clearAll}
            disabled={!Object.values(inputs).some((entry) => entry.a.length > 0 || entry.b.length > 0)}
            className="btn-secondary"
          >
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear all boxes
          </button>
        </div>
      </div>
    </div>
  );
}
