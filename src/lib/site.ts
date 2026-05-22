function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

export function isLocalhostAppUrl(url: string) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/**
 * Canonical public app origin for emails, invites, and auth redirects.
 * Prefer NEXT_PUBLIC_APP_URL / APP_URL so localhost SITE_URL does not leak into production emails.
 */
export function resolveBaseUrl(requestOrigin?: string | null): string {
  const isProd = process.env.NODE_ENV === "production";

  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || null;
  if (explicit) return stripTrailingSlash(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    const host = vercelProduction.startsWith("http") ? vercelProduction : `https://${vercelProduction}`;
    return stripTrailingSlash(host);
  }

  if (isProd && process.env.VERCEL_URL?.trim()) {
    return stripTrailingSlash(`https://${process.env.VERCEL_URL.trim()}`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl && !(isProd && isLocalhostAppUrl(siteUrl))) {
    return stripTrailingSlash(siteUrl);
  }

  const origin = requestOrigin?.trim();
  if (origin && !(isProd && isLocalhostAppUrl(origin))) {
    return stripTrailingSlash(origin);
  }

  if (!isProd) {
    if (siteUrl) return stripTrailingSlash(siteUrl);
    if (origin) return stripTrailingSlash(origin);
    return "http://localhost:3000";
  }

  return stripTrailingSlash(origin ?? siteUrl ?? "http://localhost:3000");
}

export function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return resolveBaseUrl();
}
