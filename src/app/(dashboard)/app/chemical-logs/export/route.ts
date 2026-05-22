import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { fetchChemicalLogsForExport } from "@/lib/org/fetchOrgScopedData";
import { resolveTargetOrgId } from "@/lib/pools/resolveOrgId";
import { createClient } from "@/lib/supabase/server";

function poolNameFromJoin(pools: unknown): string {
  if (!pools) return "";
  if (Array.isArray(pools)) return (pools[0] as { name?: string } | undefined)?.name ?? "";
  return (pools as { name?: string }).name ?? "";
}

function csvEscape(value: string | number | null | undefined) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!profile) {
    return new NextResponse("Profile not found", { status: 403 });
  }

  const url = new URL(request.url);
  const targetOrgId = await resolveTargetOrgId(profile, url.searchParams.get("org"));

  if (!targetOrgId) {
    return new NextResponse("No organization linked", { status: 400 });
  }

  const poolId = (url.searchParams.get("pool_id") ?? "").trim();
  const poolLabel = (url.searchParams.get("pool") ?? "").trim();
  const from = (url.searchParams.get("from") ?? "").trim();
  const to = (url.searchParams.get("to") ?? "").trim();

  const { rows, error } = await fetchChemicalLogsForExport(targetOrgId, profile, {
    poolId: poolId || undefined,
    poolLabel: poolLabel || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  if (error) {
    return new NextResponse("Could not export logs", { status: 500 });
  }

  const header = [
    "logged_at",
    "pool_id",
    "pool_name",
    "pool_label",
    "ph",
    "free_chlorine",
    "total_chlorine",
    "alkalinity",
    "temp_f",
    "calcium_hardness",
    "tds_ppm",
    "langelier_saturation_index",
  ];
  const csvRows = rows.map((row) =>
    [
      row.logged_at,
      row.pool_id,
      poolNameFromJoin(row.pools),
      row.pool_label,
      row.ph,
      row.free_chlorine,
      row.total_chlorine,
      row.alkalinity,
      row.temp_f,
      row.calcium_hardness,
      row.tds_ppm,
      row.langelier_saturation_index,
    ]
      .map(csvEscape)
      .join(",")
  );
  const csv = [header.join(","), ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chemical-logs.csv"`,
    },
  });
}
