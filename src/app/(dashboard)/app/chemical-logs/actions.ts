"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateLangelierSaturationIndex } from "@/lib/water/calculateLsi";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readChemicalPayload(formData: FormData, orgId: string, loggedBy: string) {
  const ph = parseOptionalNumber(formData.get("ph"));
  const temp_f = parseOptionalNumber(formData.get("tempF"));
  const alkalinity = parseOptionalNumber(formData.get("alkalinity"));
  const calcium_hardness = parseOptionalNumber(formData.get("calciumHardness"));
  const tds_ppm = parseOptionalNumber(formData.get("tdsPpm"));

  const tdsForLsi = tds_ppm !== null && tds_ppm > 0 ? tds_ppm : 800;
  const langelier_saturation_index =
    ph !== null &&
    temp_f !== null &&
    alkalinity !== null &&
    calcium_hardness !== null &&
    calcium_hardness > 0 &&
    alkalinity > 0
      ? calculateLangelierSaturationIndex({
          tempF: temp_f,
          ph,
          alkalinityPpm: alkalinity,
          calciumHardnessPpm: calcium_hardness,
          tdsPpm: tdsForLsi,
        })
      : null;

  return {
    org_id: orgId,
    pool_label: String(formData.get("poolLabel") ?? "").trim() || null,
    ph,
    free_chlorine: parseOptionalNumber(formData.get("freeChlorine")),
    total_chlorine: parseOptionalNumber(formData.get("totalChlorine")),
    alkalinity,
    temp_f,
    calcium_hardness,
    tds_ppm,
    langelier_saturation_index,
    logged_by: loggedBy,
  };
}

function hasAnyReading(payload: ReturnType<typeof readChemicalPayload>) {
  return !(
    payload.ph === null &&
    payload.free_chlorine === null &&
    payload.total_chlorine === null &&
    payload.alkalinity === null &&
    payload.temp_f === null &&
    payload.calcium_hardness === null &&
    payload.tds_ppm === null
  );
}

async function resolveTargetOrgId(formData: FormData, profile: Awaited<ReturnType<typeof requireProfileForApp>>) {
  if (profile.org_id) return profile.org_id;
  if (profile.role !== "super_admin") return null;
  const requestedOrgId = String(formData.get("orgId") ?? "").trim();
  if (!requestedOrgId) return null;
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("id", requestedOrgId).maybeSingle();
  return org?.id ?? null;
}

export async function createChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const targetOrgId = await resolveTargetOrgId(formData, profile);

  if (!targetOrgId) {
    redirect("/app/chemical-logs?status=invalid");
  }

  const payload = readChemicalPayload(formData, targetOrgId, profile.id);
  if (
    !hasAnyReading(payload)
  ) {
    redirect("/app/chemical-logs?status=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("chemical_logs").insert(payload);

  if (error) {
    redirect("/app/chemical-logs?status=error");
  }

  revalidatePath("/app/chemical-logs");
  revalidatePath("/app");
  redirect("/app/chemical-logs?status=created");
}

export async function updateChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const id = String(formData.get("id") ?? "");
  const targetOrgId = await resolveTargetOrgId(formData, profile);

  if (!targetOrgId || !id) {
    redirect("/app/chemical-logs?status=invalid");
  }

  const payload = readChemicalPayload(formData, targetOrgId, profile.id);
  if (!hasAnyReading(payload)) {
    redirect(`/app/chemical-logs?status=invalid&edit=${encodeURIComponent(id)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chemical_logs")
    .update({
      pool_label: payload.pool_label,
      ph: payload.ph,
      free_chlorine: payload.free_chlorine,
      total_chlorine: payload.total_chlorine,
      alkalinity: payload.alkalinity,
      temp_f: payload.temp_f,
      calcium_hardness: payload.calcium_hardness,
      tds_ppm: payload.tds_ppm,
      langelier_saturation_index: payload.langelier_saturation_index,
    })
    .eq("id", id)
    .eq("org_id", targetOrgId);

  if (error) {
    redirect(`/app/chemical-logs?status=error&edit=${encodeURIComponent(id)}`);
  }

  revalidatePath("/app/chemical-logs");
  redirect("/app/chemical-logs?status=updated");
}

export async function deleteChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const id = String(formData.get("id") ?? "");
  const targetOrgId = await resolveTargetOrgId(formData, profile);

  if (!targetOrgId || !id) {
    redirect("/app/chemical-logs?status=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("chemical_logs").delete().eq("id", id).eq("org_id", targetOrgId);

  if (error) {
    redirect("/app/chemical-logs?status=error");
  }

  revalidatePath("/app/chemical-logs");
  redirect("/app/chemical-logs?status=deleted");
}
