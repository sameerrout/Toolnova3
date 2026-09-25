import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';
import { resourceManager, ProcessingStrategy } from '@/lib/server/resourceManager';

export type JobStatus =
  | 'queued'
  | 'analyzing'
  | 'processing'
  | 'combining'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface JobProgressInfo {
  progress: number;
  stage: string;
  currentPage?: number;
  totalPages?: number;
  updatedAt: number;
}

export interface JobMetadata {
  jobId: string;
  toolId: string;
  status: JobStatus;
  progress: number;
  stage: string;
  currentPage?: number;
  totalPages?: number;
  createdAt: number;
  updatedAt: number;
  inputFileName: string;
  inputFileSize: number;
  outputFileName?: string;
  outputFileSize?: number;
  outputMimeType?: string;
  errorCode?: string;
  errorMessage?: string;
  processingStrategy: ProcessingStrategy;
}

interface ActiveJob {
  meta: JobMetadata;
  process?: ChildProcess;
  jobDir: string;
  outputPath?: string;
}

const JOBS_BASE_DIR =
  process.env.TOOLNOVA_TEMP_DIR ||
  path.join(process.cwd(), 'backend', 'storage', 'jobs');

// Ensure base storage directory exists
if (!fs.existsSync(JOBS_BASE_DIR)) {
  fs.mkdirSync(JOBS_BASE_DIR, { recursive: true });
}

class JobManager {
  private jobs: Map<string, ActiveJob> = new Map();
  private pythonBin: string;
  private retentionHours: number;

