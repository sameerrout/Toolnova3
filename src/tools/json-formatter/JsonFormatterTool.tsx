'use client';

/**
 * JSON Formatter — beautify, validate, minify, sort and convert.
 *
 * Layout: input on the left, output on the right on desktop, stacked on mobile.
 * Live validation is limited to documents under 2 MB so that typing into a huge
 * paste never stutters; above that, the statistics refresh when an action runs.
 *
 * Output rendering has two deliberate size switches:
 *   - above 1 MB the coloured token view is replaced by plain text, because tens
 *     of thousands of spans are slower to scroll than they are helpful;
 *   - above 8 MB the output becomes a plain read-only textarea, because
 *     highlighting a document that size would freeze the tab.
 */

import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Braces,
  Check,
  ClipboardCopy,
  Download,
  Eraser,
  FileJson,
  Info,
  ListTree,
  Minimize2,
  TriangleAlert,
} from 'lucide-react';

import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressPanel } from '@/components/common/ProgressPanel';
import { useAdFreeZone } from '@/components/ads/AdSlot';
import { useObjectUrls, useToolJob, useToolLimits } from '@/hooks/useToolJob';
import { getTool } from '@/data/toolRegistry';
import { validateFiles } from '@/lib/validation';
import { triggerDownload } from '@/lib/bytes';
import { yieldToBrowser } from '@/lib/progress';
import { formatBytes, formatNumber } from '@/lib/format';
import {
  canConvertToCsv,
  formatBytesSaved,
  formatJson,
  getJsonStats,
  jsonToCsv,
  minifyJson,
  parseJson,
  sortJsonKeys,
  utf8ByteLength,
  type JsonError,
  type JsonIndent,
  type JsonStats,
} from './engine';

/** Documents up to this size are parsed on every (deferred) keystroke. */
const LIVE_PARSE_BYTES = 2 * 1024 * 1024;
/** Above this size the output is plain text rather than coloured tokens. */
const TOKEN_VIEW_BYTES = 1024 * 1024;
/** Above this size the output becomes a read-only textarea. */
const PLAIN_VIEW_BYTES = 8 * 1024 * 1024;
/** Hard cap on rendered spans, a second guard behind the byte threshold. */
const MAX_TOKENS = 30000;

type TokenKind = 'key' | 'string' | 'number' | 'literal' | 'punctuation' | 'plain';

interface Token {
  text: string;
  kind: TokenKind;
}

const TOKEN_CLASS: Record<TokenKind, string> = {
  key: 'font-medium text-brand-700',
  string: 'text-emerald-700',
  number: 'text-amber-700',
  literal: 'text-violet-700',
  punctuation: 'text-slate-500',
  plain: 'text-slate-800',
};

const JSON_TOKEN_SOURCE =
  /"(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

/**
 * Splits formatted JSON into coloured tokens.
 * Returns `null` when the document is too large to render span by span.
 */
function tokeniseJson(text: string): Token[] | null {
  const tokens: Token[] = [];
  const pattern = new RegExp(JSON_TOKEN_SOURCE.source, 'g');
  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match !== null) {
    if (tokens.length >= MAX_TOKENS) return null;

    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), kind: 'plain' });
    }

    const raw = match[0];
    let kind: TokenKind;
    if (raw.startsWith('"')) kind = match[1] ? 'key' : 'string';
    else if (raw === 'true' || raw === 'false' || raw === 'null') kind = 'literal';
    else if (raw.length === 1 && '{}[],:'.includes(raw)) kind = 'punctuation';
    else kind = 'number';

    tokens.push({ text: raw, kind });
    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), kind: 'plain' });
  }
  return tokens;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="text-xs font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

type TransformKind = 'format' | 'minify' | 'sort' | 'csv';

