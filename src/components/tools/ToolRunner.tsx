'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import { toolRegistry } from '@/core/registry/toolRegistry';
import { ToolLayout } from '@/components/tools/ToolLayout';
import '@/tools'; // Ensures tools are registered in client bundle

interface ToolRunnerProps {
  toolId: string;
}

export function ToolRunner({ toolId }: ToolRunnerProps) {
  const tool = toolRegistry.get(toolId);

  if (!tool) {
    notFound();
  }

  return <ToolLayout tool={tool} />;
}

