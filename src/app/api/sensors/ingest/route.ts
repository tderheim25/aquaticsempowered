import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type IngestBody = {
  org_id: string;
  pool_id?: string | null;
  device_id: string;
  metric: string;
  value: number;
  unit?: string | null;
  recorded_at?: string;
};

export async function POST(request: Request) {
  const secret = process.env.SENSOR_INGEST_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = String(body.org_id ?? "").trim();
  const deviceId = String(body.device_id ?? "").trim();
  const metric = String(body.metric ?? "").trim();
  const value = Number(body.value);

  if (!orgId || !deviceId || !metric || !Number.isFinite(value)) {
    return NextResponse.json({ error: "org_id, device_id, metric, and value are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("id", orgId).maybeSingle();
  if (!org) {
    return NextResponse.json({ error: "Unknown organization" }, { status: 404 });
  }

  const poolId = body.pool_id?.trim() || null;
  if (poolId) {
    const { data: pool } = await admin.from("pools").select("id").eq("id", poolId).eq("org_id", orgId).maybeSingle();
    if (!pool) {
      return NextResponse.json({ error: "Unknown pool for organization" }, { status: 400 });
    }
  }

  const row: Record<string, unknown> = {
    org_id: orgId,
    pool_id: poolId,
    device_id: deviceId,
    metric,
    value,
    unit: body.unit?.trim() || null,
  };
  if (body.recorded_at) {
    const recorded = new Date(body.recorded_at);
    if (!Number.isNaN(recorded.getTime())) row.recorded_at = recorded.toISOString();
  }

  const { data, error } = await admin.from("sensor_readings").insert(row).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
}
