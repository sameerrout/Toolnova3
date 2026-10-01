'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  RefreshCw,
  FileCheck,
  ExternalLink,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { ProcessedOutput } from '@/core/types/tool';

interface ResultPanelProps {
  output: ProcessedOutput;
  onReset: () => void;
  className?: string;
}

export function ResultPanel({ output, onReset, className }: ResultPanelProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isNetworkHttp, setIsNetworkHttp] = useState(false);

  useEffect(() => {
    // Generate object URL for direct client download & preview
    const url = URL.createObjectURL(output.blob);
    setDownloadUrl(url);

    // Detect if accessed via network IP rather than localhost (which triggers Chrome's insecure download flag)
    if (typeof window !== 'undefined') {
      const isHttp = window.location.protocol === 'http:';
      const isNotLocalhost =
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';
      setIsNetworkHttp(isHttp && isNotNotLocalhost(window.location.hostname));
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [output.blob]);

  function isNotNotLocalhost(hostname: string) {
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Create a dedicated fresh object URL at the moment of the user click
      const clickUrl = URL.createObjectURL(output.blob);
      const link = document.createElement('a');
      link.href = clickUrl;
      link.setAttribute('download', output.fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Clean up after download triggers
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(clickUrl);
      }, 10000);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to existing downloadUrl
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    }
  };

  return (
    <div className={`w-full flex justify-center items-center py-4 ${className || ''}`}>
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-100 text-center w-full max-w-[480px]">
        {/* Green Checkmark Circle */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600 stroke-[3]" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Your file is ready!
        </h2>

        <p className="text-gray-500 text-sm mb-6">
          Click the button below to save your processed file
        </p>

        {/* File summary card */}
        <div className="mx-auto flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-6 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800" title={output.fileName}>
                {output.fileName}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatFileSize(output.sizeBytes)} &bull; {output.mimeType}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Verified Output
          </span>
        </div>

        {/* Primary Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all mb-4 cursor-pointer active:scale-[0.99]"
        >
          <Download className="h-5 w-5" />
          <span>Download File</span>
        </button>

        {/* Notice for Network HTTP vs Localhost */}
        {isNetworkHttp && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Browser Security Notice</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  If Chrome shows <em>&quot;Download insecure file&quot;</em>, click <strong>Keep anyway</strong>.
                  Chrome flags all file downloads on network IP addresses. For seamless downloads without warnings, open Toolino on{' '}
                  <a
                    href="http://localhost:3000"
                    className="underline font-bold text-amber-900 hover:text-amber-950"
                  >
                    http://localhost:3000
                  </a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
          {downloadUrl && output.mimeType === 'application/pdf' && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Preview in Tab</span>
            </a>
          )}

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Process Another</span>
          </button>
        </div>
      </div>
    </div>
  );
}
