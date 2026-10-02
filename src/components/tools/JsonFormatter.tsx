'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Wand2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Minimize2,
  ArrowUpDown,
  Repeat,
  Clipboard,
  FileCode,
} from 'lucide-react';
import {
  validateJson,
  formatJson,
  repairJson,
  sortJsonKeys,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
  SAMPLE_JSON_TEMPLATES,
  IndentOption,
} from '@/core/engine/jsonFormatterEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

// Recursive Tree View Component for Interactive JSON Visualizer
function JsonTreeNode({ name, value, depth = 0 }: { name?: string; value: any; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth < 2);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const count = isArray ? value.length : isObject ? Object.keys(value).length : 0;

  if (!isExpandable) {
    let typeClass = 'text-emerald-600';
    let valStr = String(value);

    if (typeof value === 'string') {
      typeClass = 'text-blue-600';
      valStr = `"${value}"`;
    } else if (typeof value === 'boolean') {
      typeClass = 'text-purple-600';
    } else if (value === null) {
      typeClass = 'text-rose-500';
      valStr = 'null';
    }

    return (
      <div className="flex items-baseline gap-1 py-0.5 font-mono text-xs hover:bg-slate-100/60 px-1 rounded select-text">
        {name && <span className="text-slate-800 font-semibold">{name}:</span>}
        <span className={typeClass}>{valStr}</span>
      </div>
    );
  }

  return (
    <div className="font-mono text-xs select-none">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 py-1 hover:bg-slate-100/80 px-1 rounded cursor-pointer transition-colors"
      >
        <span className="text-slate-400">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        {name && <span className="text-slate-900 font-bold">{name}:</span>}
        <span className="text-slate-500 font-semibold text-[11px]">
          {isArray ? `Array[${count}]` : `{${count} keys}`}
        </span>
      </div>

      {isExpanded && (
        <div className="pl-4 border-l border-slate-200 ml-2 space-y-0.5 select-text">
          {isArray
            ? value.map((item: any, idx: number) => (
                <JsonTreeNode key={idx} name={String(idx)} value={item} depth={depth + 1} />
              ))
            : Object.entries(value).map(([k, v]) => (
                <JsonTreeNode key={k} name={k} value={v} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

export function JsonFormatter() {
  const [rawText, setRawText] = useState<string>('');
  const [indent, setIndent] = useState<IndentOption>('2-spaces');
  const [activeTab, setActiveTab] = useState<'formatted' | 'tree' | 'csv' | 'xml' | 'yaml'>('formatted');
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [fixSuccess, setFixSuccess] = useState<boolean>(false);
  const [validationBanner, setValidationBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Lock desktop body and html scrolling on desktop viewports so workspace fits comfortably in one viewport
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

  // Compute live validation from the current rawText input
  const validation = useMemo(() => {
    if (!rawText.trim()) return null;
    return validateJson(rawText);
  }, [rawText]);

  // Derived input metrics
  const inputMetrics = useMemo(() => {
    const chars = rawText.length;
    const lines = rawText ? rawText.split('\n').length : 0;
    const sizeBytes = new Blob([rawText]).size;
    const sizeKb = (sizeBytes / 1024).toFixed(1);
    return { chars, lines, sizeBytes, sizeKb };
  }, [rawText]);

  // Converted formats based on valid JSON
  const convertedCsv = useMemo(() => {
    if (!validation || !validation.isValid) return '';
    try {
      return jsonToCsv(validation.parsed);
    } catch (err: any) {
      return `CSV conversion error: ${err.message}`;
    }
  }, [validation]);

  const convertedXml = useMemo(() => {
    if (!validation || !validation.isValid) return '';
    try {
      return jsonToXml(validation.parsed);
    } catch (err: any) {
      return `XML conversion error: ${err.message}`;
    }
  }, [validation]);

  const convertedYaml = useMemo(() => {
    if (!validation || !validation.isValid) return '';
    try {
      return jsonToYaml(validation.parsed);
    } catch (err: any) {
      return `YAML conversion error: ${err.message}`;
    }
  }, [validation]);

  // Primary Action: Format JSON
  const handleFormat = (overrideIndent?: IndentOption) => {
    const currentIndent = overrideIndent || indent;
    if (!rawText.trim()) {
      setErrorMessage('Please enter or paste JSON to format.');
      return;
    }

    try {
      const formatted = formatJson(rawText, currentIndent);
      setFormattedOutput(formatted);
      setActiveTab('formatted');
      setErrorMessage(null);
      setValidationBanner(null);
      trackToolEvent('json-formatter', 'tool_completed');
    } catch (err: any) {
      setErrorMessage(`Unable to format JSON: ${err.message}`);
    }
  };

  // Minify Action
  const handleMinify = () => {
    if (!rawText.trim()) {
      setErrorMessage('Please enter or paste JSON to minify.');
      return;
    }

    try {
      const minified = formatJson(rawText, 'minify');
      setFormattedOutput(minified);
      setActiveTab('formatted');
      setErrorMessage(null);
      setValidationBanner(null);
      trackToolEvent('json-formatter', 'tool_completed');
    } catch (err: any) {
      setErrorMessage(`Unable to minify JSON: ${err.message}`);
    }
  };

  // Sort Keys Action
  const handleSortKeys = () => {
    if (!rawText.trim()) {
      setErrorMessage('Please enter or paste JSON to sort keys.');
      return;
    }

    try {
      const sorted = sortJsonKeys(rawText, indent);
      setFormattedOutput(sorted);
      setActiveTab('formatted');
      setErrorMessage(null);
      setValidationBanner('Keys sorted alphabetically!');
      setTimeout(() => setValidationBanner(null), 3000);
      trackToolEvent('json-formatter', 'tool_completed');
    } catch (err: any) {
      setErrorMessage(`Unable to sort keys: ${err.message}`);
    }
  };

  // Validate Action
  const handleValidateOnly = () => {
    if (!rawText.trim()) {
      setErrorMessage('Please enter or paste JSON to validate.');
      return;
    }

    const res = validateJson(rawText);
    if (res.isValid) {
      setValidationBanner(`✓ Valid JSON Document (${res.keysCount} keys, max depth ${res.depth})`);
      setErrorMessage(null);
      setTimeout(() => setValidationBanner(null), 4000);
    } else {
      setErrorMessage(`Syntax Error at Line ${res.line}, Col ${res.column}: ${res.message}`);
      setValidationBanner(null);
    }
  };

  // Paste from clipboard handler
  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setErrorMessage('Clipboard access is not supported by your browser. Please use Ctrl+V / Cmd+V to paste.');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setRawText(clipText);
        setErrorMessage(null);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch {
      setErrorMessage('Clipboard access was blocked by the browser. Please use Ctrl+V / Cmd+V to paste.');
    }
  };

  // Copy handler
  const handleCopy = async () => {
    const textToCopy =
      activeTab === 'csv'
        ? convertedCsv
        : activeTab === 'xml'
        ? convertedXml
        : activeTab === 'yaml'
        ? convertedYaml
        : formattedOutput || rawText;

    if (!textToCopy) {
      setErrorMessage('No content available to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to copy to clipboard.');
    }
  };

  // Download handler
  const handleDownload = (format: 'json' | 'csv' | 'xml' | 'yaml') => {
    let content = '';
    let mime = 'text/plain';
    let filename = `formatted.${format}`;

    if (format === 'json') {
      content = formattedOutput || rawText;
      mime = 'application/json';
    } else if (format === 'csv') {
      content = convertedCsv;
      mime = 'text/csv';
    } else if (format === 'xml') {
      content = convertedXml;
      mime = 'application/xml';
    } else if (format === 'yaml') {
      content = convertedYaml;
      mime = 'text/yaml';
    }

    if (!content) {
      setErrorMessage('No formatted content available to download.');
      return;
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // Auto-Fix JSON syntax
  const handleAutoFix = () => {
    if (!rawText.trim()) return;
    const repaired = repairJson(rawText);
    setRawText(repaired);
    setFixSuccess(true);
    setErrorMessage(null);
    setTimeout(() => setFixSuccess(false), 2500);

    // Auto format repaired text if valid
    const check = validateJson(repaired);
    if (check.isValid) {
      setFormattedOutput(formatJson(repaired, indent));
    }
  };

  // Swap output back to input
  const handleSwap = () => {
    if (!formattedOutput) return;
    setRawText(formattedOutput);
    setErrorMessage(null);
  };

  // Clear handler
  const handleClear = () => {
    setRawText('');
    setFormattedOutput('');
    setErrorMessage(null);
    setValidationBanner(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // File upload handler
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setRawText(result);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  // Sample loader
  const handleLoadSample = (key: keyof typeof SAMPLE_JSON_TEMPLATES = 'ecommerceOrder') => {
    if (SAMPLE_JSON_TEMPLATES[key]) {
      const sample = JSON.stringify(SAMPLE_JSON_TEMPLATES[key], null, 2);
      setRawText(sample);
      setFormattedOutput(sample);
      setErrorMessage(null);
      setValidationBanner(null);
    }
  };

  return (
    <div className="w-full bg-slate-50 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden">
      {/* Hidden File Input for JSON Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.jsonld"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          e.target.value = '';
        }}
      />

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
              Developer Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">JSON Formatter</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    JSON Formatter
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Format, validate, minify and copy JSON with a clean, easy-to-use editor.
                </p>
              </div>
            </div>

            {/* Truthful In-Browser Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Your JSON stays on your device
              </span>
              <span className="text-[11px] text-emerald-700 font-medium sm:before:content-['•_'] sm:before:mr-1">
                100% private
              </span>
            </div>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-red-800 text-xs shrink-0 animate-in fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-900 font-bold text-xs shrink-0 ml-2 cursor-pointer"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Validation Success Banner */}
          {validationBanner && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-emerald-800 text-xs shrink-0 animate-in fade-in"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">{validationBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationBanner(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs shrink-0 ml-2 cursor-pointer"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COMPACT TOOLBAR (Format, Minify, Validate, Indentation, Sort, Samples)    */}
        {/* ========================================================================= */}
        <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs my-1.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Left Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Format Button */}
            <button
              type="button"
              onClick={() => handleFormat()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              title="Format and pretty-print JSON"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Format JSON →</span>
            </button>

            {/* Minify Button */}
            <button
              type="button"
              onClick={handleMinify}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Minify into a compact single line"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Minify</span>
            </button>

            {/* Validate Button */}
            <button
              type="button"
              onClick={handleValidateOnly}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Validate JSON syntax"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Validate</span>
            </button>

            {/* Indent Selector */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5">
                Indent:
              </span>
              <button
                type="button"
                onClick={() => {
                  setIndent('2-spaces');
                  if (rawText.trim()) handleFormat('2-spaces');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  indent === '2-spaces' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                2 Spaces
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndent('4-spaces');
                  if (rawText.trim()) handleFormat('4-spaces');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  indent === '4-spaces' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                4 Spaces
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndent('tab');
                  if (rawText.trim()) handleFormat('tab');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  indent === 'tab' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Tab
              </button>
            </div>
          </div>

          {/* Right Secondary Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Sort Keys Button */}
            <button
              type="button"
              onClick={handleSortKeys}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Sort JSON keys alphabetically"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Sort Keys</span>
            </button>

            {/* Auto Fix Button */}
            <button
              type="button"
              onClick={handleAutoFix}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Automatically repair trailing commas, single quotes, unquoted keys"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{fixSuccess ? 'Repaired!' : 'Fix Syntax'}</span>
            </button>

            {/* Load Sample Dropdown */}
            <select
              onChange={(e) => {
                const key = e.target.value as keyof typeof SAMPLE_JSON_TEMPLATES;
                if (key) handleLoadSample(key);
              }}
              defaultValue=""
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="" disabled>
                Load Sample...
              </option>
              <option value="ecommerceOrder">E-Commerce Order</option>
              <option value="userProfile">User Profile</option>
              <option value="apiResponse">API Response</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: Two-Column Layout (Left: Input, Right: Output)            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0 my-1">
          {/* ===================================================================== */}
          {/* LEFT COLUMN: JSON Input Editor (6 cols on lg)                         */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Input Header Bar */}
            <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900">JSON Input</span>
                {/* Validation Status Badge */}
                {validation !== null ? (
                  validation.isValid ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Valid JSON</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>Invalid JSON</span>
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Empty</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Upload .json file"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!rawText}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg border transition shadow-2xs flex items-center gap-1 cursor-pointer ${
                    rawText
                      ? 'text-rose-600 bg-white border-rose-200 hover:bg-rose-50'
                      : 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Clear editor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Input Textarea */}
            <div className="flex-1 min-h-0 p-3 sm:p-3.5 flex flex-col relative bg-slate-50/20">
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste or type your JSON here..."
                aria-label="JSON Input"
                className="w-full flex-1 min-h-[260px] p-3.5 font-mono text-xs sm:text-sm text-slate-900 bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed transition-all overflow-y-auto select-text shadow-inner"
              />

              {/* Empty state hint */}
              {!rawText && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Paste or type your JSON here to format and validate.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports minified JSON, unformatted payloads, and auto-repairs syntax errors.
                  </p>
                </div>
              )}
            </div>

            {/* Input Footer Status / Error Details */}
            <div className="px-3.5 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 text-[11px] text-slate-500">
              {validation && !validation.isValid ? (
                <div className="flex items-center gap-1.5 text-rose-700 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span className="font-semibold truncate">
                    Line {validation.line}, Col {validation.column}: {validation.message}
                  </span>
                </div>
              ) : validation && validation.isValid ? (
                <div className="flex items-center gap-3 text-slate-600">
                  <span>
                    Keys: <strong className="text-slate-800">{validation.keysCount}</strong>
                  </span>
                  <span>
                    Depth: <strong className="text-slate-800">{validation.depth}</strong>
                  </span>
                  <span>
                    Size: <strong className="text-slate-800">{inputMetrics.sizeKb} KB</strong>
                  </span>
                </div>
              ) : (
                <span>0 characters • 0 lines</span>
              )}

              <div className="shrink-0 text-slate-400">
                {inputMetrics.chars.toLocaleString()} chars • {inputMetrics.lines} lines
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: Formatted JSON Output (6 cols on lg)                    */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Output View Tabs & Actions Header */}
            <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              {/* Output Format Tabs */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('formatted')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === 'formatted'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Formatted
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tree')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === 'tree'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Tree View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('csv')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === 'csv'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('xml')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === 'xml'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  XML
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('yaml')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    activeTab === 'yaml'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  YAML
                </button>
              </div>

              {/* Output Actions: Swap, Copy, Download */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Swap to Input */}
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={!formattedOutput}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  title="Swap formatted output into input editor"
                >
                  <Repeat className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Swap</span>
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shadow-2xs flex items-center gap-1 cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Copy current output to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      activeTab === 'csv'
                        ? 'csv'
                        : activeTab === 'xml'
                        ? 'xml'
                        : activeTab === 'yaml'
                        ? 'yaml'
                        : 'json'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                  title="Download output file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.{activeTab === 'tree' ? 'JSON' : activeTab.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Output Display Area */}
            <div className="flex-1 min-h-0 p-3 sm:p-3.5 flex flex-col bg-slate-50/20">
              {activeTab === 'formatted' && (
                <div className="relative flex-1 min-h-[260px] flex flex-col">
                  <textarea
                    readOnly
                    value={formattedOutput}
                    placeholder="Click 'Format JSON →' above to see formatted result..."
                    aria-label="Formatted JSON"
                    className="w-full flex-1 min-h-[260px] p-3.5 font-mono text-xs sm:text-sm text-slate-900 bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden focus:ring-1 focus:ring-blue-500 leading-relaxed overflow-y-auto select-text shadow-inner"
                  />
                  {!formattedOutput && (
                    <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                      <p className="text-xs font-semibold text-slate-400">
                        Pretty-printed JSON will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tree' && (
                <div className="flex-1 min-h-[260px] p-3.5 bg-white border border-slate-200/90 rounded-xl overflow-y-auto shadow-inner select-text">
                  {validation && validation.isValid ? (
                    <JsonTreeNode value={validation.parsed} />
                  ) : (
                    <div className="py-12 text-center">
                      <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-400">
                        {rawText.trim()
                          ? 'Fix JSON syntax errors to view interactive tree nodes.'
                          : 'Enter valid JSON to explore interactive tree view.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'csv' && (
                <textarea
                  readOnly
                  value={convertedCsv}
                  placeholder="CSV representation will appear here..."
                  aria-label="CSV representation"
                  className="w-full flex-1 min-h-[260px] p-3.5 font-mono text-xs text-slate-900 bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden leading-relaxed overflow-y-auto select-text shadow-inner"
                />
              )}

              {activeTab === 'xml' && (
                <textarea
                  readOnly
                  value={convertedXml}
                  placeholder="XML representation will appear here..."
                  aria-label="XML representation"
                  className="w-full flex-1 min-h-[260px] p-3.5 font-mono text-xs text-slate-900 bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden leading-relaxed overflow-y-auto select-text shadow-inner"
                />
              )}

              {activeTab === 'yaml' && (
                <textarea
                  readOnly
                  value={convertedYaml}
                  placeholder="YAML representation will appear here..."
                  aria-label="YAML representation"
                  className="w-full flex-1 min-h-[260px] p-3.5 font-mono text-xs text-slate-900 bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden leading-relaxed overflow-y-auto select-text shadow-inner"
                />
              )}
            </div>

            {/* Output Footer Status Bar */}
            <div className="px-3.5 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">
                Mode: {activeTab.toUpperCase()}
              </span>
              <span className="text-slate-400">
                {(formattedOutput ? formattedOutput.length : 0).toLocaleString()} chars •{' '}
                {formattedOutput ? formattedOutput.split('\n').length : 0} lines
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
