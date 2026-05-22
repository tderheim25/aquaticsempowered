import type { PoolTargetRanges } from "@/types/database";

import { mergeTargetRanges } from "./defaultTargetRanges";

export type ReadingStatus = "in_range" | "low" | "high" | "unknown";

export function evaluateMetric(
  value: number | null | undefined,
  bandKey: string,
  targets?: PoolTargetRanges | unknown
): ReadingStatus {
  if (value == null || !Number.isFinite(value)) return "unknown";
  const ranges = mergeTargetRanges(targets);
  const band = ranges[bandKey];
  if (!band) return "unknown";
  if (value < band.min) return "low";
  if (value > band.max) return "high";
  return "in_range";
}

export type AttentionReason = "ph" | "free_chlorine" | "combined_chlorine" | "lsi";

export function evaluateChemicalAttention(log: {
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  langelier_saturation_index: number | null;
  target_ranges?: unknown;
}): AttentionReason[] {
  const ranges = mergeTargetRanges(log.target_ranges);
  const reasons: AttentionReason[] = [];

  if (log.ph != null) {
    const band = ranges.ph;
    if (band && (log.ph < band.min || log.ph > band.max)) reasons.push("ph");
  }

  if (log.free_chlorine != null) {
    const band = ranges.free_chlorine;
    if (band && (log.free_chlorine < band.min || log.free_chlorine > band.max)) reasons.push("free_chlorine");
  }

  if (
    log.free_chlorine != null &&
    log.total_chlorine != null &&
    log.total_chlorine - log.free_chlorine > 0.5
  ) {
    reasons.push("combined_chlorine");
  }

  if (log.langelier_saturation_index != null) {
    if (log.langelier_saturation_index < -0.3 || log.langelier_saturation_index > 0.3) {
      reasons.push("lsi");
    }
  }

  return reasons;
}
