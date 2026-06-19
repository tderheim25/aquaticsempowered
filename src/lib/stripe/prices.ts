import type { PlanCode } from "@/types/database";

export type BillingCadence = "monthly" | "annual";
export type CheckoutFlow = "founder" | "self_serve";

const PLAN_CODES: PlanCode[] = ["free", "essential", "pro", "enterprise"];

function envPrice(key: string): string | null {
  const value = process.env[key]?.trim();
  return value || null;
}

const PLAN_PRICE_MAP: Partial<Record<PlanCode, Partial<Record<BillingCadence, string>>>> = {
  essential: {
    monthly: envPrice("STRIPE_PRICE_ESSENTIAL_MONTHLY") ?? undefined,
    annual: envPrice("STRIPE_PRICE_ESSENTIAL_ANNUAL") ?? undefined,
  },
  pro: {
    monthly: envPrice("STRIPE_PRICE_PRO_MONTHLY") ?? undefined,
    annual: envPrice("STRIPE_PRICE_PRO_ANNUAL") ?? undefined,
  },
};

/** Maps plan + cadence to Stripe Price ID from environment variables. */
export function getStripePriceId(
  planCode: PlanCode,
  cadence: BillingCadence,
  _flow: CheckoutFlow,
): string | null {
  return PLAN_PRICE_MAP[planCode]?.[cadence] ?? null;
}

/** Stripe Price ID for additional pool add-on ($29/mo). */
export function getStripePoolAddonPriceId(): string | null {
  return envPrice("STRIPE_PRICE_POOL_ADDON_MONTHLY");
}

export function isPoolAddonPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  const poolPrice = getStripePoolAddonPriceId();
  return Boolean(poolPrice && priceId === poolPrice);
}

/** Reverse lookup for webhook sync when metadata is missing. */
export function planCodeFromStripePriceId(priceId: string | null | undefined): PlanCode | null {
  if (!priceId || isPoolAddonPriceId(priceId)) return null;

  const entries: Array<[string | null, PlanCode, BillingCadence]> = [
    [envPrice("STRIPE_PRICE_ESSENTIAL_MONTHLY"), "essential", "monthly"],
    [envPrice("STRIPE_PRICE_ESSENTIAL_ANNUAL"), "essential", "annual"],
    [envPrice("STRIPE_PRICE_PRO_MONTHLY"), "pro", "monthly"],
    [envPrice("STRIPE_PRICE_PRO_ANNUAL"), "pro", "annual"],
    [envPrice("STRIPE_PRICE_FOUNDER_ANNUAL"), "pro", "annual"],
  ];

  for (const [id, plan] of entries) {
    if (id && id === priceId) return plan;
  }
  return null;
}

export function isFounderPriceId(priceId: string | null | undefined): boolean {
  const founderPrice = envPrice("STRIPE_PRICE_FOUNDER_ANNUAL");
  return Boolean(founderPrice && priceId === founderPrice);
}

/** Stripe Coupon id for the active site-wide promo (e.g. 50% off list price). */
export function getStripePromoCouponId(): string | null {
  return envPrice("STRIPE_PROMO_COUPON_ID");
}

export function parsePlanCode(value: string | null | undefined): PlanCode | null {
  if (!value) return null;
  return PLAN_CODES.includes(value as PlanCode) ? (value as PlanCode) : null;
}

/** Pricing page tier id → database plan_code */
export function tierIdToPlanCode(tierId: string): PlanCode | null {
  switch (tierId) {
    case "essential":
      return "essential";
    case "professional":
      return "pro";
    default:
      return null;
  }
}

/** Subscription item that bills the base plan (not pool add-on). */
export function isBasePlanSubscriptionItem(item: {
  price?: { id?: string | null } | null;
  metadata?: Record<string, string> | null;
}): boolean {
  if (item.metadata?.type === "pool_addon") return false;
  return !isPoolAddonPriceId(item.price?.id);
}
