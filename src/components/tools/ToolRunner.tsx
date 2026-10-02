'use client';

import React, { useEffect } from 'react';
import { notFound } from 'next/navigation';
import { toolRegistry } from '@/core/registry/toolRegistry';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { ImageToPdfConverter } from '@/components/tools/ImageToPdfConverter';
import { PdfEditor } from '@/components/tools/pdf-editor/PdfEditor';
import { ImageCompressor } from '@/components/tools/ImageCompressor';
import { ImageResizer } from '@/components/tools/ImageResizer';
import { BackgroundRemover } from '@/components/tools/BackgroundRemover';
import { ImageConverter } from '@/components/tools/ImageConverter';
import { PassportPhotoMaker } from '@/components/tools/PassportPhotoMaker';
import { ImageToText } from '@/components/tools/ImageToText';
import { WordCounter } from '@/components/tools/WordCounter';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { AgeCalculator } from '@/components/tools/AgeCalculator';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';
import { EmiCalculator } from '@/components/tools/EmiCalculator';
import { DiscountCalculator } from '@/components/tools/DiscountCalculator';
import { PdfSummarizer } from '@/components/tools/PdfSummarizer';
import { GstCalculator } from '@/components/tools/GstCalculator';
import { MergePdfConverter } from '@/components/tools/MergePdfConverter';
import { SplitPdfConverter } from '@/components/tools/SplitPdfConverter';
import { RotatePdfConverter } from '@/components/tools/RotatePdfConverter';
import { WatermarkPdfConverter } from '@/components/tools/WatermarkPdfConverter';
import { PdfPageNumbersConverter } from '@/components/tools/PdfPageNumbersConverter';
import { trackToolEvent } from '@/lib/analytics/tracker';
import '@/tools'; // Ensures tools are registered in client bundle

interface ToolRunnerProps {
  toolId: string;
}

export function ToolRunner({ toolId }: ToolRunnerProps) {
  useEffect(() => {
    if (toolId) {
      trackToolEvent(toolId, 'tool_opened');
    }
  }, [toolId]);

  if (toolId === 'pdf-page-numbers') {
    return <PdfPageNumbersConverter />;
  }

  if (toolId === 'watermark-pdf') {
    return <WatermarkPdfConverter />;
  }

  if (toolId === 'rotate-pdf') {
    return <RotatePdfConverter />;
  }

  if (toolId === 'split-pdf') {
    return <SplitPdfConverter />;
  }

  if (toolId === 'merge-pdf') {
    return <MergePdfConverter />;
  }

  if (toolId === 'image-to-pdf') {
    return <ImageToPdfConverter />;
  }

  if (toolId === 'edit-pdf') {
    return <PdfEditor />;
  }

  if (toolId === 'image-compressor') {
    return <ImageCompressor />;
  }

  if (toolId === 'image-resizer') {
    return <ImageResizer />;
  }

  if (toolId === 'background-remover') {
    return <BackgroundRemover />;
  }

  if (toolId === 'image-converter') {
    return <ImageConverter />;
  }

  if (toolId === 'passport-photo-maker') {
    return <PassportPhotoMaker />;
  }

  if (toolId === 'image-to-text') {
    return <ImageToText />;
  }

  if (toolId === 'word-counter') {
    return <WordCounter />;
  }

  if (toolId === 'json-formatter') {
    return <JsonFormatter />;
  }

  if (toolId === 'age-calculator') {
    return <AgeCalculator />;
  }

  if (toolId === 'percentage-calculator') {
    return <PercentageCalculator />;
  }

  if (toolId === 'emi-calculator') {
    return <EmiCalculator />;
  }

  if (toolId === 'discount-calculator') {
    return <DiscountCalculator />;
  }

  if (toolId === 'pdf-summarizer') {
    return <PdfSummarizer />;
  }

  if (toolId === 'gst-calculator') {
    return <GstCalculator />;
  }

  const tool = toolRegistry.get(toolId);

  if (!tool) {
    notFound();
  }

  return <ToolLayout tool={tool} />;
}

