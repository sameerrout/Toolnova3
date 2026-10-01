import { IToolDefinition, ToolProcessParams } from '@/core/contracts/toolDefinition';
import { ProcessedOutput, ProcessingProgress } from '@/core/types/tool';
import { SelectedFileItem } from '@/components/common/FileItem';

export interface ExecuteToolParams<TOptions = any> {
  tool: IToolDefinition<TOptions>;
  files: SelectedFileItem[];
  options: TOptions;
  onProgress: (progress: ProcessingProgress) => void;
  signal?: AbortSignal;
  onJobAssigned?: (jobId: string) => void;
}

/**
 * Authoritative Tool Execution Abstraction (§18)
 * Intelligently routes between in-browser execution (CLIENT_EXECUTOR)
 * and server-assisted worker execution (SERVER_JOB_EXECUTOR) based on
 * tool manifest, file complexity, and execution mode.
 */
export async function executeTool<TOptions = any>({
  tool,
  files,
  options,
  onProgress,
  signal,
  onJobAssigned,
}: ExecuteToolParams<TOptions>): Promise<ProcessedOutput> {
  const { manifest } = tool;

  // Tools that always run genuinely client-side in the browser
  const isPureClient =
    manifest.executionMode === 'LOCAL' ||
    manifest.id === 'qr-code-generator';

  // Core conversion tools that require high-fidelity server workers
  const prefersServerWorker =
    manifest.executionMode === 'SERVER' ||
    manifest.id === 'pdf-to-powerpoint';

  if (isPureClient || (!prefersServerWorker && files.length > 0 && files[0].file.size < 5 * 1024 * 1024)) {
    // CLIENT_EXECUTOR
    return await tool.process({
      files,
      options,
      onProgress,
      signal,
    });
  }

  // SERVER_JOB_EXECUTOR
  return await executeServerJob({
    toolId: manifest.id,
    files,
    options,
    onProgress,
    signal,
    onJobAssigned,
    fallbackClientProcess: tool.process
      ? () => tool.process({ files, options, onProgress, signal })
      : undefined,
  });
}

interface ServerJobExecutionParams {
  toolId: string;
  files: SelectedFileItem[];
  options: any;
  onProgress: (progress: ProcessingProgress) => void;
  signal?: AbortSignal;
  onJobAssigned?: (jobId: string) => void;
  fallbackClientProcess?: () => Promise<ProcessedOutput>;
}

async function executeServerJob({
  toolId,
  files,
  options,
  onProgress,
  signal,
  onJobAssigned,
  fallbackClientProcess,
}: ServerJobExecutionParams): Promise<ProcessedOutput> {
  if (files.length === 0) {
    throw new Error('Please select at least one file to process.');
  }

  const primaryFile = files[0].file;

  onProgress({ progress: 5, statusText: 'Uploading document to secure processing engine...' });

  const formData = new FormData();
  formData.append('file', primaryFile);
  formData.append('toolId', toolId);
  formData.append('options', JSON.stringify(options || {}));

  let jobId: string | null = null;

  try {
    const postRes = await fetch('/api/jobs', {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!postRes.ok) {
      const errJson = await postRes.json().catch(() => ({}));
      throw new Error(errJson.error || `Server job initialization failed with status ${postRes.status}`);
    }

    const jobData = await postRes.json();
    jobId = jobData.jobId;

    if (jobId && onJobAssigned) {
      onJobAssigned(jobId);
    }

    onProgress({
      progress: jobData.progress || 10,
      statusText: jobData.stage || 'Job queued in conversion engine...',
    });

    // Poll for status until completed or failed (§7)
    const pollIntervalMs = 750;
    while (!signal?.aborted) {
      await new Promise((res) => setTimeout(res, pollIntervalMs));

      if (signal?.aborted) break;

      const pollRes = await fetch(`/api/jobs/${jobId}`);
      if (!pollRes.ok) {
        throw new Error('Failed to retrieve job status.');
      }

      const pollData = await pollRes.json();

      onProgress({
        progress: pollData.progress || 15,
        statusText: pollData.stage || 'Processing document...',
      });

      if (pollData.status === 'completed') {
        onProgress({ progress: 98, statusText: 'Downloading converted document...' });

        const downloadUrl = pollData.output?.downloadUrl || `/api/jobs/${jobId}/download`;
        const downloadRes = await fetch(downloadUrl);
        if (!downloadRes.ok) {
          throw new Error('Failed to stream finalized document.');
        }

        const blob = await downloadRes.blob();
        const fileName = pollData.output?.fileName || `${primaryFile.name}.converted`;
        const mimeType = pollData.output?.mimeType || blob.type || 'application/octet-stream';

        onProgress({ progress: 100, statusText: 'Conversion completed successfully!' });

        return {
          blob,
          fileName,
          mimeType,
          sizeBytes: blob.size,
        };
      }

      if (pollData.status === 'failed') {
        const errorMsg = pollData.error?.message || 'Document conversion failed.';
        throw new Error(errorMsg);
      }

      if (pollData.status === 'cancelled') {
        throw new Error('Job was cancelled.');
      }
    }

    if (signal?.aborted && jobId) {
      // Trigger server-side cancellation (§20)
      fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' }).catch(() => {});
      throw new Error('Processing cancelled by user.');
    }

    throw new Error('Unexpected job termination.');
  } catch (err: any) {
    if (signal?.aborted) {
      if (jobId) {
        fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' }).catch(() => {});
      }
      throw err;
    }

    // If server worker endpoint is unavailable and a client fallback exists, attempt fallback
    if (fallbackClientProcess && (err.message.includes('fetch') || err.message.includes('network'))) {
      console.warn('[executeTool] Server worker unreachable, attempting client fallback engine...');
      onProgress({ progress: 10, statusText: 'Server unavailable. Attempting in-browser fallback...' });
      return await fallbackClientProcess();
    }

    throw err;
  }
}
