import { ADDITIONAL_POOL_BILLING_MESSAGE } from "@/lib/billing/poolBilling";
import type { PlanCode } from "@/types/database";

/** Whether the org plan allows managing pool records. */
export function canManagePools(planCode: PlanCode | null | undefined): boolean {
  if (!planCode || planCode === "free") return false;
  return true;
}

/** @deprecated Use canManagePools — paid plans may add unlimited pools (billed per add-on). */
export function canAddPool(planCode: PlanCode | null | undefined, currentCount?: number): boolean {
  void currentCount;
  return canManagePools(planCode);
}

export function poolBillingMessage(): string {
  return ADDITIONAL_POOL_BILLING_MESSAGE;
}

/** @deprecated Use poolBillingMessage */
export function poolLimitMessage(planCode?: PlanCode): string {
  void planCode;
  return ADDITIONAL_POOL_BILLING_MESSAGE;
}
