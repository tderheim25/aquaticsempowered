"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canUseEnergyAudits } from "@/lib/auth/energyAuditAccess";
import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import {
  energyAuditCreateSchema,
  energyAuditIdSchema,
  energyAuditUpdateSchema,
} from "@/lib/validations/energyAudit";
import type { EnergyAuditStatus, PlanCode } from "@/types/database";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? null : t;
}

async function requireEnergyAuditAccess() {
  await requireViewAccess("energy_audits");
  const profile = await requireOrg();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan_code")
    .eq("id", profile.org_id!)
    .maybeSingle();
  const plan = (org?.plan_code as PlanCode) ?? "free";
  if (!canUseEnergyAudits(plan)) {
    redirect("/app/energy-audits?status=plan");
  }
  return { profile, supabase };
}

export async function createEnergyAuditAction(formData: FormData) {
  const { profile, supabase } = await requireEnergyAuditAccess();

  const poolRaw = String(formData.get("pool_id") ?? "").trim();
  const raw = {
    title: String(formData.get("title") ?? ""),
    pool_id: poolRaw === "" ? null : poolRaw,
    facility_summary: optionalText(formData.get("facility_summary")),
    pump_notes: optionalText(formData.get("pump_notes")),
    heater_notes: optionalText(formData.get("heater_notes")),
    schedule_notes: optionalText(formData.get("schedule_notes")),
    findings: optionalText(formData.get("findings")),
    recommendations: optionalText(formData.get("recommendations")),
    estimated_savings_notes: optionalText(formData.get("estimated_savings_notes")),
    status: String(formData.get("status") ?? "draft") as EnergyAuditStatus,
  };

  const parsed = energyAuditCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/energy-audits?status=error");
  }

  const status = parsed.data.status ?? "draft";
  const completed_at = status === "completed" ? new Date().toISOString() : null;

  const { error } = await supabase.from("energy_audits").insert({
    org_id: profile.org_id!,
    title: parsed.data.title,
    pool_id: parsed.data.pool_id ?? null,
    facility_summary: parsed.data.facility_summary ?? null,
    pump_notes: parsed.data.pump_notes ?? null,
    heater_notes: parsed.data.heater_notes ?? null,
    schedule_notes: parsed.data.schedule_notes ?? null,
    findings: parsed.data.findings ?? null,
    recommendations: parsed.data.recommendations ?? null,
    estimated_savings_notes: parsed.data.estimated_savings_notes ?? null,
    status,
    created_by: profile.id,
    completed_at,
  });

  if (error) {
    redirect("/app/energy-audits?status=error");
  }

  revalidatePath("/app/energy-audits");
  redirect("/app/energy-audits?status=created");
}

export async function updateEnergyAuditAction(formData: FormData) {
  const { profile, supabase } = await requireEnergyAuditAccess();

  const idRaw = String(formData.get("auditId") ?? "");
  const idParsed = energyAuditIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/energy-audits?status=error");
  }

  const poolRaw = String(formData.get("pool_id") ?? "").trim();
  const raw = {
    id: idParsed.data.id,
    title: String(formData.get("title") ?? ""),
    pool_id: poolRaw === "" ? null : poolRaw,
    facility_summary: optionalText(formData.get("facility_summary")),
    pump_notes: optionalText(formData.get("pump_notes")),
    heater_notes: optionalText(formData.get("heater_notes")),
    schedule_notes: optionalText(formData.get("schedule_notes")),
    findings: optionalText(formData.get("findings")),
    recommendations: optionalText(formData.get("recommendations")),
    estimated_savings_notes: optionalText(formData.get("estimated_savings_notes")),
    status: String(formData.get("status") ?? "draft") as EnergyAuditStatus,
  };

  const parsed = energyAuditUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/energy-audits?status=error");
  }

  const status = parsed.data.status ?? "draft";
  const completed_at = status === "completed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("energy_audits")
    .update({
      title: parsed.data.title,
      pool_id: parsed.data.pool_id ?? null,
      facility_summary: parsed.data.facility_summary ?? null,
      pump_notes: parsed.data.pump_notes ?? null,
      heater_notes: parsed.data.heater_notes ?? null,
      schedule_notes: parsed.data.schedule_notes ?? null,
      findings: parsed.data.findings ?? null,
      recommendations: parsed.data.recommendations ?? null,
      estimated_savings_notes: parsed.data.estimated_savings_notes ?? null,
      status,
      completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("org_id", profile.org_id!);

  if (error) {
    redirect("/app/energy-audits?status=error");
  }

  revalidatePath("/app/energy-audits");
  redirect("/app/energy-audits?status=updated");
}

export async function deleteEnergyAuditAction(formData: FormData) {
  const { profile, supabase } = await requireEnergyAuditAccess();

  const idParsed = energyAuditIdSchema.safeParse({ id: String(formData.get("auditId") ?? "") });
  if (!idParsed.success) {
    redirect("/app/energy-audits?status=error");
  }

  const { error } = await supabase
    .from("energy_audits")
    .delete()
    .eq("id", idParsed.data.id)
    .eq("org_id", profile.org_id!);

  if (error) {
    redirect("/app/energy-audits?status=error");
  }

  revalidatePath("/app/energy-audits");
  redirect("/app/energy-audits?status=deleted");
}
