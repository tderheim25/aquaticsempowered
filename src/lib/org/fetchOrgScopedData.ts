import { dayBounds } from "@/lib/dates/localDate";
import { canViewPoolOrg } from "@/lib/pools/fetchPool";
import type { UsersRow } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PoolChemicalOption = Pick<
  Database["public"]["Tables"]["pools"]["Row"],
  "id" | "name" | "target_ranges"
>;

export type PoolCalculatorOption = Pick<
  Database["public"]["Tables"]["pools"]["Row"],
  "id" | "name" | "volume_gallons" | "target_ranges"
>;

export type ChemicalTrendPoint = {
  logged_at: string;
  ph: number | null;
  free_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  langelier_saturation_index: number | null;
};

export type LatestChemicalReading = {
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  calcium_hardness: number | null;
  cyanuric_acid_ppm: number | null;
  langelier_saturation_index: number | null;
};

export type ChemicalLogExportRow = {
  logged_at: string;
  pool_id: string | null;
  pool_label: string | null;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  calcium_hardness: number | null;
  tds_ppm: number | null;
  langelier_saturation_index: number | null;
  pools: { name: string } | { name: string }[] | null;
};

const CHEMICAL_LOG_SELECT =
  "id, pool_id, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, calcium_hardness, tds_ppm, cyanuric_acid_ppm, filter_psi, flow_gpm, notes, operator_initials, langelier_saturation_index, logged_by, logged_at, pools(name)";

export type ChemicalLogListRow = {
  id: string;
  pool_id: string | null;
  pool_label: string | null;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  calcium_hardness: number | null;
  tds_ppm: number | null;
  cyanuric_acid_ppm: number | null;
  filter_psi: number | null;
  flow_gpm: number | null;
  notes: string | null;
  operator_initials: string | null;
  langelier_saturation_index: number | null;
  logged_by: string | null;
  logged_at: string;
  pools: { name: string } | { name: string }[] | null;
};

async function assertOrgAccess(profile: UsersRow, orgId: string) {
  if (profile.role === "super_admin") return true;
  return await canViewPoolOrg(profile, orgId);
}

/** Pools for chemical log forms and filters (RLS-safe read). */
export async function fetchPoolOptionsForOrg(
  orgId: string,
  profile: UsersRow
): Promise<PoolChemicalOption[]> {
  if (!(await assertOrgAccess(profile, orgId))) return [];

  const supabase = await createClient();
  const { data: pools } = await supabase
    .from("pools")
    .select("id, name, target_ranges")
    .eq("org_id", orgId)
    .order("name");

  if (pools?.length) return pools as PoolChemicalOption[];

  const admin = createAdminClient();
  const { data: adminPools } = await admin
    .from("pools")
    .select("id, name, target_ranges")
    .eq("org_id", orgId)
    .order("name");

  return (adminPools ?? []) as PoolChemicalOption[];
}

/** Pools for the chemistry calculator (RLS-safe read). */
export async function fetchPoolCalculatorOptionsForOrg(
  orgId: string,
  profile: UsersRow
): Promise<PoolCalculatorOption[]> {
  if (!(await assertOrgAccess(profile, orgId))) return [];

  const columns = "id, name, volume_gallons, target_ranges";
  const supabase = await createClient();
  const { data: pools } = await supabase.from("pools").select(columns).eq("org_id", orgId).order("name");
  if (pools?.length) return pools as PoolCalculatorOption[];

  const admin = createAdminClient();
  const { data: adminPools } = await admin.from("pools").select(columns).eq("org_id", orgId).order("name");
  return (adminPools ?? []) as PoolCalculatorOption[];
}

/** Chemical log history for an org (RLS-safe read). */
export async function fetchChemicalLogsForOrg(
  orgId: string,
  profile: UsersRow,
  options?: { poolId?: string; date?: string; limit?: number }
): Promise<{ logs: ChemicalLogListRow[]; error: string | null }> {
  if (!(await assertOrgAccess(profile, orgId))) {
    return { logs: [], error: null };
  }

  const limit = options?.limit ?? 200;
  const poolId = options?.poolId?.trim();
  const date = options?.date?.trim();
  const bounds = date ? dayBounds(date) : null;

  const supabase = await createClient();
  let userQuery = supabase.from("chemical_logs").select(CHEMICAL_LOG_SELECT).eq("org_id", orgId);
  if (poolId) userQuery = userQuery.eq("pool_id", poolId);
  if (bounds) {
    userQuery = userQuery.gte("logged_at", bounds.start).lte("logged_at", bounds.end);
  }
  const { data: userLogs, error: userError } = await userQuery.order("logged_at", { ascending: false }).limit(limit);

  if (!userError && userLogs) {
    return { logs: userLogs as ChemicalLogListRow[], error: null };
  }

  const admin = createAdminClient();
  let adminQuery = admin.from("chemical_logs").select(CHEMICAL_LOG_SELECT).eq("org_id", orgId);
  if (poolId) adminQuery = adminQuery.eq("pool_id", poolId);
  if (bounds) {
    adminQuery = adminQuery.gte("logged_at", bounds.start).lte("logged_at", bounds.end);
  }
  const { data: adminLogs, error: adminError } = await adminQuery.order("logged_at", { ascending: false }).limit(limit);

  if (adminError) {
    return { logs: [], error: adminError.message };
  }

  return { logs: (adminLogs ?? []) as ChemicalLogListRow[], error: null };
}

