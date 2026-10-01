'use client';

import React, { useState, useMemo, useRef } from 'react';
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
  Layers,
  FileCode,
  FileSpreadsheet,
  Minimize2,
  Maximize2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  validateJson,
  formatJson,
  repairJson,
  jsonToCsv,
  jsonToXml,
  jsonToYaml,
  SAMPLE_JSON_TEMPLATES,
  IndentOption,
} from '@/core/engine/jsonFormatterEngine';

// Recursive Tree View Component for Collapsible JSON Visualizer
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
      <div className="flex items-baseline gap-1 py-0.5 font-mono text-xs hover:bg-slate-100/60 px-1 rounded">
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
        <div className="pl-4 border-l border-slate-200 ml-2 space-y-0.5">
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
  const [rawText, setRawText] = useState<string>(
    JSON.stringify(SAMPLE_JSON_TEMPLATES.ecommerceOrder, null, 2)
  );
  const [indent, setIndent] = useState<IndentOption>('2-spaces');
  const [activeTab, setActiveTab] = useState<'formatted' | 'tree' | 'csv' | 'xml' | 'yaml'>('formatted');
  const [copied, setCopied] = useState<boolean>(false);
  const [fixSuccess, setFixSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Validation
  const validation = useMemo(() => validateJson(rawText), [rawText]);

  // Formatted output
  const formattedOutput = useMemo(() => {
    if (!validation.isValid) return '';
    try {
      return formatJson(rawText, indent);
    } catch {
      return rawText;
    }
  }, [rawText, indent, validation]);

  // Converted formats
  const convertedCsv = useMemo(() => {
    if (!validation.isValid) return '';
    try {
      return jsonToCsv(validation.parsed);
    } catch (err: any) {
      return `CSV conversion error: ${err.message}`;
    }
  }, [validation]);

  const convertedXml = useMemo(() => {
    if (!validation.isValid) return '';
    try {
      return jsonToXml(validation.parsed);
    } catch (err: any) {
      return `XML conversion error: ${err.message}`;
    }
  }, [validation]);

  const convertedYaml = useMemo(() => {
    if (!validation.isValid) return '';
    try {
      return jsonToYaml(validation.parsed);
    } catch (err: any) {
      return `YAML conversion error: ${err.message}`;
    }
  }, [validation]);

  // Copy handler
  const handleCopy = async (contentToCopy?: string) => {
    const textToCopy =
      contentToCopy ||
      (activeTab === 'csv'
        ? convertedCsv
        : activeTab === 'xml'
        ? convertedXml
        : activeTab === 'yaml'
        ? convertedYaml
        : formattedOutput || rawText);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  // Download handler
  const handleDownload = (format: 'json' | 'csv' | 'xml' | 'yaml') => {
    let content = '';
    let mime = 'text/plain';
    let filename = `data.${format}`;

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

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Auto-Fix JSON syntax
  const handleAutoFix = () => {
    const repaired = repairJson(rawText);
    setRawText(repaired);
    setFixSuccess(true);
    setTimeout(() => setFixSuccess(false), 2500);
  };

  // File upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setRawText(result);
    };
    reader.readAsText(file);
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
              JSON Formatter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side • In-Browser Parsing
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3 shadow-xs">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            Validate, Beautify & Convert
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Free Online JSON Formatter & Validator
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Format, validate, repair, and convert JSON documents with interactive tree visualization, CSV/XML/YAML export, and syntax error detection.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Left Actions: Format Options, Fix, Samples */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indent Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setIndent('2-spaces')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  indent === '2-spaces' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                2 Spaces
              </button>
              <button
                onClick={() => setIndent('4-spaces')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  indent === '4-spaces' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                4 Spaces
              </button>
              <button
                onClick={() => setIndent('tab')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  indent === 'tab' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Tab
              </button>
              <button
                onClick={() => setIndent('minify')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  indent === 'minify' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Minify
              </button>
            </div>

            {/* Auto Fix Button */}
            <button
              onClick={handleAutoFix}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition-colors shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{fixSuccess ? 'Repaired!' : 'Fix JSON Syntax'}</span>
            </button>

            {/* Samples Dropdown */}
            <select
              onChange={(e) => {
                const key = e.target.value as keyof typeof SAMPLE_JSON_TEMPLATES;
                if (key && SAMPLE_JSON_TEMPLATES[key]) {
                  setRawText(JSON.stringify(SAMPLE_JSON_TEMPLATES[key], null, 2));
                }
              }}
              defaultValue=""
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 cursor-pointer"
            >
              <option value="" disabled>
                Load Sample JSON...
              </option>
              <option value="ecommerceOrder">E-Commerce Order</option>
              <option value="userProfile">User Profile & Auth</option>
              <option value="apiResponse">Paginated API Response</option>
            </select>
          </div>

          {/* Right Actions: Upload, Clear, Copy, Download */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .json</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }}
            />

            <button
              onClick={() => setRawText('')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={() => handleCopy()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload('json')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .JSON</span>
            </button>
          </div>
        </div>

        {/* Validation Status Banner */}
        <div className="mb-4">
          {validation.isValid ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium px-5">
              <span className="flex items-center gap-2 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Valid JSON Document
              </span>
              <div className="flex items-center gap-4 text-slate-600">
                <span>
                  Keys: <strong className="text-slate-800">{validation.keysCount}</strong>
                </span>
                <span>
                  Max Depth: <strong className="text-slate-800">{validation.depth}</strong>
                </span>
                <span>
                  Size: <strong className="text-slate-800">{(validation.sizeBytes / 1024).toFixed(2)} KB</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900 px-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong className="font-bold">Syntax Error at Line {validation.line}, Col {validation.column}:</strong>{' '}
                  {validation.message}
                </span>
              </div>
              <button
                onClick={handleAutoFix}
                className="text-xs font-bold text-rose-700 hover:underline shrink-0 ml-3"
              >
                Auto-Fix Common Errors
              </button>
            </div>
          )}
        </div>

        {/* Split View Editor & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 6 Cols: Raw Input Editor */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/50">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                JSON Input
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Paste raw, minified, or malformed JSON
              </span>
            </div>

            <div className="flex-1 p-4 bg-slate-50/30 flex flex-col">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste JSON here to format, validate, and convert..."
                rows={22}
                className="w-full flex-1 p-4 font-mono text-xs text-slate-900 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Right 6 Cols: Formatted / Tree / Converted Output */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
            {/* Output View Tabs */}
            <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab('formatted')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'formatted' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Formatted
                </button>
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'tree' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tree View
                </button>
                <button
                  onClick={() => setActiveTab('csv')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'csv' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  CSV
                </button>
                <button
                  onClick={() => setActiveTab('xml')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'xml' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  XML
                </button>
                <button
                  onClick={() => setActiveTab('yaml')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'yaml' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  YAML
                </button>
              </div>

              {/* Format-specific download quick action */}
              {activeTab === 'csv' && (
                <button
                  onClick={() => handleDownload('csv')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .csv</span>
                </button>
              )}
              {activeTab === 'xml' && (
                <button
                  onClick={() => handleDownload('xml')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xml</span>
                </button>
              )}
              {activeTab === 'yaml' && (
                <button
                  onClick={() => handleDownload('yaml')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .yaml</span>
                </button>
              )}
            </div>

            {/* Output Display Body */}
            <div className="flex-1 p-4 bg-slate-50/30 flex flex-col min-h-[460px] overflow-auto">
              {activeTab === 'formatted' && (
                <textarea
                  readOnly
                  value={formattedOutput}
                  rows={22}
                  className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
                />
              )}

              {activeTab === 'tree' && (
                <div className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl overflow-auto max-h-[580px]">
                  {validation.isValid ? (
                    <JsonTreeNode value={validation.parsed} />
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      Fix JSON syntax errors to view interactive tree nodes.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'csv' && (
                <textarea
                  readOnly
                  value={convertedCsv}
                  rows={22}
                  className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
                />
              )}

              {activeTab === 'xml' && (
                <textarea
                  readOnly
                  value={convertedXml}
                  rows={22}
                  className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
                />
              )}

              {activeTab === 'yaml' && (
                <textarea
                  readOnly
                  value={convertedYaml}
                  rows={22}
                  className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-blue-500 leading-relaxed"
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
