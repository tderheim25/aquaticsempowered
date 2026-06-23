import "server-only";

import {
  getBillablePools,
  getPoolBillableStatus,
  getPoolMonthlyFeeForRow,
  getPoolMonthlyFees,
  getPoolAddonQuantity,
} from "@/lib/billing/poolBilling";
import { WATER_BODY_TYPE_LABELS } from "@/lib/validations/pools";
import type { PlanCode, PoolStatus, PoolType, WaterBodyType } from "@/types/database";

export type PoolCatalogRow = {
  id: string;
  orgId: string;
  facilityName: string;
  planCode: PlanCode;
  founder: boolean;
  name: string;
  waterBodyType: WaterBodyType | null;
  waterBodyLabel: string;
  sanitizerType: PoolType;
  location: string | null;
  volumeGallons: number | null;
  status: PoolStatus;
  createdAt: string;
  billableStatus: "included" | "billable" | "not_billed";
  monthlyPoolFeeUsd: number;
};

export type PoolCatalogOrgSummary = {
  orgId: string;
  facilityName: string;
  activePoolCount: number;
  addonQuantity: number;
  monthlyPoolFeesUsd: number;
};

type PoolRecord = {
  id: string;
  org_id: string;
  name: string;
  water_body_type: WaterBodyType | null;
  pool_type: PoolType;
  volume_gallons: number | null;
  location_label: string | null;
  status: PoolStatus;
  created_at: string;
};

type OrgRecord = {
  id: string;
  name: string;
  plan_code: PlanCode;
  founder: boolean;
};

export function buildPoolCatalogRows(
  pools: PoolRecord[],
  orgs: OrgRecord[],
): { rows: PoolCatalogRow[]; summaries: PoolCatalogOrgSummary[] } {
  const orgById = new Map(orgs.map((o) => [o.id, o]));
  const poolsByOrg = new Map<string, PoolRecord[]>();

  for (const pool of pools) {
    const list = poolsByOrg.get(pool.org_id) ?? [];
    list.push(pool);
    poolsByOrg.set(pool.org_id, list);
  }

  const rankByPoolId = new Map<string, number>();
  for (const [, orgPools] of poolsByOrg) {
    const billable = getBillablePools(orgPools);
    billable.forEach((p, index) => rankByPoolId.set(p.id, index));
  }

  const rows: PoolCatalogRow[] = pools.map((pool) => {
    const org = orgById.get(pool.org_id);
    const rank = rankByPoolId.get(pool.id) ?? null;
    const billableStatus = getPoolBillableStatus(pool.status, rank);
    const waterBodyType = pool.water_body_type ?? "swimming_pool";
    return {
      id: pool.id,
      orgId: pool.org_id,
      facilityName: org?.name ?? "Unknown",
      planCode: org?.plan_code ?? "free",
      founder: org?.founder ?? false,
      name: pool.name,
      waterBodyType,
      waterBodyLabel: WATER_BODY_TYPE_LABELS[waterBodyType],
      sanitizerType: pool.pool_type,
      location: pool.location_label,
      volumeGallons: pool.volume_gallons,
      status: pool.status,
      createdAt: pool.created_at,
      billableStatus,
      monthlyPoolFeeUsd: getPoolMonthlyFeeForRow(pool.status, rank),
    };
  });

  const summaries: PoolCatalogOrgSummary[] = orgs.map((org) => {
    const orgPools = poolsByOrg.get(org.id) ?? [];
    const activeCount = orgPools.filter((p) => p.status === "active").length;
    return {
      orgId: org.id,
      facilityName: org.name,
      activePoolCount: activeCount,
      addonQuantity: getPoolAddonQuantity(activeCount),
      monthlyPoolFeesUsd: getPoolMonthlyFees(activeCount),
    };
  });

  return { rows, summaries };
}
