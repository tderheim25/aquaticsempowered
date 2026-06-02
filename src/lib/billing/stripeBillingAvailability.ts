import "server-only";

import { getStripePriceId, type BillingCadence } from "@/lib/stripe/prices";
import { isStripeConfigured } from "@/lib/stripe/server";
export type SelfServeBillingAvailability = {
  stripeConfigured: boolean;
  essential: Record<BillingCadence, boolean>;
  pro: Record<BillingCadence, boolean>;
};

export function getSelfServeBillingAvailability(): SelfServeBillingAvailability {
  const cadences: BillingCadence[] = ["monthly", "annual"];

  const essential = { monthly: false, annual: false };
  const pro = { monthly: false, annual: false };

  if (isStripeConfigured()) {
    for (const cadence of cadences) {
      essential[cadence] = Boolean(getStripePriceId("essential", cadence, "self_serve"));
      pro[cadence] = Boolean(getStripePriceId("pro", cadence, "self_serve"));
    }
  }

  return { stripeConfigured: isStripeConfigured(), essential, pro };
}
