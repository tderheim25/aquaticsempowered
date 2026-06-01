import { US_STATES } from "@/lib/geo/usStates";

export type UsState = (typeof US_STATES)[number];

/** Match a stored region value (name or 2-letter code) to a US state entry. */
export function resolveUsState(value: string | null | undefined): UsState | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const byCode = US_STATES.find((s) => s.code === trimmed.toUpperCase());
  if (byCode) return byCode;
  return US_STATES.find((s) => s.name.toLowerCase() === trimmed.toLowerCase()) ?? null;
}
