import { NextResponse } from "next/server";
import { z } from "zod";

import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripePriceId, type BillingCadence, type CheckoutFlow } from "@/lib/stripe/prices";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { captureException } from "@/lib/sentry";
import type { PlanCode } from "@/types/database";

const checkoutBodySchema = z.object({
  planCode: z.enum(["essential", "pro", "enterprise"]),
  cadence: z.enum(["monthly", "annual"]).optional().default("monthly"),
  flow: z.enum(["founder", "self_serve"]).optional().default("self_serve"),
});

async function getOrCreateStripeCustomer(orgId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    return existingSub.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { org_id: orgId },
  });

  if (existingSub?.id) {
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("id", existingSub.id);
  } else {
    await admin.from("subscriptions").insert({
      org_id: orgId,
      plan_code: "free",
      status: "inactive",
      stripe_customer_id: customer.id,
    });
  }

  return customer.id;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Throttle checkout-session creation per user to avoid abusing the Stripe API.
  const limited = await enforceRateLimit(`stripe-checkout:${user.id}`, {
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile required" }, { status: 403 });
  }

  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    return NextResponse.json({ error: "Not authorized to manage billing" }, { status: 403 });
  }

  const orgCtx = await loadActiveOrgContext(profile);
  const orgId = orgCtx.activeOrgId ?? profile.org_id;
  if (!orgId) {
    return NextResponse.json({ error: "Organization required" }, { status: 403 });
  }

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

  const { planCode, cadence, flow } = parsed.data;
  const effectiveCadence: BillingCadence = flow === "founder" ? "annual" : cadence;
  const priceId = getStripePriceId(planCode as PlanCode, effectiveCadence, flow as CheckoutFlow);

  if (!priceId) {
    return NextResponse.json(
      {
        error: `Billing is not configured for ${planCode} (${effectiveCadence}). Add the Stripe price ID to your server environment.`,
        code: "price_not_configured",
      },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const stripeCustomerId = await getOrCreateStripeCustomer(orgId, user.email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: orgId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        org_id: orgId,
        plan_code: planCode,
        flow,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          plan_code: planCode,
          flow,
        },
      },
      success_url:
        flow === "founder"
          ? `${siteUrl}/founders/thanks?checkout=success&session_id={CHECKOUT_SESSION_ID}`
          : `${siteUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        flow === "founder"
          ? `${siteUrl}/founders?checkout=canceled`
          : `${siteUrl}/app/billing?checkout=canceled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    captureException(error, { step: "stripe_checkout_create" });
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
