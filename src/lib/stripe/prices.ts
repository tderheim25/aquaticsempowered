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
  flow: CheckoutFlow,
): string | null {
  if (flow === "founder") {
    const annualForPlan = PLAN_PRICE_MAP[planCode]?.annual;
    if (annualForPlan) return annualForPlan;
    if (planCode === "pro") return envPrice("STRIPE_PRICE_FOUNDER_ANNUAL");
    return null;
  }

  return PLAN_PRICE_MAP[planCode]?.[cadence] ?? null;
}

/** Reverse lookup for webhook sync when metadata is missing. */
export function planCodeFromStripePriceId(priceId: string | null | undefined): PlanCode | null {
  if (!priceId) return null;

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
