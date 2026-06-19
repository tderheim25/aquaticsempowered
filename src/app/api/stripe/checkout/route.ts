import { NextResponse } from "next/server";

import { z } from "zod";

import { requireBillingApiContext } from "@/lib/auth/billingApi";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { createCheckoutSession } from "@/lib/stripe/createCheckoutSession";
import { isStripeConfigured } from "@/lib/stripe/server";
import type { PlanCode } from "@/types/database";

const checkoutBodySchema = z.object({
  planCode: z.enum(["essential", "pro", "enterprise"]),
  cadence: z.enum(["monthly", "annual"]).optional().default("monthly"),
  flow: z.enum(["founder", "self_serve"]).optional().default("self_serve"),
  promoCode: z.string().trim().max(64).optional(),
  embedded: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const auth = await requireBillingApiContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit(`stripe-checkout:${auth.ctx.userId}`, {
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { planCode, cadence, flow, promoCode, embedded } = parsed.data;

  const result = await createCheckoutSession({
    orgId: auth.ctx.orgId,
    email: auth.ctx.email,
    planCode: planCode as PlanCode,
    cadence,
    flow,
    promoCode,
    embedded,
  });

  if (!result.ok) {
    const status = result.code === "price_not_configured" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  if (result.embedded) {
    return NextResponse.json({ clientSecret: result.clientSecret });
  }

  return NextResponse.json({ url: result.url });
}
