'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectedFileItem {
  id: string;
  file: File;
  previewUrl?: string;
}

interface FileItemProps {
  item: SelectedFileItem;
  index: number;
  total: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function FileItem({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  disabled = false,
}: FileItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    // Generate thumbnail for image files safely and revoke on cleanup
    if (item.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(item.file);
      setThumbnailUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [item.file]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs transition-all hover:border-slate-300">
      {/* Thumbnail / Icon & Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={item.file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileText className="h-6 w-6 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800" title={item.file.name}>
            {item.file.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-medium text-slate-600">
              {formatFileSize(item.file.size)}
            </span>
            <span>&bull;</span>
            <span className="uppercase">{item.file.type.split('/')[1] || 'FILE'}</span>
          </div>
        </div>
      </div>

      {/* Reorder and Delete controls */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex flex-col">
          <button
            type="button"
            disabled={disabled || index === 0}
            onClick={() => onMoveUp(index)}
            aria-label="Move file up"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={disabled || index === total - 1}
            onClick={() => onMoveDown(index)}
            aria-label="Move file down"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          aria-label="Remove file"
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

