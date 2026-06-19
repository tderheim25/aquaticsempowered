import { redirect } from "next/navigation";

import { SubscriptionPageContent } from "@/components/billing/SubscriptionPageContent";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback, requireAuth } from "@/lib/auth/rbac";
import { getPoolLicenseSnapshot } from "@/lib/billing/poolLicenses";
import { loadOrgSubscriptionDetails } from "@/lib/billing/loadOrgSubscriptionDetails";
import { isAwaitingPayment } from "@/lib/billing/subscriptionSummary";
import { getSelfServeBillingAvailability } from "@/lib/billing/stripeBillingAvailability";
import { captureException } from "@/lib/sentry";
import { syncOrgBillingFromStripe } from "@/lib/stripe/syncSubscription";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Subscription | Aquatics Empowered",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  await requireAuth();
  const { checkout } = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getUsersRowWithAdminFallback(user!.id);
  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    redirect("/app");
  }

  const orgCtx = await loadActiveOrgContext(profile);
  if (!orgCtx.activeOrgId) {
    redirect("/app");
  }

  const billingRootId = orgCtx.billingRootOrgId ?? orgCtx.activeOrgId;

  if (isStripeConfigured()) {
    const { data: subscriptionRow } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, stripe_subscription_id")
      .eq("org_id", billingRootId)
      .maybeSingle();

    const needsResync =
      (subscriptionRow?.status && isAwaitingPayment(subscriptionRow.status)) ||
      (subscriptionRow?.stripe_subscription_id && !subscriptionRow.current_period_end);

    if (needsResync) {
      try {
        await syncOrgBillingFromStripe(billingRootId);
      } catch (error) {
        captureException(error, { step: "billing_page_resync", orgId: billingRootId });
      }
    }
  }

  const [details, billingAvailability] = await Promise.all([
    loadOrgSubscriptionDetails(
      supabase,
      orgCtx.activeOrgId,
      orgCtx.planCode as PlanCode,
      orgCtx.activeOrgName,
      true,
    ),
    Promise.resolve(getSelfServeBillingAvailability()),
  ]);

  const poolLicenseSnapshot =
    details.hasStripeSubscription && billingRootId
      ? await getPoolLicenseSnapshot(billingRootId).catch(() => null)
      : null;

  const autoOpenCheckout = checkout === "1";

  return (
    <SubscriptionPageContent
      details={details}
      billingAvailability={billingAvailability}
      poolLicenseSnapshot={poolLicenseSnapshot}
      autoOpenCheckout={autoOpenCheckout}
    />
  );
}
