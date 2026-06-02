/**
 * Stripe catalog definition — keep in sync with src/lib/marketing/publicPricing.ts
 * and supabase/migrations/0036_troy_public_pricing.sql (amounts in cents).
 */

/** @typedef {{ envKey: string; cadence: 'monthly' | 'annual'; unitAmountCents: number }} CatalogPrice */

/** @typedef {{ slug: string; name: string; description: string; prices: CatalogPrice[] }} CatalogProduct */

/** @type {CatalogProduct[]} */
export const CATALOG_PRODUCTS = [
  {
    slug: "essential",
    name: "Aquatics Empowered — Essential",
    description: "Single-facility operations — chemical logs, SOPs, compliance reports.",
    prices: [
      { envKey: "STRIPE_PRICE_ESSENTIAL_MONTHLY", cadence: "monthly", unitAmountCents: 39900 },
      { envKey: "STRIPE_PRICE_ESSENTIAL_ANNUAL", cadence: "annual", unitAmountCents: 397600 },
    ],
  },
  {
    slug: "pro",
    name: "Aquatics Empowered — Professional",
    description: "Multi-facility operations — audits, procurement, priority support.",
    prices: [
      { envKey: "STRIPE_PRICE_PRO_MONTHLY", cadence: "monthly", unitAmountCents: 69900 },
      { envKey: "STRIPE_PRICE_PRO_ANNUAL", cadence: "annual", unitAmountCents: 697200 },
    ],
  },
];

/**
 * Legacy founder product — same annual amount as Professional annual (list price).
 * Checkout prefers STRIPE_PRICE_PRO_ANNUAL when set; this key remains for older envs.
 */
export const FOUNDER_ANNUAL_ALIAS = {
  slug: "founder_annual",
  name: "Aquatics Empowered — Founder Annual",
  description: "Founder program annual billing (Professional list price).",
  envKey: "STRIPE_PRICE_FOUNDER_ANNUAL",
  unitAmountCents: 697200,
};

/** 50% off — matches src/lib/marketing/promo.ts */
export const PROMO_COUPON = {
  id: "ae_founder_launch_50",
  name: "Founder Launch — 50% off",
  percentOff: 50,
  duration: "forever",
  envKey: "STRIPE_PROMO_COUPON_ID",
};
