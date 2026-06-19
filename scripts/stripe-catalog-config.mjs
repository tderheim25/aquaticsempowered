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
  {
    slug: "pool_addon",
    name: "Aquatics Empowered — Additional Pool",
    description: "Monthly charge per additional active body of water (first pool included in plan).",
    prices: [
      { envKey: "STRIPE_PRICE_POOL_ADDON_MONTHLY", cadence: "monthly", unitAmountCents: 2900 },
    ],
  },
];

/**
 * @deprecated Founder program now bills Professional monthly. Kept for legacy envs / subscriptions.
 */
export const FOUNDER_ANNUAL_ALIAS = {
  slug: "founder_annual",
  name: "Aquatics Empowered — Founder Annual",
  description: "Deprecated — founder program uses STRIPE_PRICE_PRO_MONTHLY.",
  envKey: "STRIPE_PRICE_FOUNDER_ANNUAL",
  unitAmountCents: 697200,
};

/** 50% off for 3 years — matches src/lib/founders/founderProgram.ts */
export const PROMO_COUPON = {
  id: "ae_founder_launch_50_3y",
  name: "Founder Launch — 50% off for 3 years",
  percentOff: 50,
  duration: "repeating",
  durationInMonths: 36,
  envKey: "STRIPE_PROMO_COUPON_ID",
};
