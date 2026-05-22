import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { ChemicalReportDocument, type ReportLogRow } from "@/components/chemistry/ChemicalReportDocument";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function poolNameFromJoin(pools: unknown, poolLabel: string | null): string {
  if (!pools) return poolLabel ?? "—";
  if (Array.isArray(pools)) return (pools[0] as { name?: string } | undefined)?.name ?? poolLabel ?? "—";
  return (pools as { name?: string }).name ?? poolLabel ?? "—";
}

function parseMonth(month: string): { start: string; end: string; label: string } | null {
  const m = month.trim();
  if (!/^\d{4}-\d{2}$/.test(m)) return null;
  const [y, mo] = m.split("-").map(Number);
  const start = new Date(Date.UTC(y, mo - 1, 1));
  const end = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999));
  const label = start.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("users").select("org_id, role").eq("id", user.id).maybeSingle();
  const requestedOrgId = (url.searchParams.get("org") ?? "").trim();
  let targetOrgId = profile?.org_id ?? null;
  if (!targetOrgId && profile?.role === "super_admin" && requestedOrgId) {
    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("id").eq("id", requestedOrgId).maybeSingle();
    targetOrgId = org?.id ?? null;
  }

  if (!targetOrgId) return new NextResponse("No organization linked", { status: 400 });

  const monthParam = url.searchParams.get("month") ?? "";
  const range = parseMonth(monthParam);
  if (!range) return new NextResponse("Invalid month (use YYYY-MM)", { status: 400 });

  const { data: orgRow } = await supabase.from("organizations").select("name").eq("id", targetOrgId).maybeSingle();
  const orgName = orgRow?.name ?? "Organization";

  const { data, error } = await supabase
    .from("chemical_logs")
    .select(
      "logged_at, pool_id, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, langelier_saturation_index, pools(name)"
    )
    .eq("org_id", targetOrgId)
    .gte("logged_at", range.start)
    .lte("logged_at", range.end)
    .order("logged_at", { ascending: true })
    .limit(5000);

  if (error) return new NextResponse("Could not load logs", { status: 500 });

  const rows: ReportLogRow[] = (data ?? []).map((row) => ({
    logged_at: row.logged_at,
    pool_name: poolNameFromJoin(row.pools, row.pool_label),
    ph: row.ph,
    free_chlorine: row.free_chlorine,
    total_chlorine: row.total_chlorine,
    alkalinity: row.alkalinity,
    temp_f: row.temp_f,
    langelier_saturation_index: row.langelier_saturation_index,
  }));

  const buffer = await renderToBuffer(
    <ChemicalReportDocument orgName={orgName} monthLabel={range.label} rows={rows} />
  );

  const filename = `chemistry-report-${monthParam}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
