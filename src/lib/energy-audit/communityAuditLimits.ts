import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT,
  type CommunityEnergyAuditUsage,
} from "@/lib/energy-audit/communityAuditLimits.shared";

export { COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT };
export type { CommunityEnergyAuditUsage };

function utcDayBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function countCommunityEnergyAuditsToday(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { start, end } = utcDayBounds();
  const { count, error } = await admin
    .from("energy_audits")
    .select("id", { count: "exact", head: true })
    .eq("is_community_beta", true)
    .eq("created_by", userId)
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) {
    console.error("[communityAuditLimits] count:", error.message);
    throw new Error("Could not verify daily audit limit.");
  }

  return count ?? 0;
}

export function buildCommunityEnergyAuditUsage(used: number, signedIn: boolean): CommunityEnergyAuditUsage {
  const limit = COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT;
  const remaining = signedIn ? Math.max(0, limit - used) : 0;
  const { end } = utcDayBounds();

  return {
    signedIn,
    limit,
    used: signedIn ? used : 0,
    remaining,
    atLimit: signedIn && used >= limit,
    resetsAt: end,
  };
}

export async function getCommunityEnergyAuditUsageForUser(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<CommunityEnergyAuditUsage> {
  const used = await countCommunityEnergyAuditsToday(admin, userId);
  return buildCommunityEnergyAuditUsage(used, true);
}

export function communityEnergyAuditLimitMessage(usage: CommunityEnergyAuditUsage): string {
  if (!usage.signedIn) {
    return "Sign in to run energy audits.";
  }
  if (usage.atLimit) {
    return `You have reached the daily limit of ${usage.limit} energy audits. Try again after midnight UTC.`;
  }
  return "";
}
