import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBillingApiContext } from "@/lib/auth/billingApi";
import { releasePoolLicenses } from "@/lib/stripe/syncPoolSubscription";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { isStripeConfigured } from "@/lib/stripe/server";
import { captureException } from "@/lib/sentry";

const bodySchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const auth = await requireBillingApiContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit(`pool-licenses-release:${auth.ctx.userId}`, {
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await releasePoolLicenses(auth.ctx.orgId, parsed.data.quantity);
    if (!result.ok) {
      const status = result.code === "insufficient_addons" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({
      ok: true,
      purchased: result.purchased,
      released: result.released,
    });
  } catch (error) {
    captureException(error, { step: "pool_licenses_release_api" });
    return NextResponse.json({ error: "Failed to release pool add-ons" }, { status: 500 });
  }
}
