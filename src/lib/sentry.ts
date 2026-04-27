/**
 * Lightweight error capture stub. Replace with @sentry/nextjs when ready.
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.error("[captureException]", error, context);
  }
  // Future: Sentry.captureException(error, { extra: context })
}
