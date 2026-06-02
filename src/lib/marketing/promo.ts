/**
 * Single source of truth for the active pricing promotion.
 *
 * Surfaced on the public pricing page and mirrored on the Founder Program
 * application so both stay in sync. Hard-coded for now — flip `active` to
 * false to hide the promotion everywhere.
 */
export type Promo = {
  active: boolean;
  /** Percentage discount applied to eligible plans (e.g. 50 = 50% off). */
  percentOff: number;
  /** Short badge text shown on cards. */
  badge: string;
  /** Banner headline shown on the pricing hero / founder application. */
  headline: string;
  /** Supporting copy under the headline. */
  description: string;
  /** Pricing-page tier ids the discount applies to. */
  tierIds: string[];
  /** Founder-application plan codes the discount applies to. */
  planCodes: string[];
};

export const PROMO: Promo = {
  active: true,
  percentOff: 50,
  badge: "50% OFF",
  headline: "Founder Launch — 50% off",
  description:
    "For a limited time, founders lock in 50% off Essential & Professional plans for life.",
  tierIds: ["essential", "professional"],
  planCodes: ["essential", "pro"],
};

/** Apply the active promo discount to a whole-dollar amount, rounded. */
export function applyPromoDiscount(amount: number): number {
  return Math.round(amount * (1 - PROMO.percentOff / 100));
}

/** Whether the promo is active and applies to the given pricing tier id. */
export function promoAppliesToTier(tierId: string): boolean {
  return PROMO.active && PROMO.tierIds.includes(tierId);
}

/** Whether the promo is active and applies to the given founder plan code. */
export function promoAppliesToPlan(planCode: string): boolean {
  return PROMO.active && PROMO.planCodes.includes(planCode);
}
