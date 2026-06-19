import {
  annualTotalUsd,
  ESSENTIAL_ANNUAL_PER_MONTH_USD,
  ESSENTIAL_MONTHLY_USD,
  formatUsd,
  founderBaseMonthlyUsd,
  POOL_ADDON_MONTHLY_USD,
  PRO_ANNUAL_PER_MONTH_USD,
  PRO_MONTHLY_USD,
} from "@/lib/marketing/publicPricing";
import { applyPromoDiscount } from "@/lib/marketing/sitePromo";
import type { BillingCadence } from "@/lib/stripe/prices";
import type { PlanCode } from "@/types/database";

export type SelfServePlanOption = {
  planCode: Extract<PlanCode, "essential" | "pro">;
  name: string;
  tagline: string;
  monthlyDisplay: number;
  annualDisplay: number;
  highlights: string[];
};

/** Display order for upgrade/downgrade comparison (low → high). */
export const PLAN_RANK: Record<PlanCode, number> = {
  free: 0,
  essential: 1,
  pro: 2,
  enterprise: 3,
};

export const SELF_SERVE_PLANS: SelfServePlanOption[] = [
  {
    planCode: "essential",
    name: "Essential",
    tagline: "Run your facility operations",
    monthlyDisplay: ESSENTIAL_MONTHLY_USD,
    annualDisplay: ESSENTIAL_ANNUAL_PER_MONTH_USD,
    highlights: [
      "1 pool included",
      `Additional pools: $${POOL_ADDON_MONTHLY_USD}/mo each`,
      "Chemical logs & alerts",
      "SOP library & checklists",
      "Member support portal",
      "Compliance-ready reports",
    ],
  },
  {
    planCode: "pro",
    name: "Professional",
    tagline: "Advanced ops for growing aquatics teams",
    monthlyDisplay: PRO_MONTHLY_USD,
    annualDisplay: PRO_ANNUAL_PER_MONTH_USD,
    highlights: [
      "1 pool included",
      `Additional pools: $${POOL_ADDON_MONTHLY_USD}/mo each`,
      "Everything in Essential",
      "Audits & procurement tools",
      "Advanced reporting & insights",
      "Priority operator support",
    ],
  },
];

export function comparePlans(a: PlanCode, b: PlanCode): number {
  return (PLAN_RANK[a] ?? 0) - (PLAN_RANK[b] ?? 0);
}

export function planChangeLabel(
  current: PlanCode,
  target: PlanCode,
): "current" | "upgrade" | "downgrade" | "switch" {
  if (current === target) return "current";
  const diff = comparePlans(target, current);
  if (diff > 0) return "upgrade";
  if (diff < 0) return "downgrade";
  return "switch";
}

export function formatSubscriptionDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function validUntilLabel(status: string, periodEnd: string | null): string | null {
  const formatted = formatSubscriptionDate(periodEnd);
  if (!formatted) return null;
  const normalized = status === "founder_pending" ? "incomplete" : status;
  if (normalized === "canceled") return `Access until ${formatted}`;
  if (normalized === "active" || normalized === "trialing") {
    return normalized === "trialing" ? `Trial ends ${formatted}` : `Valid until ${formatted}`;
  }
  return `Period ends ${formatted}`;
}

export function priceLabel(plan: SelfServePlanOption, cadence: BillingCadence): string {
  const amount = cadence === "annual" ? plan.annualDisplay : plan.monthlyDisplay;
  const suffix = cadence === "annual" ? "/mo · billed annually" : "/mo";
  return `$${amount}${suffix}`;
}

export function founderPriceLabel(plan: SelfServePlanOption, cadence: BillingCadence): string {
  if (cadence === "annual") {
    const perMonth = Math.round(applyPromoDiscount(annualTotalUsd(plan.monthlyDisplay)) / 12);
    return `$${formatUsd(perMonth)}/mo · billed annually`;
  }
  return `$${formatUsd(founderBaseMonthlyUsd(plan.monthlyDisplay))}/mo`;
}

const PLAN_DISPLAY_NAMES: Record<PlanCode, string> = {
  free: "Free",
  essential: "Essential",
  pro: "Professional",
  enterprise: "Enterprise",
};

export function getPlanDisplayName(planCode: PlanCode | string | null | undefined): string | null {
  if (!planCode) return null;
  return PLAN_DISPLAY_NAMES[planCode as PlanCode] ?? null;
}
