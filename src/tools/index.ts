/**
 * Central registry entry point.
 * Imports and registers active tools in the Toolino platform.
 */
import { imageToPdfTool } from '@/tools/image-to-pdf';
import { mergePdfTool } from '@/tools/merge-pdf';
import { splitPdfTool } from '@/tools/split-pdf';
import { rotatePdfTool } from '@/tools/rotate-pdf';
import { watermarkPdfTool } from '@/tools/watermark-pdf';
import { pdfPageNumbersTool } from '@/tools/pdf-page-numbers';
import { organizePdfTool } from '@/tools/organize-pdf';
import { compressPdfTool } from '@/tools/compress-pdf';
import { editPdfTool } from '@/tools/edit-pdf';
import { pdfToImageTool } from '@/tools/pdf-to-image';
import { protectPdfTool } from '@/tools/protect-pdf';
import { pdfToPowerpointTool } from '@/tools/pdf-to-powerpoint';
import { qrCodeGeneratorTool } from '@/tools/qr-code-generator';
import { toolRegistry } from '@/core/registry/toolRegistry';

// Register active client-side and hybrid tools
toolRegistry.register(imageToPdfTool);
toolRegistry.register(mergePdfTool);
toolRegistry.register(splitPdfTool);
toolRegistry.register(rotatePdfTool);
toolRegistry.register(watermarkPdfTool);
toolRegistry.register(pdfPageNumbersTool);
toolRegistry.register(organizePdfTool);
toolRegistry.register(compressPdfTool);
toolRegistry.register(editPdfTool);
toolRegistry.register(pdfToImageTool);
toolRegistry.register(protectPdfTool);
toolRegistry.register(pdfToPowerpointTool);
toolRegistry.register(qrCodeGeneratorTool);

export { toolRegistry };

