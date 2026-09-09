import { PDFDocument } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';

export interface MergePdfOptions {
  outputFileName?: string;
}

export const mergePdfManifest: ToolManifest = {
  id: 'merge-pdf',
  name: 'Merge PDF',
  category: 'pdf',
  description:
    'Combine multiple PDF documents into a single unified file. Reorder pages and files with zero server uploads.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['PDF'],
  outputFormats: ['PDF'],
  permissions: {
    readInputFiles: true,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'MULTI_PDF_INPUT',
    'FILE_REORDERING',
    'CLIENT_SIDE_MERGING',
    'PASSWORD_DETECTION',
    'OFFLINE_READY',
  ],
  limits: {
    maxFiles: 50,
    maxFileSizeMb: 100,
    maxTotalSizeMb: 500,
    allowedMimeTypes: ['application/pdf'],
  },
  offlineSupport: true,
};

export const mergePdfTool: IToolDefinition<MergePdfOptions> = {
  manifest: mergePdfManifest,
  defaultOptions: {
    outputFileName: 'merged-document.pdf',
  },

  validateFiles: (files: File[]) => {
    if (files.length < 2) {
      return {
        valid: false,
        error: 'Please select at least 2 PDF files to merge.',
      };
    }
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return {
          valid: false,
          error: `File "${file.name}" is not a PDF.`,
        };
      }
    }
    return { valid: true };
  },

  process: async ({
    files,
    onProgress,
    signal,
  }: ToolProcessParams<MergePdfOptions>): Promise<ProcessedOutput> => {
    if (files.length < 2) {
      throw new Error('Please select at least 2 PDF documents to merge.');
    }

    onProgress({ progress: 10, statusText: 'Initializing merge engine...' });
    const mergedDoc = await PDFDocument.create();

    const total = files.length;

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) {
        throw new Error('Processing cancelled by user.');
      }

      const fileItem = files[i];
      const progressPercent = Math.round(15 + (i / total) * 75);
      onProgress({
        progress: progressPercent,
        statusText: `Merging document ${i + 1} of ${total}: ${fileItem.file.name}`,
        currentStep: `${i + 1}/${total}`,
      });

      try {
        const buffer = await fileItem.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });

        const pageIndices = srcDoc.getPageIndices();
        const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

        for (const page of copiedPages) {
          mergedDoc.addPage(page);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('encrypt') || msg.includes('password')) {
          throw new Error(
            `File "${fileItem.file.name}" is password-protected. Please unlock it before merging.`
          );
        }
        throw new Error(`Failed to read "${fileItem.file.name}". File may be corrupted.`);
      }
    }

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 95, statusText: 'Saving merged PDF...' });
    const mergedBytes = await mergedDoc.save();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-merged-${dateStamp}.pdf`;
    const blob = new Blob([mergedBytes.buffer as ArrayBuffer], {
      type: 'application/pdf',
    });

    onProgress({ progress: 100, statusText: 'Merge complete!' });

    return {
      blob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: blob.size,
    };
  },
};

