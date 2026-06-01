import { hasFeature } from "@/lib/auth/plans";
import type { PlanCode } from "@/types/database";

/** When true (default), any org member with view access can use energy audits regardless of plan. */
export function isEnergyAuditBetaOpen() {
  return process.env.NEXT_PUBLIC_ENERGY_AUDIT_BETA !== "false";
}

export function canUseEnergyAudits(planCode: PlanCode | null | undefined) {
  if (isEnergyAuditBetaOpen()) return true;
  return hasFeature(planCode ?? "free", "energy_audits");
}
