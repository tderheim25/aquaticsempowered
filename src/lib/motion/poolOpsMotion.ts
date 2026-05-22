export const poolOpsDurations = {
  fast: 120,
  medium: 200,
  slow: 320,
  gauge: 600,
} as const;

export const poolOpsEasing = "cubic-bezier(0.4, 0, 0.2, 1)";

export const staggerDelay = (index: number, cap = 200) => Math.min(index * 40, cap);

export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function motionSafeTransition(props: string, durationMs: number) {
  return {
    transition: `${props} ${durationMs}ms ${poolOpsEasing}`,
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  };
}
