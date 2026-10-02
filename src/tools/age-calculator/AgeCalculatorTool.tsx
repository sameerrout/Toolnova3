'use client';

/**
 * Age Calculator — exact age, totals, birthday countdown and zodiac details.
 *
 * The calculator itself is instant, so there is no progress bar: the result is a
 * `useMemo` over the two date inputs, which keeps it live (change either date and
 * the figures update immediately) without storing derived numbers in state.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Cake, Eraser, Hash, Moon, Sparkles, Sun } from 'lucide-react';

import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useToolLimits } from '@/hooks/useToolJob';
import { formatDate, formatNumber } from '@/lib/format';
import {
  calculateAge,
  describeAge,
  parseLocalDate,
  today,
  type AgeResult,
} from './engine';

function ResultCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

export function AgeCalculatorTool() {
  const limits = useToolLimits('age-calculator');
  const [birthInput, setBirthInput] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Calculators are instant: no progress bar, and nothing to cancel.
  useAdFreeZone(submitted && birthInput.length > 0);

  const birth = useMemo(() => parseLocalDate(birthInput), [birthInput]);
  const reference = useMemo(() => {
    if (referenceInput.trim().length === 0) return today();
    return parseLocalDate(referenceInput);
  }, [referenceInput]);

  const validationError = useMemo(() => {
    if (birthInput.trim().length === 0) return 'Enter a date of birth to begin.';
    if (birth === null) return 'That date of birth is not a real calendar date.';
    if (reference === null) return 'That reference date is not a real calendar date.';
    if (birth.getTime() > reference.getTime()) {
      return 'The date of birth is after the reference date. Check the two dates.';
    }
    return null;
  }, [birth, birthInput, reference]);

  const result: AgeResult | null = useMemo(() => {
    if (!submitted || validationError !== null || birth === null || reference === null) return null;
    return calculateAge(birth, reference);
  }, [birth, reference, submitted, validationError]);

  const handleClear = useCallback(() => {
    setBirthInput('');
    setReferenceInput('');
    setSubmitted(false);
  }, []);

  const usingToday = referenceInput.trim().length === 0;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="age-birth" className="field-label">
              Date of birth
            </label>
            <input
              id="age-birth"
              type="date"
              value={birthInput}
              max={referenceInput || undefined}
              onChange={(event) => setBirthInput(event.target.value)}
              className="field-input"
              aria-describedby="age-birth-help"
            />
            <p id="age-birth-help" className="mt-1.5 text-xs text-slate-500">
              Your date of birth stays in this tab and is never sent anywhere.
            </p>
          </div>

          <div>
            <label htmlFor="age-reference" className="field-label">
              Age at date (optional)
            </label>
            <input
              id="age-reference"
              type="date"
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
              className="field-input"
              aria-describedby="age-reference-help"
            />
            <p id="age-reference-help" className="mt-1.5 text-xs text-slate-500">
              Leave empty to measure the age today, or set a past or future date.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={validationError !== null}
            className="btn-primary"
          >
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Calculate age
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={birthInput.length === 0 && referenceInput.length === 0}
            className="btn-secondary"
          >
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear
          </button>
          {referenceInput.length > 0 ? (
            <button type="button" onClick={() => setReferenceInput('')} className="btn-secondary">
              <Sun aria-hidden="true" className="h-4 w-4" />
              Use today
            </button>
          ) : null}
        </div>

        {submitted && validationError ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-900">
            {validationError}
          </p>
        ) : null}
      </div>

      {!submitted ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Enter a date of birth and select Calculate age. The result stays live afterwards, so you can
          change either date and watch the figures update.
        </p>
      ) : null}

      {result ? (
        <>
          <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-800">
              {usingToday ? 'Exact age today' : `Exact age on ${formatDate(reference ?? today())}`}
            </p>
            <p className="result-value mt-2">{describeAge(result)}</p>
            <p className="mt-2 text-sm text-brand-900">
              {formatNumber(result.totalDays, 0)} days in total, counted from{' '}
              {formatDate(birth ?? today())}
              {result.isBirthdayToday ? ' — happy birthday, today is the day.' : '.'}
            </p>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <ResultCard
              title="Total time lived"
              icon={<Hash aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              <dl>
                <Row label="Days" value={formatNumber(result.totalDays, 0)} />
                <Row label="Weeks" value={formatNumber(result.totalWeeks, 0)} />
                <Row label="Hours" value={formatNumber(result.totalHours, 0)} />
                <Row label="Minutes" value={formatNumber(result.totalMinutes, 0)} />
                <Row label="Seconds" value={formatNumber(result.totalSeconds, 0)} />
              </dl>
            </ResultCard>

            <ResultCard
              title="Next birthday"
              icon={<Cake aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              {result.isBirthdayToday ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
                  Today is the birthday. The countdown restarts tomorrow.
                </p>
              ) : (
                <p className="text-sm text-slate-700">
                  {formatNumber(result.nextBirthday.daysAway, 0)}{' '}
                  {result.nextBirthday.daysAway === 1 ? 'day' : 'days'} to go.
                </p>
              )}
              <dl className="mt-2">
                <Row label="Date" value={formatDate(result.nextBirthday.date)} />
                <Row label="Weekday" value={result.nextBirthday.weekday} />
                <Row
                  label="Turning"
                  value={`${formatNumber(result.years + (result.isBirthdayToday ? 0 : 1), 0)} years old`}
                />
              </dl>
            </ResultCard>

            <ResultCard
              title="Day you were born"
              icon={<Sun aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              <p className="text-lg font-semibold text-slate-900">{result.dayOfWeekBorn}</p>
              <p className="mt-1 text-sm text-slate-600">{formatDate(birth ?? today())}</p>
            </ResultCard>

            <ResultCard
              title="Star sign"
              icon={<Sparkles aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              <p className="text-lg font-semibold text-slate-900">
                <span aria-hidden="true" className="mr-2 text-2xl">
                  {result.zodiacSign.symbol}
                </span>
                {result.zodiacSign.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">{result.zodiacSign.dateRange}</p>
            </ResultCard>

            <ResultCard
              title="Chinese zodiac"
              icon={<Moon aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              <p className="text-lg font-semibold text-slate-900">
                {result.chineseZodiac.element} {result.chineseZodiac.animal}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The animal changes at the lunar new year, so dates in January and early February can
                belong to the previous year&rsquo;s animal.
              </p>
            </ResultCard>

            <ResultCard
              title="Life path number"
              icon={<Hash aria-hidden="true" className="h-4 w-4 text-brand-600" />}
            >
              <p className="text-lg font-semibold text-slate-900">
                {formatNumber(result.lifePathNumber, 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Every digit of the date of birth added together and reduced to one number, keeping 11,
                22 and 33.
              </p>
            </ResultCard>
          </div>
        </>
      ) : null}

      <p className="text-xs text-slate-500">
        Limits for this tool: {limits.note}
      </p>
    </div>
  );
}
