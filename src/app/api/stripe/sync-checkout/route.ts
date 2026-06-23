import { NextResponse } from "next/server";

import { z } from "zod";

import { requireBillingApiContext } from "@/lib/auth/billingApi";
import { checkoutSessionIdFromClientSecret } from "@/lib/stripe/checkoutSessionId";
import { captureException } from "@/lib/sentry";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import {
  syncCheckoutSessionCompleted,
  syncOrgBillingFromStripe,
} from "@/lib/stripe/syncSubscription";

const bodySchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  clientSecret: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const auth = await requireBillingApiContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

  const sessionId =
    parsed.data.sessionId ??
    (parsed.data.clientSecret
      ? checkoutSessionIdFromClientSecret(parsed.data.clientSecret)
      : null);

  try {
    if (sessionId) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" || session.status === "complete") {
        await syncCheckoutSessionCompleted(session);
        return NextResponse.json({ ok: true, synced: true, source: "session" });
      }
    }

    const synced = await syncOrgBillingFromStripe(auth.ctx.orgId);
    return NextResponse.json({ ok: true, synced, source: "org" });
  } catch (error) {
    captureException(error, { step: "stripe_sync_checkout_api", orgId: auth.ctx.orgId });
    return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 });
  }
}
