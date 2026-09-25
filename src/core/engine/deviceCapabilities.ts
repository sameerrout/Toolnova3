/**
 * Client Device Capability & Adaptive Resource Profiler
 * Dynamically benchmarks device memory, CPU concurrency, and WebAssembly availability (§10).
 */

export interface DeviceCapabilities {
  deviceClass: 'low-end' | 'medium' | 'high-end';
  estimatedMemoryGb: number;
  cpuCores: number;
  supportsWasm: boolean;
  supportsWorkers: boolean;
  recommendedChunkSize: number;
  shouldUseServerProcessing: (fileSizeBytes: number, pageCount?: number) => boolean;
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    // Server-side fallback defaults
    return {
      deviceClass: 'medium',
      estimatedMemoryGb: 4,
      cpuCores: 4,
      supportsWasm: true,
      supportsWorkers: true,
      recommendedChunkSize: 5,
      shouldUseServerProcessing: () => false,
    };
  }

  // 1. Detect logical CPU cores
  const cpuCores = navigator.hardwareConcurrency || 2;

  // 2. Detect memory hint (Chrome/Edge navigator.deviceMemory, approximate in GB)
  const navAny = navigator as any;
  const memoryGb = navAny.deviceMemory || (cpuCores <= 2 ? 2 : 4);

  // 3. WebAssembly support check
  const supportsWasm =
    typeof WebAssembly !== 'undefined' &&
    typeof WebAssembly.instantiate === 'function';

  // 4. Web Worker support check
  const supportsWorkers = typeof Worker !== 'undefined';

  // 5. Classify device tier
  let deviceClass: 'low-end' | 'medium' | 'high-end' = 'medium';
  let recommendedChunkSize = 5;

  if (memoryGb <= 2 || cpuCores <= 2 || !supportsWasm) {
    deviceClass = 'low-end';
    recommendedChunkSize = 2; // 1-3 pages per batch (§8)
  } else if (memoryGb >= 8 && cpuCores >= 6) {
    deviceClass = 'high-end';
    recommendedChunkSize = 15; // 10-25 pages per batch
  } else {
    deviceClass = 'medium';
    recommendedChunkSize = 6; // 5-10 pages per batch
  }

  // 6. Adaptive processing decision rule (§7, §9)
  const shouldUseServerProcessing = (
    fileSizeBytes: number,
    pageCount?: number
  ): boolean => {
    // If client device is low-end and file exceeds 15MB, use server worker
    if (deviceClass === 'low-end' && fileSizeBytes > 15 * 1024 * 1024) {
      return true;
    }
    // If file exceeds 40MB on medium devices
    if (deviceClass === 'medium' && fileSizeBytes > 40 * 1024 * 1024) {
      return true;
    }
    // High page counts > 80 pages on non-high-end
    if (pageCount && pageCount > 80 && deviceClass !== 'high-end') {
      return true;
    }
    return false;
  };

  return {
    deviceClass,
    estimatedMemoryGb: memoryGb,
    cpuCores,
    supportsWasm,
    supportsWorkers,
    recommendedChunkSize,
    shouldUseServerProcessing,
  };
}