  constructor() {
    this.pythonBin = process.env.TOOLNOVA_PYTHON_BIN || 'python';
    this.retentionHours = parseFloat(process.env.TOOLNOVA_JOB_RETENTION_HOURS || '1');

    // Process Restart Recovery (§8): Restore persistent job states from storage directory
    this.recoverJobsFromStorage();

    // Run periodic cleanup every 10 minutes (§14, §21, §58)
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupAbandonedJobs(), 10 * 60 * 1000).unref();
    }
  }

  /**
   * Recovers existing jobs from filesystem across server restarts (§8).
   */
  private recoverJobsFromStorage(): void {
    try {
      if (!fs.existsSync(JOBS_BASE_DIR)) return;
      const entries = fs.readdirSync(JOBS_BASE_DIR, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const jobDir = path.join(JOBS_BASE_DIR, entry.name);
          const metaPath = path.join(jobDir, 'metadata.json');

          if (fs.existsSync(metaPath)) {
            try {
              const meta: JobMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
              // If previously running when server crashed/restarted, mark as failed/recoverable
              if (meta.status === 'processing' || meta.status === 'queued') {
                meta.status = 'failed';
                meta.errorCode = 'SERVER_RESTARTED';
                meta.errorMessage = 'The processing server was restarted. Please re-submit your document.';
              }
              this.jobs.set(meta.jobId, {
                meta,
                jobDir,
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[JobManager] Error during job recovery from storage:', err);
    }
  }

  /**
   * Sanitizes filenames to prevent path traversal or special shell characters (§9, §22).
   */
  public sanitizeFilename(name: string): string {
    const base = path.basename(name || 'document');
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!sanitized || sanitized === '.' || sanitized === '..') {
      sanitized = 'document';
    }
    return sanitized.slice(0, 100);
  }

  /**
   * Validates file signatures (magic bytes) to ensure file integrity (§20, §22).
   */
  public validateFileSignature(buffer: Buffer, expectedCategory: string): boolean {
    if (buffer.length < 4) return false;

    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    if (expectedCategory === 'pdf') {
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    }

    // DOCX / PPTX are ZIP containers: PK\x03\x04 (0x50 0x4b 0x03 0x04)
    if (expectedCategory === 'docx' || expectedCategory === 'pptx') {
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      );
    }

    return true;
  }

  /**
   * Initiates a new conversion job with isolated disk-backed temporary storage.
   */
  public async createJob(
    toolId: string,
    rawFilename: string,
    fileBuffer: Buffer,
    options: Record<string, any> = {}
  ): Promise<JobMetadata> {
    // Validate file signature based on tool (§22, §29)
    let expectedCategory = '';
    if (toolId === 'pdf-to-word' || toolId === 'pdf-to-powerpoint') {
      expectedCategory = 'pdf';
    } else if (toolId === 'word-to-pdf') {
      expectedCategory = 'docx';
    } else if (toolId === 'powerpoint-to-pdf') {
      expectedCategory = 'pptx';
    }

    if (expectedCategory && !this.validateFileSignature(fileBuffer, expectedCategory)) {
      throw new Error(`INVALID_FILE: The uploaded file does not match the expected ${expectedCategory.toUpperCase()} format or is corrupted.`);
    }

    const jobId = crypto.randomUUID();
    const safeName = this.sanitizeFilename(rawFilename);
    const jobDir = path.join(JOBS_BASE_DIR, jobId);

    // Isolated directory tree: input/, pages/, chunks/, working/, output/ (§9)
    const inputDir = path.join(jobDir, 'input');
    const pagesDir = path.join(jobDir, 'pages');
    const chunksDir = path.join(jobDir, 'chunks');
    const workingDir = path.join(jobDir, 'working');
    const outputDir = path.join(jobDir, 'output');

    fs.mkdirSync(inputDir, { recursive: true });
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(chunksDir, { recursive: true });
    fs.mkdirSync(workingDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });

    const inputPath = path.join(inputDir, safeName);
    fs.writeFileSync(inputPath, fileBuffer);

    // Adaptive Strategy Selection via Server ResourceManager (§5, §8)
    const strategy = resourceManager.selectProcessingStrategy(fileBuffer.length);
    const cost = resourceManager.estimateJobCost(fileBuffer.length);
    resourceManager.reserveResources(jobId, cost);

    const meta: JobMetadata = {
      jobId,
      toolId,
      status: 'queued',
      progress: 0,
      stage: 'Job queued for processing',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      inputFileName: safeName,
      inputFileSize: fileBuffer.length,
      processingStrategy: strategy,
    };

    const activeJob: ActiveJob = {
      meta,
      jobDir,
    };

    this.jobs.set(jobId, activeJob);
    this.persistJobMetadata(jobDir, meta);
    this.persistJobProgress(jobDir, {
      progress: 0,
      stage: 'Job queued',
      updatedAt: Date.now(),
    });

    // Asynchronously dispatch the specialized worker
    this.dispatchWorker(jobId, inputPath, outputDir, options).catch((err) => {
      console.error(`[JobManager] Error in worker for job ${jobId}:`, err);
      this.failJob(jobId, 'PROCESSING_FAILED', 'Internal processing error occurred.');
    });

    return meta;
  }

  /**
   * Retrieves the current status and metadata of a job.
   */
  public getJob(jobId: string): JobMetadata | null {
    const job = this.jobs.get(jobId);
    if (job) return job.meta;

    // Check disk storage if not currently cached in memory
    const jobDir = path.join(JOBS_BASE_DIR, jobId);
    const metaPath = path.join(jobDir, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      try {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Cancels a running job, terminates child processes, and wipes temporary files (§12, §20).
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.process && !job.process.killed) {
      job.process.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (job.process && !job.process.killed) {
            job.process.kill('SIGKILL');
          }
        } catch {}
      }, 2000).unref();
    }

    job.meta.status = 'cancelled';
    job.meta.stage = 'Job was cancelled by the user.';
    job.meta.updatedAt = Date.now();

    resourceManager.releaseResources(jobId);
    this.persistJobMetadata(job.jobDir, job.meta);
    this.cleanDirectory(job.jobDir);
    this.jobs.delete(jobId);

    return true;
  }

  /**
   * Dispatches the appropriate specialized worker based on tool ID.
   */
  private async dispatchWorker(
    jobId: string,
    inputPath: string,
    outputDir: string,
    options: Record<string, any>
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.meta.status = 'processing';
    job.meta.progress = 10;
    job.meta.stage = 'Initializing processing engine...';
    job.meta.updatedAt = Date.now();

    const baseName = path.parse(job.meta.inputFileName).name;
    const workersDir = path.join(process.cwd(), 'backend', 'workers');

    let scriptName = '';
    let outFileName = '';
    let outMime = '';

    if (job.meta.toolId === 'pdf-to-powerpoint') {
      scriptName = 'pdf_to_pptx.py';
      outFileName = `${baseName}.pptx`;
      outMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (job.meta.toolId === 'pdf-to-word') {
      scriptName = 'pdf_to_word.py';
      outFileName = `${baseName}.docx`;
      outMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (job.meta.toolId === 'word-to-pdf') {
      scriptName = 'word_to_pdf.py';
      outFileName = `${baseName}.pdf`;
      outMime = 'application/pdf';
    } else if (job.meta.toolId === 'powerpoint-to-pdf') {
      scriptName = 'pptx_to_pdf.py';
      outFileName = `${baseName}.pdf`;
      outMime = 'application/pdf';
    } else {
      this.failJob(jobId, 'UNSUPPORTED_TOOL', `Backend worker for tool ${job.meta.toolId} is not available.`);
      return;
    }

    const scriptPath = path.join(workersDir, scriptName);
    const outputPath = path.join(outputDir, outFileName);
    job.outputPath = outputPath;

    // Execute Python worker using configurable python executable (§23)
    const args = [scriptPath, '--input', inputPath, '--output', outputPath];
    const proc = spawn(this.pythonBin, args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    job.process = proc;

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('__PROGRESS__')) {
          try {
            const data = JSON.parse(line.slice(12));
            if (data.progress !== undefined) {
              job.meta.progress = data.progress;
            }
            if (data.statusText) {
              job.meta.stage = data.statusText;
            }
            if (data.currentPage !== undefined) {
              job.meta.currentPage = data.currentPage;
            }
            if (data.totalPages !== undefined) {
              job.meta.totalPages = data.totalPages;
            }
            job.meta.updatedAt = Date.now();

            this.persistJobProgress(job.jobDir, {
              progress: job.meta.progress,
              stage: job.meta.stage,
              currentPage: job.meta.currentPage,
              totalPages: job.meta.totalPages,
              updatedAt: job.meta.updatedAt,
            });
          } catch {}
        }
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      console.warn(`[Worker stderr ${jobId}]:`, chunk.toString().trim());
    });

    proc.on('close', (code) => {
      resourceManager.releaseResources(jobId);

      if (job.meta.status === 'cancelled') return;

      if (code === 0 && fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          this.failJob(jobId, 'VALIDATION_FAILED', 'Output document was generated empty.');
          return;
        }

        job.meta.status = 'completed';
        job.meta.progress = 100;
        job.meta.stage = 'Conversion complete and verified.';
        job.meta.outputFileName = outFileName;
        job.meta.outputFileSize = stats.size;
        job.meta.outputMimeType = outMime;
        job.meta.updatedAt = Date.now();

        this.persistJobMetadata(job.jobDir, job.meta);
        this.persistJobProgress(job.jobDir, {
          progress: 100,
          stage: 'Completed',
          updatedAt: Date.now(),
        });
      } else {
        this.failJob(
          jobId,
          'CONVERSION_FAILED',
          'Document conversion failed. Please check the file for corruption or password encryption.'
        );
      }
    });

    proc.on('error', (err) => {
      resourceManager.releaseResources(jobId);
      console.error(`[Worker error ${jobId}]:`, err);
      this.failJob(jobId, 'WORKER_CRASH', 'The processing worker encountered an unexpected system error.');
    });
  }

  /**
   * Marks a job as failed with a sanitized, user-friendly error code (§19, §30).
   */
  private failJob(jobId: string, errorCode: string, errorMessage: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.meta.status = 'failed';
    job.meta.errorCode = errorCode;
    job.meta.errorMessage = errorMessage;
    job.meta.stage = errorMessage;
    job.meta.updatedAt = Date.now();

    resourceManager.releaseResources(jobId);
    this.persistJobMetadata(job.jobDir, job.meta);
  }

  /**
   * Retrieves the physical output file path for download streaming.
   */
  public getJobOutputPath(jobId: string): string | null {
    const job = this.jobs.get(jobId);
    if (job && job.outputPath && fs.existsSync(job.outputPath)) {
      return job.outputPath;
    }

    const jobDir = path.join(JOBS_BASE_DIR, jobId);
    const meta = this.getJob(jobId);
    if (meta && meta.outputFileName) {
      const direct = path.join(jobDir, 'output', meta.outputFileName);
      if (fs.existsSync(direct)) return direct;
    }
    return null;
  }

  private persistJobMetadata(jobDir: string, meta: JobMetadata) {
    try {
      const metaPath = path.join(jobDir, 'metadata.json');
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    } catch {}
  }

  private persistJobProgress(jobDir: string, progress: JobProgressInfo) {
    try {
      const progPath = path.join(jobDir, 'progress.json');
      fs.writeFileSync(progPath, JSON.stringify(progress, null, 2), 'utf-8');
    } catch {}
  }

  /**
   * Safely deletes a directory and all nested contents.
   */
  private cleanDirectory(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[JobManager] Failed to clean ${dir}:`, err);
    }
  }

  /**
   * Automatically cleans abandoned jobs older than retention TTL (§14, §21, §58).
   */
  public cleanupAbandonedJobs(): void {
    const retentionMs = this.retentionHours * 60 * 60 * 1000;
    const now = Date.now();

    try {
      if (!fs.existsSync(JOBS_BASE_DIR)) return;
      const entries = fs.readdirSync(JOBS_BASE_DIR, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(JOBS_BASE_DIR, entry.name);
          const metaPath = path.join(dirPath, 'metadata.json');

          let mtime = now;
          if (fs.existsSync(metaPath)) {
            try {
              const meta: JobMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
              mtime = meta.updatedAt || meta.createdAt || now;
            } catch {
              mtime = fs.statSync(dirPath).mtimeMs;
            }
          } else {
            mtime = fs.statSync(dirPath).mtimeMs;
          }

          if (now - mtime > retentionMs) {
            this.cleanDirectory(dirPath);
            this.jobs.delete(entry.name);
          }
        }
      }
    } catch (err) {
      console.warn('[JobManager] Error in abandoned job cleanup:', err);
    }
  }
}

export const jobManager = new JobManager();
