import {
  ESSENTIAL_MONTHLY_USD,
  founderBaseMonthlyUsd,
  POOL_ADDON_MONTHLY_USD,
  PRO_MONTHLY_USD,
} from "@/lib/marketing/publicPricing";
import type { PlanCode, PoolStatus } from "@/types/database";

export type PoolBillingRow = {
  id: string;
  status: PoolStatus;
  created_at: string;
};

export type PoolBillableStatus = "included" | "billable" | "not_billed";

export function getBillablePools<T extends PoolBillingRow>(pools: T[]): T[] {
  return [...pools]
    .filter((p) => p.status === "active")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getPoolAddonQuantity(activeCount: number): number {
  return Math.max(0, activeCount - 1);
}

export function getPoolMonthlyFees(activeCount: number): number {
  return getPoolAddonQuantity(activeCount) * POOL_ADDON_MONTHLY_USD;
}

export function getPoolBillableStatus(
  status: PoolStatus,
  rankAmongActive: number | null,
): PoolBillableStatus {
  if (status !== "active") return "not_billed";
  if (rankAmongActive === 0) return "included";
  return "billable";
}

export function getPoolMonthlyFeeForRow(
  status: PoolStatus,
  rankAmongActive: number | null,
): number {
  return getPoolBillableStatus(status, rankAmongActive) === "billable" ? POOL_ADDON_MONTHLY_USD : 0;
}

export function getBasePlanMonthlyUsd(
  planCode: PlanCode,
  founder: boolean,
): number {
  switch (planCode) {
    case "essential":
      return founder ? founderBaseMonthlyUsd(ESSENTIAL_MONTHLY_USD) : ESSENTIAL_MONTHLY_USD;
    case "pro":
      return founder ? founderBaseMonthlyUsd(PRO_MONTHLY_USD) : PRO_MONTHLY_USD;
    default:
      return 0;
  }
}

export function getMonthlyTotal(params: {
  planCode: PlanCode;
  founder: boolean;
  activePoolCount: number;
}): { baseUsd: number; poolFeesUsd: number; totalUsd: number; addonQuantity: number } {
  const baseUsd = getBasePlanMonthlyUsd(params.planCode, params.founder);
  const addonQuantity = getPoolAddonQuantity(params.activePoolCount);
  const poolFeesUsd = getPoolMonthlyFees(params.activePoolCount);
  return {
    baseUsd,
    poolFeesUsd,
    totalUsd: baseUsd + poolFeesUsd,
    addonQuantity,
  };
}

export const POOL_BILLING_NOTE =
  "All paid plans include one body of water at no additional charge. Additional pools and water features are billed at $29/month each.";

export const ADDITIONAL_POOL_BILLING_MESSAGE =
  "Additional active pools are billed at $29/month each. Your first active pool is included with your subscription.";
