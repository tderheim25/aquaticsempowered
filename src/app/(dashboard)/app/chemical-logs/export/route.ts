import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | null | undefined) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("org_id, role").eq("id", user.id).maybeSingle();
  const requestedOrgId = (url.searchParams.get("org") ?? "").trim();
  let targetOrgId = profile?.org_id ?? null;
  if (!targetOrgId && profile?.role === "super_admin" && requestedOrgId) {
    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("id").eq("id", requestedOrgId).maybeSingle();
    targetOrgId = org?.id ?? null;
  }

  if (!targetOrgId) {
    return new NextResponse("No organization linked", { status: 400 });
  }
  const pool = (url.searchParams.get("pool") ?? "").trim();
  const from = (url.searchParams.get("from") ?? "").trim();
  const to = (url.searchParams.get("to") ?? "").trim();

  let query = supabase
    .from("chemical_logs")
    .select(
      "logged_at, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, calcium_hardness, tds_ppm, langelier_saturation_index"
    )
    .eq("org_id", targetOrgId);

  if (pool) query = query.eq("pool_label", pool);
  if (from) query = query.gte("logged_at", `${from}T00:00:00`);
  if (to) query = query.lte("logged_at", `${to}T23:59:59.999`);

  const { data, error } = await query.order("logged_at", { ascending: false }).limit(5000);
  if (error) {
    return new NextResponse("Could not export logs", { status: 500 });
  }

  const header = [
    "logged_at",
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
  const rows = (data ?? []).map((row) =>
    [
      row.logged_at,
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
  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chemical-logs.csv"`,
    },
  });
}
