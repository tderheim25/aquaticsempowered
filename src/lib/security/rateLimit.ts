import "server-only";

import { NextResponse } from "next/server";

/**
 * Lightweight application-level rate limiting.
 *
 * Two backends:
 *   1. Upstash Redis (REST) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *      are set — works across serverless instances / regions.
 *   2. In-memory fixed-window fallback otherwise — protects a single instance and
 *      is safe for local dev. On multi-instance hosts the in-memory store is
 *      per-instance, so configure Upstash (or an edge WAF) for production-grade
 *      distributed limits.
 *
 * NOTE: Application rate limiting raises the bar for brute-force / abuse / cost
 * drain. Volumetric (L3/L4) DDoS must be absorbed at the CDN/edge (e.g. Vercel,
 * Cloudflare). This utility is the application-layer complement to that.
 */

export type RateLimitConfig = {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when !ok). */
  retryAfter: number;
  remaining: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED_KEYS = 50_000;

function sweepExpired(now: number) {
  if (memoryBuckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}

function checkMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, retryAfter: 0, remaining: config.limit - 1 };
  }

  if (bucket.count >= config.limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)), remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0, remaining: config.limit - bucket.count };
}

async function checkUpstash(
  url: string,
  token: string,
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
  const redisKey = `rl:${key}`;

  // Atomic: INCR then set TTL only on first hit, via pipeline.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSeconds), "NX"],
      ["PTTL", redisKey],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Upstash rate limit request failed: ${res.status}`);
  }

  const payload = (await res.json()) as Array<{ result: number }>;
  const count = Number(payload[0]?.result ?? 0);
  const pttl = Number(payload[2]?.result ?? config.windowMs);
  const retryAfter = pttl > 0 ? Math.ceil(pttl / 1000) : windowSeconds;

  if (count > config.limit) {
    return { ok: false, retryAfter, remaining: 0 };
  }
  return { ok: true, retryAfter: 0, remaining: Math.max(0, config.limit - count) };
}

/**
 * Returns the best-effort client IP from proxy headers. On Vercel/most proxies
 * `x-forwarded-for` is a trusted, proxy-set comma list (client IP first).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Check (and consume) a rate-limit token for `key`. Fails open: if the backend
 * errors we allow the request rather than locking users out.
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      return await checkUpstash(url, token, key, config);
    } catch {
      return checkMemory(key, config);
    }
  }

  return checkMemory(key, config);
}

/** Standard 429 response with a Retry-After header. */
export function tooManyRequestsResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfter)),
      },
    },
  );
}

/**
 * Convenience guard: enforces a limit and returns a ready-to-send 429 response
 * when exceeded, or `null` when the request may proceed.
 *
 * @example
 *   const limited = await enforceRateLimit(`checkout:${user.id}`, { limit: 10, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(key, config);
  if (!result.ok) {
    return tooManyRequestsResponse(result.retryAfter);
  }
  return null;
}
