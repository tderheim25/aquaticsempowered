/**
 * Public list prices (USD) — source of truth from product (Troy).
 * Stripe Price IDs in env must match amounts configured in the Stripe Dashboard.
 */

export const ANNUAL_BILLING_DISCOUNT = 0.17;

export const TIER_MONTHLY_USD = {
  community: 0,
  essential: 399,
  professional: 699,
} as const;

/** Total annual prepay in whole dollars (~17% vs monthly × 12). */
export function annualTotalUsd(monthlyUsd: number): number {
  return Math.round(monthlyUsd * 12 * (1 - ANNUAL_BILLING_DISCOUNT));
}

/** Per-month rate when billed annually (annual total ÷ 12). */
export function annualPerMonthUsd(monthlyUsd: number): number {
  return Math.round(annualTotalUsd(monthlyUsd) / 12);
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export const ESSENTIAL_MONTHLY_USD = TIER_MONTHLY_USD.essential;
export const PRO_MONTHLY_USD = TIER_MONTHLY_USD.professional;
export const ESSENTIAL_ANNUAL_PER_MONTH_USD = annualPerMonthUsd(ESSENTIAL_MONTHLY_USD);
export const PRO_ANNUAL_PER_MONTH_USD = annualPerMonthUsd(PRO_MONTHLY_USD);
export const ESSENTIAL_ANNUAL_TOTAL_USD = annualTotalUsd(ESSENTIAL_MONTHLY_USD);
export const PRO_ANNUAL_TOTAL_USD = annualTotalUsd(PRO_MONTHLY_USD);
