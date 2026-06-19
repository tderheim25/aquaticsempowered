import "server-only";

import { countActivePoolsForBillingRoot, resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { computePoolLicenseAvailability } from "@/lib/billing/poolLicenseTypes";
import type { PoolLicenseSnapshot } from "@/lib/billing/poolLicenseTypes";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPoolAddonItem } from "@/lib/stripe/syncPoolSubscription";
import type Stripe from "stripe";

export type { PoolLicenseSnapshot } from "@/lib/billing/poolLicenseTypes";

export async function getPoolLicenseSnapshot(orgId: string): Promise<PoolLicenseSnapshot> {
  const billingRootId = await resolveBillingRootOrgId(orgId);
  const admin = createAdminClient();
  const activePoolCount = await countActivePoolsForBillingRoot(billingRootId);

  const { data: sub } = await admin
    .from("subscriptions")
    .select("pool_license_quantity")
    .eq("org_id", billingRootId)
    .maybeSingle();

  const purchased = sub?.pool_license_quantity ?? 0;
  return computePoolLicenseAvailability(purchased, activePoolCount, billingRootId);
}

export async function wouldRequirePoolLicense(
  orgId: string,
  newPoolStatus: string,
): Promise<boolean> {
  if (newPoolStatus !== "active") return false;
  const billingRootId = await resolveBillingRootOrgId(orgId);
  const activeCount = await countActivePoolsForBillingRoot(billingRootId);
  if (activeCount < 1) return false;
  const snapshot = await getPoolLicenseSnapshot(orgId);
  return snapshot.available < 1;
}

export async function syncPoolLicenseQuantityFromStripe(
  orgId: string,
  subscription: Stripe.Subscription,
): Promise<number> {
  const poolItem = findPoolAddonItem(subscription);
  const quantity = poolItem?.quantity ?? 0;
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ pool_license_quantity: quantity })
    .eq("org_id", orgId);

  if (
    error?.code === "PGRST204" &&
    (error.message ?? "").toLowerCase().includes("pool_license_quantity")
  ) {
    return quantity;
  }

  return quantity;
}
