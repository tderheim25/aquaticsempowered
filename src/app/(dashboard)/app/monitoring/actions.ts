"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { resolveTargetOrgId } from "@/lib/pools/resolveOrgId";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode, UserRole } from "@/types/database";

async function requireSensorsFeature(orgId: string, role: UserRole) {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", orgId).maybeSingle();
  const plan = (org?.plan_code as PlanCode) ?? "free";
  if (!hasFeature(plan, "sensors", role)) redirect("/app/monitoring/sensors?status=forbidden");
}

export async function ingestSensorReadingAction(formData: FormData) {
  await requireViewAccess("monitoring");
  const profile = await requireProfileForApp();
  const targetOrgId = await resolveTargetOrgId(profile, String(formData.get("orgId") ?? ""));
  if (!targetOrgId) redirect("/app/monitoring/sensors?status=invalid");

  await requireSensorsFeature(targetOrgId, profile.role);

  const poolId = String(formData.get("poolId") ?? "").trim() || null;
  const deviceId = String(formData.get("deviceId") ?? "").trim();
  const metric = String(formData.get("metric") ?? "").trim();
  const valueRaw = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;

  if (!deviceId || !metric || !valueRaw) redirect("/app/monitoring/sensors?status=invalid");
  const value = Number(valueRaw);
  if (!Number.isFinite(value)) redirect("/app/monitoring/sensors?status=invalid");

  const supabase = await createClient();
  const { error } = await supabase.from("sensor_readings").insert({
    org_id: targetOrgId,
    pool_id: poolId,
    device_id: deviceId,
    metric,
    value,
    unit,
  });

  if (error) redirect("/app/monitoring/sensors?status=error");
  revalidatePath("/app/monitoring/sensors");
  redirect("/app/monitoring/sensors?status=created");
}
