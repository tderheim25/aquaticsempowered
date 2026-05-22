import type { PoolTargetRanges } from "@/types/database";

export const DEFAULT_TARGET_RANGES: PoolTargetRanges = {
  ph: { min: 7.2, max: 7.6, ideal: 7.4 },
  free_chlorine: { min: 1, max: 5, ideal: 3 },
  total_alkalinity: { min: 80, max: 120, ideal: 100 },
  calcium_hardness: { min: 250, max: 500, ideal: 375 },
  cyanuric_acid: { min: 30, max: 100, ideal: 50 },
  temp_f: { min: 75, max: 85, ideal: 82 },
};

export function mergeTargetRanges(custom: unknown): PoolTargetRanges {
  if (!custom || typeof custom !== "object") return { ...DEFAULT_TARGET_RANGES };
  const c = custom as Record<string, Partial<{ min: number; max: number; ideal?: number }>>;
  const merged = { ...DEFAULT_TARGET_RANGES };
  for (const key of Object.keys(merged)) {
    const band = c[key];
    if (band && typeof band.min === "number" && typeof band.max === "number") {
      merged[key] = { min: band.min, max: band.max, ideal: band.ideal ?? merged[key]?.ideal };
    }
  }
  return merged;
}
