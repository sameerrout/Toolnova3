'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Type,
  FileText,
  Copy,
  Check,
  Trash2,
  Download,
  Clipboard,
  Sparkles,
  ShieldCheck,
  Clock,
  Volume2,
  BookOpen,
  Hash,
  Share2,
  BarChart2,
  AlertCircle,
  AlignLeft,
  FileCheck,
} from 'lucide-react';
import {
  calculateTextMetrics,
  calculateReadability,
  calculateKeywordDensity,
  calculateSocialLimits,
  transformCase,
  cleanText,
} from '@/core/engine/wordCounterEngine';
import { trackToolEvent } from '@/lib/analytics/tracker';

const SAMPLE_TEXT = `In modern software engineering, privacy-first web applications represent a critical paradigm shift. By executing computationally intensive tasks directly inside the user's browser via WebAssembly and HTML5 Canvas, platforms can eliminate unnecessary cloud data transfers. This architecture guarantees that sensitive documents, financial receipts, and personal photos remain completely confidential on local hardware.

Furthermore, client-side tools reduce server infrastructure overhead, lower bandwidth consumption, and deliver instantaneous processing speeds without latency. When building scalable digital products, engineers must prioritize data security, accessible interface design, and transparent user controls.`;

export function WordCounter() {
  const [text, setText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'readability' | 'keywords' | 'social'>('readability');
  const [keywordN, setKeywordN] = useState<1 | 2 | 3>(1);
  const [excludeStopWords, setExcludeStopWords] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedStats, setCopiedStats] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Compute live metrics dynamically from the actual text (single source of truth)
  const metrics = useMemo(() => calculateTextMetrics(text), [text]);
  const readability = useMemo(() => calculateReadability(text, metrics), [text, metrics]);
  const keywords = useMemo(
    () => calculateKeywordDensity(text, keywordN, excludeStopWords, 8),
    [text, keywordN, excludeStopWords]
  );
  const socialLimits = useMemo(() => calculateSocialLimits(text), [text]);

  // Track completion occasionally when a meaningful piece of text is processed
  useEffect(() => {
    if (metrics.words >= 5) {
      trackToolEvent('word-counter', 'tool_completed');
    }
  }, [metrics.words]);

  // Paste handler using browser clipboard API with graceful fallback
  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setErrorMessage('Clipboard access is not supported by your browser. Please press Ctrl+V / Cmd+V to paste.');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText((prev) => (prev ? prev + '\n' + clipText : clipText));
        setErrorMessage(null);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch {
      setErrorMessage('Clipboard access was blocked by the browser. Please use Ctrl+V / Cmd+V to paste.');
    }
  };

  // Copy current text to clipboard
  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to copy text to clipboard.');
    }
  };

  // Clear text handler
  const handleClear = () => {
    setText('');
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Load sample text handler
  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
    setErrorMessage(null);
  };

  // Copy full statistical report to clipboard
  const handleCopyStats = async () => {
    const summary = `Toolino Text Statistics Report
================================
Words: ${metrics.words.toLocaleString()}
Characters (with spaces): ${metrics.charactersWithSpaces.toLocaleString()}
Characters (without spaces): ${metrics.charactersWithoutSpaces.toLocaleString()}
Sentences: ${metrics.sentences.toLocaleString()}
Paragraphs: ${metrics.paragraphs.toLocaleString()}
Lines: ${metrics.lines.toLocaleString()}
Reading Time: ${metrics.readingTimeString}
Speaking Time: ${metrics.speakingTimeString}
Pages: ~${metrics.estimatedPages} pages
Avg Word Length: ${metrics.avgWordLength} characters
Avg Sentence Length: ${metrics.avgSentenceLength} words

Readability:
Flesch Reading Ease: ${readability.fleschReadingEase}/100 (${readability.readingEaseLabel})
Grade Level: ${readability.schoolGradeLabel}
`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedStats(true);
      setTimeout(() => setCopiedStats(false), 2000);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Failed to copy statistics summary.');
    }
  };

  // Download text file
  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'word_counter_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // Case transforms
  const handleCaseChange = (c: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'kebab' | 'snake') => {
    if (!text) return;
    setText(transformCase(text, c));
  };

  // Text cleanup
  const handleClean = (action: 'trim-spaces' | 'remove-empty-lines' | 'join-lines' | 'remove-duplicates' | 'strip-html') => {
    if (!text) return;
    setText(cleanText(text, action));
  };

  return (
    <div className="w-full bg-slate-50 font-sans flex flex-col min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden">
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
              Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">Word Counter</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <Type className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Word Counter
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Count words, characters, sentences and other useful text statistics instantly as you type.
                </p>
              </div>
            </div>

            {/* Truthful In-Browser Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Your text stays on your device
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
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: Two-Column Layout (Left: Editor, Right: Live Statistics)  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 min-h-0 my-2">
          {/* ===================================================================== */}
          {/* LEFT COLUMN: Large Comfortable Text Editor (7 cols on lg)             */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Editor Header Bar with Quick Action Buttons */}
            <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Your Text</span>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {metrics.words.toLocaleString()} {metrics.words === 1 ? 'word' : 'words'} •{' '}
                  {metrics.charactersWithSpaces.toLocaleString()} chars
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Paste from clipboard"
                  aria-label="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Load sample paragraph"
                  aria-label="Load sample text"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">Sample</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  disabled={!text}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : text
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Copy current text to clipboard"
                  aria-label="Copy text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!text}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                    text
                      ? 'text-rose-600 bg-white border-rose-200 hover:bg-rose-50'
                      : 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Clear all text"
                  aria-label="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Main Textarea Area */}
            <div className="flex-1 min-h-0 p-3 sm:p-3.5 flex flex-col relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing or paste your text here to see live statistics..."
                aria-label="Text to analyze"
                className="w-full flex-1 min-h-[220px] p-3.5 text-sm sm:text-base text-slate-800 bg-slate-50/40 hover:bg-slate-50/60 focus:bg-white border border-slate-200/90 rounded-xl resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed font-sans transition-all overflow-y-auto select-text shadow-inner"
              />

              {/* Empty state hint */}
              {!text && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <Type className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Start typing or paste your text to see live statistics.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Words, characters, sentences, reading time, and readability calculate in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Transformation & Export Bar */}
            <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
              {/* Case Converters */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                  Case:
                </span>
                <button
                  type="button"
                  onClick={() => handleCaseChange('sentence')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  Sentence
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('title')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('upper')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  UPPER
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('lower')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  lower
                </button>
                <button
                  type="button"
                  onClick={() => handleCaseChange('camel')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  camelCase
                </button>
              </div>

              {/* Cleanup & Export */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleClean('trim-spaces')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  title="Remove redundant spaces"
                >
                  Trim Spaces
                </button>
                <button
                  type="button"
                  onClick={() => handleClean('remove-empty-lines')}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  title="Remove empty blank lines"
                >
                  Clean Lines
                </button>
                <button
                  type="button"
                  onClick={handleCopyStats}
                  disabled={!text}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs flex items-center gap-1"
                  title="Copy full statistics report"
                >
                  <BarChart2 className="w-3 h-3 text-blue-600" />
                  <span>{copiedStats ? 'Copied!' : 'Stats'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  disabled={!text}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs flex items-center gap-1"
                  title="Download as .txt file"
                >
                  <Download className="w-3 h-3" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: Live Statistics Cards & Analysis (5 cols on lg)         */}
          {/* ===================================================================== */}
          <div className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto space-y-3 pr-0.5">
            {/* Header: Title & Real-Time Indicator */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Statistics
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Real-Time</span>
              </div>
            </div>

            {/* 1. HERO CARD: Primary Word Count */}
            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/40 border border-blue-200/70 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Words
                </span>
                <span className="text-[11px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  ~{metrics.estimatedPages} {metrics.estimatedPages === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-mono tracking-tight">
                  {metrics.words.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                <span>Reading: ~{metrics.readingTimeString}</span>
                <span>•</span>
                <span>Speaking: ~{metrics.speakingTimeString}</span>
              </p>
            </div>

            {/* 2. PRIMARY STATISTICS: 4 Compact Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Characters With Spaces */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block truncate">Characters</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block truncate">
                  {metrics.charactersWithSpaces.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">With spaces</span>
              </div>

              {/* Characters Without Spaces */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block truncate">No Spaces</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block truncate">
                  {metrics.charactersWithoutSpaces.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Excluding spaces</span>
              </div>

              {/* Sentences */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block truncate">Sentences</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block truncate">
                  {metrics.sentences.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Avg {metrics.avgSentenceLength} w/sentence
                </span>
              </div>

              {/* Paragraphs */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 block truncate">Paragraphs</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block truncate">
                  {metrics.paragraphs.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{metrics.lines} lines</span>
              </div>
            </div>

            {/* 3. SECONDARY STATS: Reading Time, Speaking Time, Avg Word Length */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">Reading</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 truncate mt-1">
                  {metrics.readingTimeString}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Volume2 className="w-3 h-3 text-purple-600 shrink-0" />
                  <span className="truncate">Speaking</span>
                </div>
                <span className="text-xs font-bold text-purple-700 truncate mt-1">
                  {metrics.speakingTimeString}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <AlignLeft className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">Avg Word</span>
                </div>
                <span className="text-xs font-bold text-slate-800 truncate mt-1">
                  {metrics.avgWordLength} chars
                </span>
              </div>
            </div>

            {/* 4. DEEP ANALYSIS TABS: Readability, Keyword Density, Social Limits */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-3">
              {/* Tab Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('readability')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'readability'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span className="truncate">Readability</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('keywords')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'keywords'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Hash className="w-3 h-3" />
                  <span className="truncate">Top Words</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('social')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'social'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                  <span className="truncate">Limits</span>
                </button>
              </div>

              {/* Tab 1: Readability & Flesch-Kincaid */}
              {activeTab === 'readability' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                        Flesch Reading Ease
                      </span>
                      <span className="text-xs font-semibold text-blue-900 mt-0.5 block">
                        {readability.readingEaseLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-blue-600 font-mono">
                        {readability.fleschReadingEase}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium"> / 100</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, readability.fleschReadingEase))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Grade Level:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {readability.schoolGradeLabel}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Keyword Density & Top Words */}
              {activeTab === 'keywords' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    {/* 1, 2, 3 word toggle */}
                    <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setKeywordN(1)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          keywordN === 1 ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        1-Word
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeywordN(2)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          keywordN === 2 ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        2-Words
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeywordN(3)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          keywordN === 3 ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        3-Words
                      </button>
                    </div>

                    <label className="flex items-center gap-1 text-[10px] font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={excludeStopWords}
                        onChange={(e) => setExcludeStopWords(e.target.checked)}
                        className="w-3 h-3 text-blue-600 rounded"
                      />
                      <span>Filter stop words</span>
                    </label>
                  </div>

                  {keywords.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-3 text-center">
                      Type more text to see keyword density.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {keywords.slice(0, 5).map((kw, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50/70 border border-slate-100"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 w-3">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                              {kw.phrase}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                              {kw.count}×
                            </span>
                            <span className="text-slate-400 text-[10px]">{kw.density}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Social Media & Character Limits */}
              {activeTab === 'social' && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {socialLimits.map((limit, idx) => {
                    const percent = Math.min(100, Math.round((limit.current / limit.max) * 100));
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-[11px] ${
                          limit.isOver
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50/60 border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 truncate">
                            {limit.platform} ({limit.label})
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              limit.isOver ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            {limit.current} / {limit.max}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              limit.isOver ? 'bg-rose-600' : percent > 85 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
