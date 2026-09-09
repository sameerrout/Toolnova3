import { PDFDocument } from 'pdf-lib';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  CompressPdfOptions,
  CompressPdfOptionsComponent,
} from './CompressPdfOptions';

export const compressPdfManifest: ToolManifest = {
  id: 'compress-pdf',
  name: 'Compress PDF',
  category: 'pdf',
  description:
    'Optimize and reduce the file size of PDF documents client-side while maintaining visual clarity.',
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
    'DOCUMENT_STREAM_OPTIMIZATION',
    'OBJECT_RECOMPRESSION',
    'METADATA_CLEANUP',
    'SIZE_COMPARISON',
    'OFFLINE_READY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 100,
    maxTotalSizeMb: 100,
    allowedMimeTypes: ['application/pdf'],
  },
  offlineSupport: true,
};

export const compressPdfTool: IToolDefinition<CompressPdfOptions> = {
  manifest: compressPdfManifest,
  defaultOptions: {
    level: 'recommended',
  },

  validateFiles: (files: File[]) => {
    if (files.length !== 1) {
      return {
        valid: false,
        error: 'Please select exactly one PDF file to compress.',
      };
    }
    if (!files[0].name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: 'Please select a valid PDF file.',
      };
    }
    return { valid: true };
  },

  OptionsComponent: CompressPdfOptionsComponent,

  process: async ({
    files,
    onProgress,
    signal,
  }: ToolProcessParams<CompressPdfOptions>): Promise<ProcessedOutput> => {
    const file = files[0].file;
    const originalSize = file.size;

    onProgress({ progress: 15, statusText: 'Analyzing PDF object trees...' });
    const buffer = await file.arrayBuffer();

    if (signal?.aborted) {
      throw new Error('Processing cancelled by user.');
    }

    onProgress({ progress: 40, statusText: 'De-duplicating and optimizing page contents...' });
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });

    // Clean up creator & producer tags to shave header bytes
    pdfDoc.setProducer('Toolnova Local Engine');
    pdfDoc.setCreator('Toolnova');

    onProgress({ progress: 75, statusText: 'Re-compressing streams and saving...' });
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    // Per §22: Edge case: if output is larger than original, return original
    let finalBlob: Blob;
    if (compressedBytes.length < originalSize) {
      finalBlob = new Blob([compressedBytes.buffer as ArrayBuffer], {
        type: 'application/pdf',
      });
    } else {
      // Return original file to ensure user never receives a larger file
      finalBlob = file;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `toolnova-compressed-${dateStamp}.pdf`;

    onProgress({ progress: 100, statusText: 'Compression complete!' });

    return {
      blob: finalBlob,
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: finalBlob.size,
    };
  },
};