export function JsonFormatterTool() {
  const limits = useToolLimits('json-formatter');
  const tool = getTool('json-formatter');
  const { run, cancel, running, progress, status, error: jobError, cancelled } = useToolJob();
  const urls = useObjectUrls();

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState<JsonIndent>(2);
  const [parseError, setParseError] = useState<JsonError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [fileName, setFileName] = useState('formatted.json');
  const [rejected, setRejected] = useState<string[]>([]);
  const [recentValue, setRecentValue] = useState<unknown>(undefined);
  const [recentSource, setRecentSource] = useState('');
  const lastDownloadUrl = useRef<string | null>(null);

  const deferredInput = useDeferredValue(input);
  const inputBytes = useMemo(() => utf8ByteLength(input), [input]);
  const outputBytes = useMemo(() => utf8ByteLength(output), [output]);
  const stale = deferredInput !== input;

  // Live validation, deliberately skipped for very large documents.
  const liveParse = useMemo(() => {
    if (deferredInput.trim().length === 0) return null;
    if (utf8ByteLength(deferredInput) > LIVE_PARSE_BYTES) return null;
    return parseJson(deferredInput);
  }, [deferredInput]);

  const statsValue = useMemo(() => {
    if (liveParse?.ok) return liveParse.value;
    if (recentSource.length > 0 && recentSource === deferredInput) return recentValue;
    return undefined;
  }, [liveParse, recentSource, recentValue, deferredInput]);

  const stats: JsonStats | null = useMemo(
    () => (statsValue === undefined ? null : getJsonStats(statsValue)),
    [statsValue]
  );

  const csvReady = useMemo(() => canConvertToCsv(statsValue), [statsValue]);
  const comparison = useMemo(
    () => (output.length > 0 ? formatBytesSaved(inputBytes, outputBytes) : null),
    [inputBytes, outputBytes, output.length]
  );

  const shownError = liveParse && !liveParse.ok ? liveParse.error : parseError;
  const validButUnchecked = liveParse === null && shownError === null && input.trim().length > 0;
  const tooLargeForLive = inputBytes > LIVE_PARSE_BYTES;
  const plainTextareaView = inputBytes > PLAIN_VIEW_BYTES;

  const tokens = useMemo(() => {
    if (plainTextareaView || output.length === 0 || outputBytes > TOKEN_VIEW_BYTES) return null;
    return tokeniseJson(output);
  }, [output, outputBytes, plainTextareaView]);

  useAdFreeZone(running || output.length > 0);

  const resetMessages = useCallback(() => {
    setParseError(null);
    setActionError(null);
    setActionNote(null);
  }, []);

  /** Runs one of the transforms over the current input. */
  const applyTransform = useCallback(
    (kind: TransformKind) => {
      resetMessages();

      const parsed = parseJson(input);
      if (!parsed.ok) {
        setParseError(parsed.error);
        setOutput('');
        return;
      }

      setRecentValue(parsed.value);
      setRecentSource(input);

      if (kind === 'csv') {
        try {
          setOutput(jsonToCsv(parsed.value));
          setFileName('data.csv');
          setActionNote('Written as CSV with a header row built from every object key.');
        } catch (error) {
          setOutput('');
          setActionError(
            error instanceof Error ? error.message : 'This document cannot be converted to CSV.'
          );
        }
        return;
      }

      const result =
        kind === 'format'
          ? formatJson(input, indent)
          : kind === 'minify'
            ? minifyJson(input)
            : sortJsonKeys(input, indent);

      if (!result.ok) {
        setParseError(result.error);
        setOutput('');
        return;
      }

      setOutput(result.output);
      setFileName(
        kind === 'minify' ? 'minified.json' : kind === 'sort' ? 'sorted.json' : 'formatted.json'
      );
      setActionNote(
        kind === 'format'
          ? `Indented with ${indent === '\t' ? 'tabs' : `${indent} spaces`}.`
          : kind === 'minify'
            ? 'All insignificant whitespace removed.'
            : 'Object keys sorted alphabetically at every level. Array order is unchanged.'
      );
    },
    [indent, input, resetMessages]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const validation = await validateFiles(files, {
        limits,
        acceptedExtensions: tool?.accept ?? ['.json', '.txt'],
        acceptAttribute: tool?.acceptAttribute ?? '.json,.txt,application/json',
      });

      setRejected(validation.rejected.map((issue) => `${issue.fileName}: ${issue.message}`));
      const chosen = validation.accepted[0];
      if (!chosen) return;

      resetMessages();
      setOutput('');
      setRecentValue(undefined);
      setRecentSource('');
      setFileName(`${chosen.name.replace(/\.(json|txt|geojson)$/i, '')}-formatted.json`);

      const loaded = await run(async (reporter) => {
        reporter.beginStage(`Reading ${chosen.name}`, 0.6, 'reading');
        const text = await chosen.text();
        reporter.throwIfCancelled();

        reporter.beginStage('Formatting', 0.4);
        // Hand the frame back so the progress panel paints before the parse.
        await yieldToBrowser();
        const formatted = formatJson(text, indent);
        const parsed = parseJson(text);
        return { text, formatted, value: parsed.ok ? parsed.value : undefined };
      });

      if (!loaded) return;

      setInput(loaded.text);
      setRecentSource(loaded.text);

      if (loaded.formatted.ok) {
        setOutput(loaded.formatted.output);
        setRecentValue(loaded.value);
        setActionNote(`Loaded ${chosen.name} and formatted it.`);
      } else {
        setParseError(loaded.formatted.error);
      }
    },
    [indent, limits, resetMessages, run, tool]
  );

  const handleCopy = useCallback(async () => {
    if (output.length === 0) return;
    try {
      await navigator.clipboard.writeText(output);
      setActionNote('Copied to the clipboard.');
    } catch {
      setActionError('The browser blocked clipboard access. Select the output and copy it manually.');
    }
  }, [output]);

  const handleDownload = useCallback(() => {
    if (output.length === 0) return;
    const isCsv = fileName.endsWith('.csv');
    const blob = new Blob([output], {
      type: isCsv ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    });
    // Release the previous blob before creating the next one.
    if (lastDownloadUrl.current) urls.revoke(lastDownloadUrl.current);
    const url = urls.create(blob);
    lastDownloadUrl.current = url;
    triggerDownload(url, fileName);
  }, [fileName, output, urls]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setRejected([]);
    setRecentValue(undefined);
    setRecentSource('');
    setFileName('formatted.json');
    resetMessages();
  }, [resetMessages]);

  const canTransform = input.trim().length > 0 && !running;

  return (
    <div className="space-y-6">
      <FileDropZone
        onFiles={(files) => void handleFiles(files)}
        accept={tool?.acceptAttribute ?? '.json,.txt,application/json'}
        multiple={false}
        disabled={running}
        label="Drop a JSON file"
        hint=".json, .txt or .geojson, up to the size limit for this device. The file is read and parsed in this tab."
      />

      {rejected.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert aria-hidden="true" className="h-4 w-4" />
            That file could not be used
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {rejected.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {running ? <ProgressPanel progress={progress} status={status} onCancel={cancel} /> : null}

      {cancelled ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Cancelled. The file was not loaded and your existing text is unchanged.
        </p>
      ) : null}

      {jobError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <p className="font-semibold">{jobError.message}</p>
          {jobError.hint ? <p className="mt-1 text-red-800">{jobError.hint}</p> : null}
        </div>
      ) : null}

      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label htmlFor="json-indent" className="field-label">
              Indentation
            </label>
            <select
              id="json-indent"
              value={indent === '\t' ? 'tab' : String(indent)}
              onChange={(event) =>
                setIndent(event.target.value === 'tab' ? '\t' : (Number(event.target.value) as 2 | 4))
              }
              className="field-input w-40"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>

          <p aria-live="polite" className="text-xs text-slate-500">
            {formatBytes(inputBytes)} in
            {output.length > 0 ? ` · ${formatBytes(outputBytes)} out` : ''}
            {stale ? ' · checking…' : ''}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTransform('format')}
            disabled={!canTransform}
            className="btn-primary"
          >
            <Braces aria-hidden="true" className="h-4 w-4" />
            Format
          </button>
          <button
            type="button"
            onClick={() => applyTransform('minify')}
            disabled={!canTransform}
            className="btn-secondary"
          >
            <Minimize2 aria-hidden="true" className="h-4 w-4" />
            Minify
          </button>
          <button
            type="button"
            onClick={() => applyTransform('sort')}
            disabled={!canTransform}
            className="btn-secondary"
          >
            <ListTree aria-hidden="true" className="h-4 w-4" />
            Sort keys
          </button>
          <button
            type="button"
            onClick={() => applyTransform('csv')}
            disabled={!canTransform || !csvReady}
            title={
              csvReady
                ? 'Write the array of flat objects as CSV'
                : 'Available only when the document is an array of flat objects'
            }
            className="btn-secondary"
          >
            <ArrowRightLeft aria-hidden="true" className="h-4 w-4" />
            Convert to CSV
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={output.length === 0}
            className="btn-secondary"
          >
            <ClipboardCopy aria-hidden="true" className="h-4 w-4" />
            Copy output
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={output.length === 0}
            className="btn-secondary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download {fileName.endsWith('.csv') ? 'CSV' : 'JSON'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={input.length === 0 && output.length === 0}
            className="btn-secondary"
          >
            <Eraser aria-hidden="true" className="h-4 w-4" />
            Clear
          </button>
        </div>

        {!csvReady ? (
          <p className="mt-3 text-xs text-slate-500">
            Convert to CSV is available only for an array of flat objects, which is the shape a
            spreadsheet can hold without losing data.
          </p>
        ) : null}

        {actionNote ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-emerald-800">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            {actionNote}
          </p>
        ) : null}

        {actionError ? (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">
            {actionError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="json-input-heading" className="card">
          <h2 id="json-input-heading" className="text-sm font-semibold text-slate-900">
            Input
          </h2>
          <label htmlFor="json-input" className="sr-only">
            JSON input
          </label>
          <textarea
            id="json-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              resetMessages();
            }}
            rows={18}
            spellCheck={false}
            placeholder='{"example": "Paste your JSON here"}'
            className="field-input mt-3 min-h-[18rem] resize-y font-mono text-[13px] leading-6"
            aria-describedby="json-input-help"
          />
          <p id="json-input-help" className="mt-2 text-xs text-slate-500">
            {input.length === 0
              ? 'Type, paste or drop a JSON file. Nothing is uploaded.'
              : `${formatNumber(input.length, 0)} characters · ${formatBytes(inputBytes)}`}
          </p>

          {tooLargeForLive ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This document is larger than 2 MB, so live checking is paused. Choose an action to
              check it and refresh the statistics.
            </p>
          ) : null}

          {shownError ? (
            <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-900">{shownError.message}</p>
              <p className="mt-0.5 text-xs text-red-800">
                Line {shownError.line}, column {shownError.column}
              </p>
              <pre className="mt-2 overflow-x-auto whitespace-pre rounded-lg bg-white p-2 font-mono text-xs text-slate-800">
                {shownError.snippet}
              </pre>
            </div>
          ) : validButUnchecked ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Not checked yet. Choose an action above to validate this document.
            </p>
          ) : liveParse?.ok ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              Valid JSON
            </p>
          ) : null}
        </section>

        <section aria-labelledby="json-output-heading" className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="json-output-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <FileJson aria-hidden="true" className="h-4 w-4 text-brand-600" />
              Output
            </h2>
            {comparison ? (
              <p aria-live="polite" className="text-xs text-slate-600">
                {formatBytes(inputBytes)} <span aria-hidden="true">→</span>{' '}
                {formatBytes(outputBytes)} · {comparison.label}
              </p>
            ) : null}
          </div>

          {output.length === 0 ? (
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Choose Format, Minify, Sort keys or Convert to CSV and the result appears here.
            </p>
          ) : plainTextareaView ? (
            <>
              <label htmlFor="json-output-plain" className="sr-only">
                Formatted JSON output
              </label>
              <textarea
                id="json-output-plain"
                readOnly
                value={output}
                rows={18}
                spellCheck={false}
                className="field-input mt-3 min-h-[18rem] resize-y font-mono text-[13px] leading-6"
              />
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The input is over 8 MB ({formatBytes(inputBytes)}), so the coloured syntax view has
                been replaced with plain read-only text. Highlighting a document this size would block
                the page.
              </p>
            </>
          ) : tokens ? (
            <pre className="mt-3 max-h-[32rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[13px] leading-6">
              <code>
                {tokens.map((token, index) => (
                  <span key={index} className={TOKEN_CLASS[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </code>
            </pre>
          ) : (
            <>
              <pre className="mt-3 max-h-[32rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[13px] leading-6 text-slate-800">
                {output}
              </pre>
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Colour highlighting is switched off above 1 MB to keep scrolling smooth. The text is
                complete and can be copied or downloaded as usual.
              </p>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="json-stats-heading" className="card">
        <h2 id="json-stats-heading" className="text-sm font-semibold text-slate-900">
          Document statistics
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Counted from the parsed document, so the figures describe the data rather than the
          formatting.
        </p>

        {stats === null ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Statistics appear once the document parses. Enter, paste or drop valid JSON to see them.
          </p>
        ) : (
          <dl className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            <StatRow label="Nodes" value={formatNumber(stats.nodes, 0)} />
            <StatRow label="Maximum depth" value={formatNumber(stats.depth, 0)} />
            <StatRow label="Object keys" value={formatNumber(stats.keys, 0)} />
            <StatRow label="Objects" value={formatNumber(stats.objects, 0)} />
            <StatRow label="Arrays" value={formatNumber(stats.arrays, 0)} />
            <StatRow label="Strings" value={formatNumber(stats.strings, 0)} />
            <StatRow label="Numbers" value={formatNumber(stats.numbers, 0)} />
            <StatRow label="Booleans" value={formatNumber(stats.booleans, 0)} />
            <StatRow label="Nulls" value={formatNumber(stats.nulls, 0)} />
            <StatRow label="Minified size" value={formatBytes(stats.bytes)} />
            <StatRow label="Input size" value={formatBytes(inputBytes)} />
            <StatRow
              label="Output size"
              value={output.length > 0 ? formatBytes(outputBytes) : 'not generated yet'}
            />
          </dl>
        )}

        {comparison && comparison.savedBytes !== 0 ? (
          <p className="mt-3 text-xs text-slate-600">
            The output is {comparison.label} than the input as typed.
          </p>
        ) : null}
      </section>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          API responses and configuration files often hold keys and passwords, so parsing happens
          entirely in this tab. There is no request to any server, and no copy of your document is
          stored.
        </span>
      </p>
    </div>
  );
}
