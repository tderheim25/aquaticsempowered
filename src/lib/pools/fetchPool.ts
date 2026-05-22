import type { UsersRow } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PoolRow = Database["public"]["Tables"]["pools"]["Row"];
type EquipmentRow = Database["public"]["Tables"]["pool_equipment"]["Row"];

export type PoolListRow = Pick<
  PoolRow,
  "id" | "name" | "pool_type" | "status" | "volume_gallons" | "location_label"
>;

export function canViewPoolOrg(profile: UsersRow, poolOrgId: string): boolean {
  if (profile.role === "super_admin") return true;
  return Boolean(profile.org_id && profile.org_id === poolOrgId);
}

/** Lists pools for one organization; admin fallback when session RLS hides rows. */
export async function fetchPoolsForOrg(orgId: string, profile: UsersRow): Promise<PoolListRow[]> {
  if (profile.role !== "super_admin" && profile.org_id !== orgId) {
    return [];
  }

  const columns = "id, name, pool_type, status, volume_gallons, location_label";
  const supabase = await createClient();
  const { data: pools } = await supabase.from("pools").select(columns).eq("org_id", orgId).order("name");
  if (pools?.length) return pools as PoolListRow[];

  if (!canViewPoolOrg(profile, orgId)) return [];

  const admin = createAdminClient();
  const { data: adminPools } = await admin.from("pools").select(columns).eq("org_id", orgId).order("name");
  return (adminPools ?? []) as PoolListRow[];
}

export async function fetchLastReadingByPool(
  orgId: string,
  poolIds: string[],
  profile: UsersRow
): Promise<Map<string, string>> {
  const lastByPool = new Map<string, string>();
  if (poolIds.length === 0 || (profile.role !== "super_admin" && profile.org_id !== orgId)) {
    return lastByPool;
  }

  const supabase = await createClient();
  const { data: userLogs } = await supabase
    .from("chemical_logs")
    .select("pool_id, logged_at")
    .eq("org_id", orgId)
    .in("pool_id", poolIds)
    .order("logged_at", { ascending: false });

  let logs = userLogs ?? [];
  if (logs.length === 0 && canViewPoolOrg(profile, orgId)) {
    const admin = createAdminClient();
    const { data: adminLogs } = await admin
      .from("chemical_logs")
      .select("pool_id, logged_at")
      .eq("org_id", orgId)
      .in("pool_id", poolIds)
      .order("logged_at", { ascending: false });
    logs = adminLogs ?? [];
  }

  for (const log of logs) {
    if (log.pool_id && !lastByPool.has(log.pool_id)) {
      lastByPool.set(log.pool_id, log.logged_at);
    }
  }
  return lastByPool;
}

/** Loads a pool for the signed-in user, with admin fallback when RLS/session org claims lag. */
export async function fetchPoolByIdForProfile(
  poolId: string,
  profile: UsersRow
): Promise<PoolRow | null> {
  const supabase = await createClient();
  const { data: pool } = await supabase.from("pools").select("*").eq("id", poolId).maybeSingle();
  if (pool) return pool;

  const admin = createAdminClient();
  const { data: adminPool } = await admin.from("pools").select("*").eq("id", poolId).maybeSingle();
  if (!adminPool || !canViewPoolOrg(profile, adminPool.org_id)) return null;
  return adminPool;
}

export async function fetchPoolEquipmentForProfile(
  poolId: string,
  profile: UsersRow,
  poolOrgId: string
): Promise<EquipmentRow[]> {
  const supabase = await createClient();
  const { data: equipment } = await supabase
    .from("pool_equipment")
    .select("*")
    .eq("pool_id", poolId)
    .order("kind");
  if (equipment?.length) return equipment;

  if (!canViewPoolOrg(profile, poolOrgId)) return [];

  const admin = createAdminClient();
  const { data: adminEquipment } = await admin
    .from("pool_equipment")
    .select("*")
    .eq("pool_id", poolId)
    .order("kind");
  return adminEquipment ?? [];
}
