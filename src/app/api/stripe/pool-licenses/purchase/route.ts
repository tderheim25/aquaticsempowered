import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBillingApiContext } from "@/lib/auth/billingApi";
import { purchasePoolLicenses } from "@/lib/stripe/syncPoolSubscription";
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

  const limited = await enforceRateLimit(`pool-licenses-purchase:${auth.ctx.userId}`, {
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
    const result = await purchasePoolLicenses(auth.ctx.orgId, parsed.data.quantity);
    if (!result.ok) {
      if (result.code === "payment_required") {
        return NextResponse.json({
          code: result.code,
          clientSecret: result.clientSecret,
        });
      }
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true, purchased: result.purchased });
  } catch (error) {
    captureException(error, { step: "pool_licenses_purchase_api" });
    return NextResponse.json({ error: "Failed to purchase pool add-ons" }, { status: 500 });
  }
}
