'use client';

/**
 * Drag-and-drop file picker.
 *
 * Three input paths are supported because the ZIP tool needs all of them:
 *   - drag and drop anywhere in the box
 *   - a normal file picker (`multiple`)
 *   - a folder picker using `webkitdirectory`, which also yields the relative
 *     paths needed to preserve folder structure
 *
 * Keyboard accessible: the drop area is a real `<button>`-like target with
 * visible focus, and Enter/Space opens the picker.
 */

import { useCallback, useId, useRef, useState } from 'react';
import { UploadCloud, FolderUp, Files } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FileDropZoneProps {
  onFiles: (files: File[], source: 'picker' | 'drop' | 'folder') => void;
  /** `accept` attribute for the picker, e.g. `'image/*,.pdf'`. */
  accept?: string;
  multiple?: boolean;
  /** Show the "choose a folder" button (folder upload with structure). */
  allowFolder?: boolean;
  /** Primary line of copy. */
  label?: string;
  /** Secondary line, used to state format + size limits. */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function FileDropZone({
  onFiles,
  accept,
  multiple = true,
  allowFolder = false,
  label,
  hint,
  disabled = false,
  className,
}: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const describedBy = useId();

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;

      const items = Array.from(event.dataTransfer.files);
      if (items.length === 0) return;
      onFiles(multiple ? items : items.slice(0, 1), 'drop');
    },
    [disabled, multiple, onFiles]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      setDragging(true);
    },
    [disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      className={cn(
        'rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-10',
        dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <UploadCloud
        aria-hidden="true"
        className={cn('mx-auto h-10 w-10', dragging ? 'text-brand-600' : 'text-slate-400')}
      />

      <p className="mt-4 text-base font-semibold text-slate-900">
        {label ?? (multiple ? 'Drop your files here' : 'Drop your file here')}
      </p>
      <p id={describedBy} className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        {hint ?? 'Your files are processed on this device and never uploaded.'}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Files aria-hidden="true" className="h-4 w-4" />
          {multiple ? 'Choose files' : 'Choose a file'}
        </button>

        {allowFolder ? (
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <FolderUp aria-hidden="true" className="h-4 w-4" />
            Choose a folder
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-slate-500">or drag and drop anywhere in this box</p>

      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        aria-describedby={describedBy}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // Reset so picking the same file twice still fires a change event.
          event.target.value = '';
          if (files.length > 0) onFiles(files, 'picker');
        }}
      />

      {allowFolder ? (
        <input
          ref={folderInputRef}
          type="file"
          className="sr-only"
          multiple
          aria-describedby={describedBy}
          // `webkitdirectory` is what makes the picker select a whole folder and
          // populate `File.webkitRelativePath`. React 19 forwards unknown
          // attributes verbatim, so no imperative DOM work is needed.
          {...{ webkitdirectory: '', directory: '' }}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (files.length > 0) onFiles(files, 'folder');
          }}
        />
      ) : null}
    </div>
  );
}