/** Trend chart points for an org (RLS-safe read). */
export async function fetchChemicalTrendLogsForOrg(
  orgId: string,
  profile: UsersRow,
  options: { poolId?: string; since: string; limit?: number }
): Promise<{ points: ChemicalTrendPoint[]; error: string | null }> {
  if (!(await assertOrgAccess(profile, orgId))) {
    return { points: [], error: null };
  }

  const select =
    "logged_at, ph, free_chlorine, alkalinity, temp_f, langelier_saturation_index";
  const limit = options.limit ?? 500;
  const poolId = options.poolId?.trim();

  const supabase = await createClient();
  let userQuery = supabase
    .from("chemical_logs")
    .select(select)
    .eq("org_id", orgId)
    .gte("logged_at", options.since);
  if (poolId) userQuery = userQuery.eq("pool_id", poolId);
  const { data: userLogs, error: userError } = await userQuery.order("logged_at", { ascending: true }).limit(limit);

  if (!userError && userLogs) {
    return { points: userLogs as ChemicalTrendPoint[], error: null };
  }

  const admin = createAdminClient();
  let adminQuery = admin
    .from("chemical_logs")
    .select(select)
    .eq("org_id", orgId)
    .gte("logged_at", options.since);
  if (poolId) adminQuery = adminQuery.eq("pool_id", poolId);
  const { data: adminLogs, error: adminError } = await adminQuery.order("logged_at", { ascending: true }).limit(limit);

  if (adminError) {
    return { points: [], error: adminError.message };
  }

  return { points: (adminLogs ?? []) as ChemicalTrendPoint[], error: null };
}

/** Latest reading for one pool (RLS-safe read). */
export async function fetchLatestChemicalReadingForPool(
  orgId: string,
  poolId: string,
  profile: UsersRow
): Promise<LatestChemicalReading | null> {
  if (!(await assertOrgAccess(profile, orgId))) return null;

  const select =
    "ph, free_chlorine, total_chlorine, alkalinity, calcium_hardness, cyanuric_acid_ppm, langelier_saturation_index";
  const supabase = await createClient();
  const { data: userRow, error: userError } = await supabase
    .from("chemical_logs")
    .select(select)
    .eq("org_id", orgId)
    .eq("pool_id", poolId)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!userError && userRow) return userRow as LatestChemicalReading;

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("chemical_logs")
    .select(select)
    .eq("org_id", orgId)
    .eq("pool_id", poolId)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (adminRow as LatestChemicalReading | null) ?? null;
}

/** Rows for CSV export (RLS-safe read). */
export async function fetchChemicalLogsForExport(
  orgId: string,
  profile: UsersRow,
  filters: { poolId?: string; poolLabel?: string; from?: string; to?: string; limit?: number }
): Promise<{ rows: ChemicalLogExportRow[]; error: string | null }> {
  if (!(await assertOrgAccess(profile, orgId))) {
    return { rows: [], error: null };
  }

  const select =
    "logged_at, pool_id, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, calcium_hardness, tds_ppm, langelier_saturation_index, pools(name)";
  const limit = filters.limit ?? 5000;
  const poolId = filters.poolId?.trim();
  const poolLabel = filters.poolLabel?.trim();

  const supabase = await createClient();
  let userQuery = supabase.from("chemical_logs").select(select).eq("org_id", orgId);
  if (poolId) userQuery = userQuery.eq("pool_id", poolId);
  else if (poolLabel) userQuery = userQuery.eq("pool_label", poolLabel);
  if (filters.from) userQuery = userQuery.gte("logged_at", `${filters.from}T00:00:00`);
  if (filters.to) userQuery = userQuery.lte("logged_at", `${filters.to}T23:59:59.999`);
  const { data: userRows, error: userError } = await userQuery.order("logged_at", { ascending: false }).limit(limit);

  if (!userError && userRows) {
    return { rows: userRows as ChemicalLogExportRow[], error: null };
  }

  const admin = createAdminClient();
  let adminQuery = admin.from("chemical_logs").select(select).eq("org_id", orgId);
  if (poolId) adminQuery = adminQuery.eq("pool_id", poolId);
  else if (poolLabel) adminQuery = adminQuery.eq("pool_label", poolLabel);
  if (filters.from) adminQuery = adminQuery.gte("logged_at", `${filters.from}T00:00:00`);
  if (filters.to) adminQuery = adminQuery.lte("logged_at", `${filters.to}T23:59:59.999`);
  const { data: adminRows, error: adminError } = await adminQuery.order("logged_at", { ascending: false }).limit(limit);

  if (adminError) {
    return { rows: [], error: adminError.message };
  }

  return { rows: (adminRows ?? []) as ChemicalLogExportRow[], error: null };
}

/** Resolve pool id + label for writes when RLS blocks a direct pools lookup. */
export async function fetchPoolFieldsForOrg(
  orgId: string,
  poolId: string | null,
  profile: UsersRow
): Promise<{ pool_id: string | null; pool_label: string | null }> {
  const id = poolId?.trim() || null;
  if (!id) return { pool_id: null, pool_label: null };

  const options = await fetchPoolOptionsForOrg(orgId, profile);
  const pool = options.find((p) => p.id === id);
  if (!pool) return { pool_id: null, pool_label: null };
  return { pool_id: pool.id, pool_label: pool.name };
}
