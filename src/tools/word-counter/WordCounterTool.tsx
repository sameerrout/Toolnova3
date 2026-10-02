'use client';

/**
 * Word Counter — live statistics for typed or pasted text.
 *
 * The analysis is deliberately decoupled from typing: `useDeferredValue` keeps
 * the textarea responsive while React re-runs `analyseText` on the previous
 * value, which is what stops a 500 KB paste from blocking every keystroke.
 *
 * A dropped file is read with `file.text()` through `useToolJob`, so a slow
 * read shows real progress and can be cancelled. Nothing leaves the device.
 */

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ClipboardCheck, ClipboardCopy, Download, Eraser, FileText } from 'lucide-react';

import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useToolLimits } from '@/hooks/useToolJob';
import { getTool } from '@/data/toolRegistry';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { formatBytes, formatNumber } from '@/lib/format';
import { analyseText, buildStatisticsReport, type TextAnalysis } from './engine';

type KeywordRow = TextAnalysis['keywordDensity'][number];

/** Above this size the plain-textarea hint changes and analysis is deferred harder. */
const LARGE_TEXT_BYTES = 2 * 1024 * 1024;

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <dt className="text-xs font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/** Minutes as a friendly phrase: `under a minute`, `4 min`, `1 h 12 min`. */
function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${formatNumber(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours} h ${rest} min`;
}

export function WordCounterTool() {
  const limits = useToolLimits('word-counter');
  const tool = getTool('word-counter');
  const { run, cancel, running, progress, status, error, cancelled } = useToolJob();
  const urls = useObjectUrls();

  const [text, setText] = useState('');
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAdFreeZone(running);

  // Analysis runs against the deferred value, so typing stays at full speed.
  const deferredText = useDeferredValue(text);
  const analysis = useMemo(() => analyseText(deferredText), [deferredText]);
  const stale = deferredText !== text;

  const byteSize = useMemo(() => new Blob([deferredText]).size, [deferredText]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const result = await validateFiles(files, {
        limits,
        acceptedExtensions: tool?.accept ?? ['.txt', '.md', '.csv'],
        acceptAttribute: tool?.acceptAttribute ?? '.txt,.md,.csv,text/plain',
      });

      setRejected(result.rejected.map((issue) => `${issue.fileName}: ${issue.message}`));

      const chosen = result.accepted[0];
      if (!chosen) return;

      await run(async (reporter) => {
        reporter.beginStage(`Reading ${chosen.name}`, 0.8, 'reading');
        const contents = await chosen.text();
        reporter.throwIfCancelled();
        reporter.report(1, 'Counting words');

        setText(contents);
        setSourceName(`${chosen.name} (${formatBytes(chosen.size)})`);
        return contents;
      });
    },
    [limits, run, tool]
  );

  const handleCopy = useCallback(async () => {
    if (text.length === 0) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; select the text so the user can copy it.
      textareaRef.current?.select();
    }
  }, [text]);

  const handleDownloadReport = useCallback(() => {
    if (analysis.words === 0) return;
    const report = buildStatisticsReport(analysis, sourceName ?? undefined);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = urls.create(blob);
    triggerDownload(url, 'word-count-report.txt');
  }, [analysis, sourceName, urls]);

  const handleClear = useCallback(() => {
    setText('');
    setSourceName(null);
    setRejected([]);
    urls.revokeAll();
    textareaRef.current?.focus();
  }, [urls]);

  const readingHint = `Reading ${formatMinutes(analysis.readingTimeMinutes)} · speaking ${formatMinutes(
    analysis.speakingTimeMinutes
  )}`;

  return (
    <div className="space-y-6">
      <div className="card">
        <label htmlFor="word-counter-text" className="field-label">
          Your text
        </label>
        <textarea
          id="word-counter-text"
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setSourceName(null);
          }}
          rows={16}
          spellCheck={false}
          placeholder="Type or paste your text here. Everything is counted on this device."
          className="field-input min-h-[16rem] resize-y font-mono text-[13px] leading-6"
          aria-describedby="word-counter-help"
        />
        <p id="word-counter-help" className="mt-2 text-xs text-slate-500">
          {formatBytes(byteSize)}
          {sourceName ? ` · loaded from ${sourceName}` : ''} · nothing is uploaded, and the text is
          gone as soon as you close the tab.
        </p>

        {byteSize > LARGE_TEXT_BYTES ? (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            This is a large document ({formatBytes(byteSize)}). Statistics update a moment after you
            stop typing so the page stays responsive.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={text.length === 0}
            className="btn-secondary"
          >
            {copied ? (
              <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ClipboardCopy aria-hidden="true" className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy text'}
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={analysis.words === 0}
            className="btn-secondary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download statistics (.txt)
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={text.length === 0}
            className="btn-secondary"
          >
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">
            {error.message}
          </p>
        ) : null}

        {cancelled ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            File reading was cancelled. Your existing text is unchanged.
          </p>
        ) : null}
      </div>

      <FileDropZone
        onFiles={(files) => void handleFiles(files)}
        accept={tool?.acceptAttribute ?? '.txt,.md,.csv,text/plain'}
        multiple={false}
        disabled={running}
        label="Drop a text file to count it"
        hint="Plain text, Markdown, CSV, JSON or subtitle files. The file is read by your browser on this device."
      />

      {rejected.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {rejected.length === 1 ? 'One file was skipped' : `${rejected.length} files were skipped`}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {rejected.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {running ? (
        <ProgressPanel
          progress={progress}
          status={status}
          completed={0}
          total={0}
          onCancel={cancel}
        />
      ) : null}

      <section aria-labelledby="word-counter-stats" className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="word-counter-stats"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <BarChart3 aria-hidden="true" className="h-4 w-4 text-brand-600" />
            Live statistics
          </h2>
          <p aria-live="polite" className="text-xs text-slate-500">
            {stale ? 'Updating…' : readingHint}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Words" value={formatNumber(analysis.words, 0)} />
          <StatTile label="Characters" value={formatNumber(analysis.characters, 0)} />
          <StatTile
            label="Characters without spaces"
            value={formatNumber(analysis.charactersNoSpaces, 0)}
          />
          <StatTile label="Sentences" value={formatNumber(analysis.sentences, 0)} />
          <StatTile label="Paragraphs" value={formatNumber(analysis.paragraphs, 0)} />
          <StatTile label="Lines" value={formatNumber(analysis.lines, 0)} />
          <StatTile label="Unique words" value={formatNumber(analysis.uniqueWords, 0)} />
          <StatTile label="Syllables" value={formatNumber(analysis.syllables, 0)} />
          <StatTile
            label="Average word length"
            value={formatNumber(analysis.averageWordLength)}
            hint="characters per word"
          />
          <StatTile
            label="Average sentence length"
            value={formatNumber(analysis.averageSentenceLength)}
            hint="words per sentence"
          />
          <StatTile
            label="Reading time"
            value={formatMinutes(analysis.readingTimeMinutes)}
            hint="at 200 words per minute"
          />
          <StatTile
            label="Speaking time"
            value={formatMinutes(analysis.speakingTimeMinutes)}
            hint="at 130 words per minute"
          />
        </dl>

        {analysis.longestWord ? (
          <p className="mt-3 text-xs text-slate-500">
            Longest word: <span className="font-medium text-slate-700">{analysis.longestWord}</span>
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="word-counter-keywords" className="card">
          <h2 id="word-counter-keywords" className="text-sm font-semibold text-slate-900">
            Keyword density
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            The ten most frequent words, with common stop words such as “the” and “and” removed.
          </p>

          {analysis.keywordDensity.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Add some text to see which words it repeats.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Keyword density: word, count and percentage of all words
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Word
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Count
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Density
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.keywordDensity.map((entry: KeywordRow) => (
                    <tr key={entry.word}>
                      <td className="py-2 pr-3 font-medium text-slate-900">{entry.word}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-700">
                        {formatNumber(entry.count, 0)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-700">
                        {formatNumber(entry.percent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="word-counter-readability" className="card">
          <h2 id="word-counter-readability" className="text-sm font-semibold text-slate-900">
            Readability
          </h2>

          <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
            {formatNumber(analysis.readability.fleschReadingEase, 1)}
          </p>
          <p className="text-xs text-slate-500">Flesch Reading Ease (higher is easier)</p>

          <p className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-900">
            {analysis.readability.label}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Flesch-Kincaid grade level</dt>
              <dd className="font-medium tabular-nums text-slate-900">
                {formatNumber(analysis.readability.fleschKincaidGrade, 1)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Words per sentence</dt>
              <dd className="font-medium tabular-nums text-slate-900">
                {formatNumber(analysis.averageSentenceLength)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Syllables per word</dt>
              <dd className="font-medium tabular-nums text-slate-900">
                {analysis.words > 0
                  ? formatNumber(analysis.syllables / analysis.words)
                  : '0'}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-slate-500">
            Syllables are estimated by counting vowel groups, so the score is close rather than
            exact for unusual words.
          </p>
        </section>
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <FileText aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The downloadable report contains the statistics only, never the text itself, so it is safe
          to share when the wording is confidential.
        </span>
      </p>
    </div>
  );
}
