'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Download,
  BookOpen,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck,
  Sliders,
  Type,
  Hash,
  Share2,
  FileCheck,
  RotateCcw,
  AlignLeft,
  ChevronDown,
  Layers,
  BarChart2,
} from 'lucide-react';
import {
  calculateTextMetrics,
  calculateReadability,
  calculateKeywordDensity,
  calculateSocialLimits,
  transformCase,
  cleanText,
  TextMetrics,
} from '@/core/engine/wordCounterEngine';

const SAMPLE_TEXT = `In modern software engineering, privacy-first web applications represent a critical paradigm shift. By executing computationally intensive tasks directly inside the user's browser via WebAssembly and HTML5 Canvas, platforms can eliminate unnecessary cloud data transfers. This architecture guarantees that sensitive documents, financial receipts, and personal photos remain completely confidential on local hardware. 

Furthermore, client-side tools reduce server infrastructure overhead, lower bandwidth consumption, and deliver instantaneous processing speeds without latency. When building scalable digital products, engineers must prioritize data security, accessible interface design, and transparent user controls.`;

export function WordCounter() {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [activeTab, setActiveTab] = useState<'readability' | 'keywords' | 'social'>('readability');
  const [keywordN, setKeywordN] = useState<1 | 2 | 3>(1);
  const [excludeStopWords, setExcludeStopWords] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedStats, setCopiedStats] = useState<boolean>(false);

  // Compute live metrics
  const metrics = useMemo(() => calculateTextMetrics(text), [text]);
  const readability = useMemo(() => calculateReadability(text, metrics), [text, metrics]);
  const keywords = useMemo(() => calculateKeywordDensity(text, keywordN, excludeStopWords, 8), [text, keywordN, excludeStopWords]);
  const socialLimits = useMemo(() => calculateSocialLimits(text), [text]);

  // Copy text handler
  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  // Copy full stats summary
  const handleCopyStats = async () => {
    const summary = `Toolino Text Statistics Report
================================
Words: ${metrics.words}
Characters (with spaces): ${metrics.charactersWithSpaces}
Characters (no spaces): ${metrics.charactersWithoutSpaces}
Sentences: ${metrics.sentences}
Paragraphs: ${metrics.paragraphs}
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
    } catch {
      console.error('Failed to copy stats');
    }
  };

  // Download plain text file
  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'word_counter_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Case transforms
  const handleCaseChange = (c: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'kebab' | 'snake') => {
    setText(transformCase(text, c));
  };

  // Text cleanup
  const handleClean = (action: 'trim-spaces' | 'remove-empty-lines' | 'join-lines' | 'remove-duplicates' | 'strip-html') => {
    setText(cleanText(text, action));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>Toolino</span>
              <span className="text-slate-300">/</span>
            </Link>
            <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              Word Counter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side • Instant Real-Time Analysis
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <Type className="w-3.5 h-3.5 text-blue-600" />
            Comprehensive Text Statistics & Readability
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Online Word Counter
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Real-time word, character, sentence, and paragraph counter with Flesch readability scores, keyword density analysis, and case converters.
          </p>
        </div>

        {/* Primary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Words</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{metrics.words}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Characters</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{metrics.charactersWithSpaces}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">No Spaces</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{metrics.charactersWithoutSpaces}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sentences</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{metrics.sentences}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paragraphs</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{metrics.paragraphs}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Reading Time</span>
            <span className="text-base font-extrabold text-emerald-600 mt-2 block truncate">
              {metrics.readingTimeString}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Speaking</span>
            <span className="text-base font-extrabold text-purple-600 mt-2 block truncate">
              {metrics.speakingTimeString}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pages (~275w)</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{metrics.estimatedPages}</span>
          </div>
        </div>

        {/* Text Area Card & Toolbars */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
          {/* Top Actions Bar */}
          <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            {/* Left: Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setText(SAMPLE_TEXT)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Load Sample</span>
              </button>

              <button
                onClick={() => setText('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Right: Export & Stats */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyStats}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{copiedStats ? 'Stats Copied!' : 'Copy Stats'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>
            </div>
          </div>

          {/* Main Textarea */}
          <div className="p-4 sm:p-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your text here to analyze words, characters, sentences, readability, and keyword density in real-time..."
              rows={12}
              className="w-full p-4 text-base text-slate-800 bg-slate-50/40 border border-slate-200 rounded-2xl resize-y focus:outline-blue-500 leading-relaxed font-sans"
            />
          </div>

          {/* Transformation & Cleanup Toolbar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-4">
            {/* Case Converters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Case:
              </span>
              <button
                onClick={() => handleCaseChange('sentence')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                Sentence case
              </button>
              <button
                onClick={() => handleCaseChange('title')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                Title Case
              </button>
              <button
                onClick={() => handleCaseChange('upper')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => handleCaseChange('lower')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                lowercase
              </button>
              <button
                onClick={() => handleCaseChange('camel')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                camelCase
              </button>
              <button
                onClick={() => handleCaseChange('kebab')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                kebab-case
              </button>
              <button
                onClick={() => handleCaseChange('snake')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors shadow-xs"
              >
                snake_case
              </button>
            </div>

            {/* Cleaners */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Cleanup:
              </span>
              <button
                onClick={() => handleClean('trim-spaces')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                Trim Spaces
              </button>
              <button
                onClick={() => handleClean('remove-empty-lines')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                Remove Blank Lines
              </button>
              <button
                onClick={() => handleClean('join-lines')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                Join to Single Line
              </button>
              <button
                onClick={() => handleClean('remove-duplicates')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                Remove Duplicates
              </button>
              <button
                onClick={() => handleClean('strip-html')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
              >
                Strip HTML
              </button>
            </div>
          </div>
        </div>

        {/* Deep Analysis Tabs Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('readability')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'readability'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Readability & Grade Level</span>
            </button>

            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'keywords'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Keyword Density</span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'social'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Social Media & SEO Limits</span>
            </button>
          </div>

          {/* Tab 1: Readability & Grade Level */}
          {activeTab === 'readability' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Flesch Reading Ease */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                  Flesch Reading Ease
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-blue-950">
                    {readability.fleschReadingEase}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                </div>
                <p className="text-xs font-semibold text-blue-800 mt-2">{readability.readingEaseLabel}</p>
                <div className="w-full h-2 bg-blue-200/60 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${readability.fleschReadingEase}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Flesch-Kincaid Grade Level */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  Flesch-Kincaid Grade
                </span>
                <span className="text-3xl font-extrabold text-emerald-950 mt-2 block">
                  {readability.schoolGradeLabel}
                </span>
                <p className="text-xs text-emerald-800 mt-2 font-semibold">
                  Suitable for students and general audience
                </p>
              </div>

              {/* Card 3: Avg Word Length */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Avg. Word Length
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900">{metrics.avgWordLength}</span>
                  <span className="text-xs text-slate-500 font-medium">characters</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Typical English average is 4.7 characters</p>
              </div>

              {/* Card 4: Avg Sentence Length */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Avg. Sentence Length
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900">{metrics.avgSentenceLength}</span>
                  <span className="text-xs text-slate-500 font-medium">words</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Optimal readability is 14 to 18 words</p>
              </div>
            </div>
          )}

          {/* Tab 2: Keyword Density & Frequency */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Phrase Length:</span>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setKeywordN(1)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        keywordN === 1 ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      1 Word
                    </button>
                    <button
                      onClick={() => setKeywordN(2)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        keywordN === 2 ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      2 Words
                    </button>
                    <button
                      onClick={() => setKeywordN(3)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        keywordN === 3 ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      3 Words
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeStopWords}
                    onChange={(e) => setExcludeStopWords(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Exclude Stop Words (the, a, and, of...)</span>
                </label>
              </div>

              {keywords.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Add more text to calculate keyword frequency and density.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {keywords.map((kw, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                          {kw.phrase}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {kw.count}×
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Density</span>
                          <span className="font-semibold">{kw.density}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, kw.density * 10)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Social Media & Character Limits */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialLimits.map((limit, idx) => {
                const percent = Math.min(100, Math.round((limit.current / limit.max) * 100));
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      limit.isOver
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{limit.platform}</span>
                        <span className="text-[10px] text-slate-500">{limit.label}</span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold ${
                          limit.isOver ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {limit.current} / {limit.max}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3 mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          limit.isOver ? 'bg-rose-600' : percent > 85 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className={limit.isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {limit.isOver
                          ? `${Math.abs(limit.remaining)} characters over limit!`
                          : `${limit.remaining} remaining`}
                      </span>
                      <span className="font-semibold text-slate-400">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
