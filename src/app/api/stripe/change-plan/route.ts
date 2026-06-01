import { NextResponse } from "next/server";
import { z } from "zod";

import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { getStripePriceId } from "@/lib/stripe/prices";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { syncSubscriptionFromStripe } from "@/lib/stripe/syncSubscription";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

const bodySchema = z.object({
  planCode: z.enum(["essential", "pro"]),
  cadence: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`stripe-change-plan:${user.id}`, {
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Not authorized to change plan" }, { status: 403 });
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { planCode, cadence } = parsed.data;
  const priceId = getStripePriceId(planCode as PlanCode, cadence, "self_serve");
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured for this plan" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription. Complete checkout first.", code: "checkout_required" },
      { status: 400 },
    );
  }

  const normalizedStatus = sub.status === "founder_pending" ? "incomplete" : sub.status;
  if (normalizedStatus !== "active" && normalizedStatus !== "trialing") {
    return NextResponse.json(
      {
        error: "Complete checkout to activate your plan, or finish payment in Stripe.",
        code: "checkout_required",
      },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const existing = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = existing.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json({ error: "Subscription has no billable items" }, { status: 500 });
    }

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      metadata: {
        org_id: orgId,
        plan_code: planCode,
        flow: "self_serve",
      },
    });

    await syncSubscriptionFromStripe(updated);

    return NextResponse.json({ ok: true, planCode });
  } catch (error) {
    captureException(error, { step: "stripe_change_plan" });
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
