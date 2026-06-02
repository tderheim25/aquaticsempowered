import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : undefined;
const supabaseWss = supabaseHost ? `wss://${supabaseHost}` : undefined;

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * Scoped to the third parties this app actually talks to (Supabase, Stripe,
 * PostHog, Sentry). `unsafe-inline` is required for styles because MUI/Emotion
 * inject inline <style> tags, and for scripts because the Next.js App Router
 * emits inline bootstrap/streaming scripts without a nonce. `unsafe-eval` is
 * only enabled in development (Next dev tooling / React refresh need it).
 */
function buildContentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    supabaseOrigin,
    supabaseWss,
    "https://*.supabase.co",
    "https://*.supabase.in",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://*.posthog.com",
    "https://*.ingest.sentry.io",
    "https://*.sentry.io",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.posthog.com https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  // Default Server Action body limit is 1MB; community posts allow images up to 5MB each.
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
