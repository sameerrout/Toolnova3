/**
 * Central registry entry point.
 * Imports and registers all 16 tools in the Toolnova platform.
 */
import { imageToPdfTool } from '@/tools/image-to-pdf';
import { mergePdfTool } from '@/tools/merge-pdf';
import { splitPdfTool } from '@/tools/split-pdf';
import { rotatePdfTool } from '@/tools/rotate-pdf';
import { watermarkPdfTool } from '@/tools/watermark-pdf';
import { pdfPageNumbersTool } from '@/tools/pdf-page-numbers';
import { organizePdfTool } from '@/tools/organize-pdf';
import { unlockPdfTool } from '@/tools/unlock-pdf';
import { compressPdfTool } from '@/tools/compress-pdf';
import { editPdfTool } from '@/tools/edit-pdf';
import { pdfToImageTool } from '@/tools/pdf-to-image';
import { protectPdfTool } from '@/tools/protect-pdf';
import { pdfToWordTool } from '@/tools/pdf-to-word';
import { wordToPdfTool } from '@/tools/word-to-pdf';
import { pdfToPowerpointTool } from '@/tools/pdf-to-powerpoint';
import { powerpointToPdfTool } from '@/tools/powerpoint-to-pdf';
import { toolRegistry } from '@/core/registry/toolRegistry';

// Register all 16 active client-side and hybrid tools
toolRegistry.register(imageToPdfTool);
toolRegistry.register(mergePdfTool);
toolRegistry.register(splitPdfTool);
toolRegistry.register(rotatePdfTool);
toolRegistry.register(watermarkPdfTool);
toolRegistry.register(pdfPageNumbersTool);
toolRegistry.register(organizePdfTool);
toolRegistry.register(unlockPdfTool);
toolRegistry.register(compressPdfTool);
toolRegistry.register(editPdfTool);
toolRegistry.register(pdfToImageTool);
toolRegistry.register(protectPdfTool);
toolRegistry.register(pdfToWordTool);
toolRegistry.register(wordToPdfTool);
toolRegistry.register(pdfToPowerpointTool);
toolRegistry.register(powerpointToPdfTool);

export { toolRegistry };
