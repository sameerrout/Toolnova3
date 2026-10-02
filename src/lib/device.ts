/**
 * Device capability detection for low-end hardware.
 *
 * Target devices include 2 GB RAM Android phones, decade-old laptops and
 * 3G-class connections. Every limit in `src/lib/limits.ts` is scaled from the
 * tier computed here, so tools degrade gracefully instead of crashing the tab.
 *
 * All detection is best-effort: `navigator.deviceMemory` is Chromium-only, so
 * every value has a conservative fallback and the tier is never higher than
 * what the weakest signal supports.
 */

export type DeviceTier = 'low' | 'mid' | 'high';

export interface DeviceProfile {
  tier: DeviceTier;
  /** `navigator.deviceMemory` in GB, or a conservative guess. */
  memoryGb: number;
  /** `navigator.hardwareConcurrency`, or 2 when unknown. */
  cores: number;
  /** Multiplier applied to every per-tool numeric limit. */
  scale: number;
  /** True when the browser reports reduced-data / slow effective connection. */
  saveData: boolean;
  /** `navigator.connection.effectiveType` when available. */
  effectiveType: string | null;
  /** True when the OS asks for reduced motion. */
  prefersReducedMotion: boolean;
  /** Human-readable summary used in the low-spec notice. */
  summary: string;
}

const DEFAULT_PROFILE: DeviceProfile = {
  tier: 'mid',
  memoryGb: 4,
  cores: 4,
  scale: 1,
  saveData: false,
  effectiveType: null,
  prefersReducedMotion: false,
  summary: 'Standard settings',
};

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

/**
 * Reads a device profile from `navigator`.
 *
 * Safe to call during SSR: without a `navigator` it returns the mid-tier
 * default, which is also what the static HTML is rendered with before
 * hydration.
 */
export function detectDeviceProfile(): DeviceProfile {
  if (typeof navigator === 'undefined') return DEFAULT_PROFILE;

  const nav = navigator as NavigatorWithHints;

  const memoryGb =
    typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 ? nav.deviceMemory : 4;
  const cores =
    typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0
      ? nav.hardwareConcurrency
      : 2;
  const saveData = nav.connection?.saveData === true;
  const effectiveType = nav.connection?.effectiveType ?? null;

  let prefersReducedMotion = false;
  try {
    prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    prefersReducedMotion = false;
  }

  const slowNetwork =
    saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';

  // Score each signal, then take the WORST outcome so a device is never
  // over-estimated (an 8-core phone with 2 GB RAM is still a low-end device).
  const memoryTier: DeviceTier = memoryGb <= 2 ? 'low' : memoryGb <= 4 ? 'mid' : 'high';
  const coreTier: DeviceTier = cores <= 2 ? 'low' : cores <= 4 ? 'mid' : 'high';
  const networkTier: DeviceTier = slowNetwork ? 'low' : 'high';

  const rank: Record<DeviceTier, number> = { low: 0, mid: 1, high: 2 };
  const tier = [memoryTier, coreTier, networkTier].reduce<DeviceTier>(
    (worst, current) => (rank[current] < rank[worst] ? current : worst),
    'high'
  );

  const scale = tier === 'low' ? 0.4 : tier === 'mid' ? 0.75 : 1;

  return {
    tier,
    memoryGb,
    cores,
    scale,
    saveData,
    effectiveType,
    prefersReducedMotion,
    summary: describeProfile(tier, memoryGb, cores, slowNetwork),
  };
}

function describeProfile(
  tier: DeviceTier,
  memoryGb: number,
  cores: number,
  slowNetwork: boolean
): string {
  const base =
    tier === 'low'
      ? 'Low-memory mode'
      : tier === 'mid'
        ? 'Balanced mode'
        : 'Full-quality mode';
  const parts = [`~${memoryGb} GB RAM`, `${cores} CPU threads`];
  if (slowNetwork) parts.push('slow connection');
  return `${base} (${parts.join(', ')})`;
}

/** Scales an integer limit by the device profile, never below `floor`. */
export function scaleLimit(base: number, profile: DeviceProfile, floor = 1): number {
  return Math.max(floor, Math.round(base * profile.scale));
}

/** True when the device is weak enough that we should show the low-spec notice. */
export function isConstrainedDevice(profile: DeviceProfile): boolean {
  return profile.tier !== 'high';
}

/**
 * Upper bound on how large an in-memory archive may get on this device.
 *
 * Used by the ZIP tool and the batch image tools to warn *before* the browser
 * runs out of memory, instead of crashing mid-job.
 */
export function memoryBudgetMb(profile: DeviceProfile): number {
  if (profile.tier === 'low') return 120;
  if (profile.tier === 'mid') return 400;
  return 900;
}

/** Recommended concurrency for canvas / PDF batch work. */
export function recommendedConcurrency(profile: DeviceProfile): number {
  return Math.max(1, Math.min(profile.tier === 'high' ? 4 : profile.tier === 'mid' ? 2 : 1, profile.cores - 1));
}
