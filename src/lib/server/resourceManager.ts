import os from 'os';

export type ProcessingStrategy =
  | 'CLIENT_SIDE'
  | 'FAST_MEMORY'
  | 'CHUNKED'
  | 'DISK_BACKED'
  | 'STREAMING';

export interface SystemResourceSnapshot {
  totalMemoryMb: number;
  freeMemoryMb: number;
  cpuCount: number;
  cpuLoadAvg: number[];
  activeWorkers: number;
  maxConcurrency: number;
  activeMemoryReservedMb: number;
}

export interface JobResourceCost {
  estimatedMemoryMb: number;
  estimatedDiskMb: number;
  estimatedDurationSec: number;
}

class ServerResourceManager {
  private activeReservations: Map<string, number> = new Map();
  private maxAllowedWorkers: number;
  private memorySafetyReserveMb: number;

  constructor() {
    // Configurable through environment variables with safe defaults (§5, §11, §61)
    const envWorkers = parseInt(process.env.TOOLNOVA_MAX_WORKERS || '0', 10);
    this.maxAllowedWorkers = envWorkers > 0 ? envWorkers : Math.max(1, Math.min(os.cpus().length, 8));
    this.memorySafetyReserveMb = parseInt(process.env.TOOLNOVA_SAFETY_RESERVE_MB || '512', 10);
  }

  /**
   * Samples real-time server operating system resources (§5).
   */
  public getSystemResources(): SystemResourceSnapshot {
    const totalMem = Math.round(os.totalmem() / (1024 * 1024));
    const freeMem = Math.round(os.freemem() / (1024 * 1024));
    const cpuCount = os.cpus().length;
    const cpuLoadAvg = os.loadavg();

    let activeReserved = 0;
    for (const mem of this.activeReservations.values()) {
      activeReserved += mem;
    }

    return {
      totalMemoryMb: totalMem,
      freeMemoryMb: freeMem,
      cpuCount,
      cpuLoadAvg,
      activeWorkers: this.activeReservations.size,
      maxConcurrency: this.getAllowedConcurrency(),
      activeMemoryReservedMb: activeReserved,
    };
  }

  /**
   * Estimates memory and disk footprint for a given document (§5).
   */
  public estimateJobCost(fileSizeBytes: number, estimatedPages: number = 1): JobResourceCost {
    const fileSizeMb = fileSizeBytes / (1024 * 1024);

    // Baseline memory required by the Python process + document object graph
    const baseMemoryMb = 80;
    // Estimated ~5MB per rendered page bitmap in memory if chunked
    const pageMemoryMb = Math.min(50, estimatedPages * 3);
    const estimatedMemoryMb = Math.round(baseMemoryMb + fileSizeMb * 2.5 + pageMemoryMb);

    // Disk space: input file + intermediate page images + output file
    const estimatedDiskMb = Math.round(fileSizeMb * 3 + estimatedPages * 2 + 10);
    const estimatedDurationSec = Math.max(2, Math.round(estimatedPages * 0.8 + fileSizeMb * 0.5));

    return {
      estimatedMemoryMb,
      estimatedDiskMb,
      estimatedDurationSec,
    };
  }

  /**
   * Dynamically selects the optimal processing strategy based on available server RAM,
   * active load, file size, and estimated complexity (§5, §7).
   */
  public selectProcessingStrategy(fileSizeBytes: number, estimatedPages: number = 1): ProcessingStrategy {
    const sys = this.getSystemResources();
    const effectiveFreeMb = sys.freeMemoryMb - sys.activeMemoryReservedMb;
    const cost = this.estimateJobCost(fileSizeBytes, estimatedPages);

    // If file is very large (> 60MB or > 120 pages) or free memory is constrained
    if (fileSizeBytes > 60 * 1024 * 1024 || estimatedPages > 120 || effectiveFreeMb < cost.estimatedMemoryMb * 1.5) {
      return 'DISK_BACKED';
    }

    // Medium files or multi-page documents (15-60MB, 20-120 pages)
    if (fileSizeBytes > 15 * 1024 * 1024 || estimatedPages > 20) {
      return 'CHUNKED';
    }

    // Small files under generous server memory headroom
    if (effectiveFreeMb > cost.estimatedMemoryMb * 3 && fileSizeBytes <= 15 * 1024 * 1024) {
      return 'FAST_MEMORY';
    }

    return 'CHUNKED';
  }

  /**
   * Calculates dynamic worker concurrency based on available CPU cores and RAM headroom (§11).
   */
  public getAllowedConcurrency(): number {
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    // Each worker is allocated a nominal safe budget of ~300MB
    const memBasedWorkers = Math.max(1, Math.floor((totalMemMb - this.memorySafetyReserveMb) / 300));
    return Math.min(this.maxAllowedWorkers, memBasedWorkers);
  }

  /**
   * Determines memory-safe page chunk size based on current memory pressure (§8).
   */
  public getChunkSize(estimatedPages: number = 100): number {
    const sys = this.getSystemResources();
    const effectiveFreeMb = sys.freeMemoryMb - sys.activeMemoryReservedMb;

    if (effectiveFreeMb < 400) {
      return 3; // Under memory pressure: small batches (1-3 pages)
    }
    if (effectiveFreeMb < 1200) {
      return 10; // Medium server load: 10 pages per batch
    }
    return 25; // Abundant memory headroom: 25 pages per batch
  }

  /**
   * Determines whether the server has sufficient headroom to launch a new worker immediately (§5).
   */
  public canStartJob(cost: JobResourceCost): boolean {
    const sys = this.getSystemResources();
    if (sys.activeWorkers >= sys.maxConcurrency) {
      return false;
    }
    const effectiveFree = sys.freeMemoryMb - sys.activeMemoryReservedMb;
    return effectiveFree > cost.estimatedMemoryMb + this.memorySafetyReserveMb;
  }

  /**
   * Reserves estimated memory for an active job.
   */
  public reserveResources(jobId: string, cost: JobResourceCost): void {
    this.activeReservations.set(jobId, cost.estimatedMemoryMb);
  }

  /**
   * Releases reserved memory upon job completion, failure, or cancellation.
   */
  public releaseResources(jobId: string): void {
    this.activeReservations.delete(jobId);
  }
}

export const resourceManager = new ServerResourceManager();
