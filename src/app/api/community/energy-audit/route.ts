import { NextResponse } from "next/server";

import { generateEnergyAuditReport } from "@/lib/energy-audit/generateEnergyAuditReport";
import {
  buildCommunityEnergyAuditUsage,
  communityEnergyAuditLimitMessage,
  countCommunityEnergyAuditsToday,
  COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT,
} from "@/lib/energy-audit/communityAuditLimits";
import { getSessionUser } from "@/lib/auth/rbac";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { communityEnergyAuditRequestSchema } from "@/lib/validations/communityEnergyAudit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Sign in to run energy audits.",
        code: "SIGN_IN_REQUIRED",
        limit: COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT,
      },
      { status: 401 },
    );
  }

  // Burst guard on top of the per-day limit — each run triggers a paid AI call.
  const limited = await enforceRateLimit(`energy-audit:${user.id}`, {
    limit: 5,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = communityEnergyAuditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.facilityName?.[0] ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  let usedToday: number;
  try {
    usedToday = await countCommunityEnergyAuditsToday(admin, user.id);
  } catch {
    return NextResponse.json({ error: "Could not verify daily audit limit." }, { status: 500 });
  }

  const usageBefore = buildCommunityEnergyAuditUsage(usedToday, true);
  if (usageBefore.atLimit) {
    return NextResponse.json(
      {
        error: communityEnergyAuditLimitMessage(usageBefore),
        code: "DAILY_LIMIT_REACHED",
        usage: usageBefore,
      },
      { status: 429 },
    );
  }

  const input = {
    facilityName: parsed.data.facilityName,
    facilityType: parsed.data.facilityType,
    bodyOfWater: parsed.data.bodyOfWater,
    sizeNotes: parsed.data.sizeNotes,
    equipmentNotes: parsed.data.equipmentNotes,
    scheduleNotes: parsed.data.scheduleNotes,
  };

  let report: string;
  try {
    report = await generateEnergyAuditReport(input);
  } catch (e) {
    console.error("[community/energy-audit]", e);
    return NextResponse.json({ error: "Could not generate the audit. Try again shortly." }, { status: 503 });
  }

  const title = `${parsed.data.facilityName.trim()} — Energy audit`;
  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("energy_audits")
    .insert({
      org_id: null,
      pool_id: null,
      title,
      facility_name: parsed.data.facilityName,
      facility_type: parsed.data.facilityType ?? null,
      body_of_water: parsed.data.bodyOfWater ?? null,
      size_notes: parsed.data.sizeNotes ?? null,
      equipment_notes: parsed.data.equipmentNotes ?? null,
      schedule_notes: parsed.data.scheduleNotes ?? null,
      input_payload: parsed.data,
      ai_report: report,
      is_community_beta: true,
      status: "completed",
      created_by: user.id,
      completed_at: now,
      findings: null,
      recommendations: null,
      estimated_savings_notes: null,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[community/energy-audit] insert:", error?.message);
    return NextResponse.json(
      {
        error:
          "Could not save the audit. Apply migration 0036_energy_audits_community_ai.sql in Supabase, then try again.",
      },
      { status: 500 },
    );
  }

  const usageAfter = buildCommunityEnergyAuditUsage(usedToday + 1, true);

  return NextResponse.json({
    id: row.id,
    title,
    report,
    usage: usageAfter,
  });
}

