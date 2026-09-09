'use client';

import React from 'react';
import { Trash2, Plus, Files } from 'lucide-react';
import { FileItem, SelectedFileItem } from '@/components/common/FileItem';

interface FileListProps {
  files: SelectedFileItem[];
  onReorder: (files: SelectedFileItem[]) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onAddMoreClick?: () => void;
  disabled?: boolean;
}

export function FileList({
  files,
  onReorder,
  onRemove,
  onClearAll,
  onAddMoreClick,
  disabled = false,
}: FileListProps) {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, curr) => acc + curr.file.size, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    onReorder(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    onReorder(newFiles);
  };

  return (
    <div className="w-full space-y-3">
      {/* File List Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Files className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-slate-900">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </span>
          <span>({totalMb} MB total)</span>
        </div>

        <div className="flex items-center gap-2">
          {onAddMoreClick && (
            <button
              type="button"
              disabled={disabled}
              onClick={onAddMoreClick}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add More</span>
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Items Container */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {files.map((item, index) => (
          <FileItem
            key={item.id}
            item={item}
            index={index}
            total={files.length}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onRemove={onRemove}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

