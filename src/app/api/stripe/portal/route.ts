import { NextResponse } from "next/server";

import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { captureException } from "@/lib/sentry";

export async function POST() {
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

  const limited = await enforceRateLimit(`stripe-portal:${user.id}`, {
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

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/app`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    captureException(error, { step: "stripe_portal_create" });
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
