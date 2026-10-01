import QRCode from 'qrcode';
import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ToolManifest, ProcessedOutput } from '@/core/types/tool';
import {
  QrCodeOptions,
  QrCodeGeneratorOptionsComponent,
} from './QrCodeGeneratorOptions';
import { buildQrPayload } from './qrPayload';

export const qrCodeGeneratorManifest: ToolManifest = {
  id: 'qr-code-generator',
  name: 'QR Code Generator',
  category: 'utility',
  description:
    'Generate customized, high-resolution QR codes for websites, text, Wi-Fi networks, vCards, phone numbers, and emails with full color and format control.',
  version: '1.0.0',
  executionMode: 'LOCAL',
  runtime: 'browser',
  inputFormats: ['TXT'],
  outputFormats: ['PNG', 'SVG'],
  permissions: {
    readInputFiles: false,
    writeOutputFiles: true,
    networkAccess: false,
    accessOtherFiles: false,
  },
  capabilities: [
    'QR_CODE_GENERATION',
    'PNG_EXPORT',
    'SVG_EXPORT',
    'CUSTOM_COLORS',
    'CLIENT_SIDE_ONLY',
  ],
  limits: {
    maxFiles: 1,
    maxFileSizeMb: 10,
    maxTotalSizeMb: 10,
  },
  offlineSupport: true,
};

export const defaultQrOptions: QrCodeOptions = {
  dataType: 'url',
  text: 'Toolino - High-Performance Online Tools',
  url: 'https://toolnova.com',
  email: { address: '', subject: '', body: '' },
  phone: '',
  wifi: { ssid: '', encryption: 'WPA', password: '' },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    website: '',
  },
  size: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
  foregroundColor: '#0f172a',
  backgroundColor: '#ffffff',
  format: 'png',
};

export const qrCodeGeneratorTool: IToolDefinition<QrCodeOptions> = {
  manifest: qrCodeGeneratorManifest,
  defaultOptions: defaultQrOptions,
  OptionsComponent: QrCodeGeneratorOptionsComponent,

  validateFiles: () => {
    // QR generator doesn't strictly require files, files are optional
    return { valid: true };
  },

  process: async ({
    options,
    onProgress,
    signal,
  }: ToolProcessParams<QrCodeOptions>): Promise<ProcessedOutput> => {
    onProgress({ progress: 10, statusText: 'Analyzing QR code parameters...' });

    if (signal?.aborted) {
      throw new Error('QR code generation aborted by user.');
    }

    const payload = buildQrPayload(options);

    onProgress({ progress: 50, statusText: 'Rendering QR matrix...' });

    const qrOpts = {
      width: options.size,
      margin: options.margin,
      errorCorrectionLevel: options.errorCorrectionLevel,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor,
      },
    };

    if (options.format === 'svg') {
      const svgString = await QRCode.toString(payload, {
        ...qrOpts,
        type: 'svg',
      });

      onProgress({ progress: 95, statusText: 'Encoding SVG vector document...' });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const fileName = `qrcode-${Date.now()}.svg`;

      return {
        blob,
        fileName,
        mimeType: 'image/svg+xml',
        sizeBytes: blob.size,
      };
    } else {
      // PNG export
      const dataUrl = await QRCode.toDataURL(payload, qrOpts);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `qrcode-${Date.now()}.png`;

      onProgress({ progress: 100, statusText: 'QR code generated successfully!' });

      return {
        blob,
        fileName,
        mimeType: 'image/png',
        sizeBytes: blob.size,
        previewUrl: dataUrl,
      };
    }
  },
};
