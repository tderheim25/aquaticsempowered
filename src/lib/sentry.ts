/**
 * Lightweight error capture stub. Replace with @sentry/nextjs when ready.
 */

function formatErrorForLog(error: unknown): unknown {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if ("message" in record || "code" in record) {
      return {
        message: record.message,
        code: record.code,
        details: record.details,
        hint: record.hint,
      };
    }
  }
  return error;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.error("[captureException]", formatErrorForLog(error), context);
  }
  // Future: Sentry.captureException(error, { extra: context })
}
