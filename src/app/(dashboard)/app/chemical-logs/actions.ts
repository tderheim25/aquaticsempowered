"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { fetchPoolFieldsForOrg } from "@/lib/org/fetchOrgScopedData";
import { resolveTargetOrgId } from "@/lib/pools/resolveOrgId";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateLangelierSaturationIndex } from "@/lib/water/calculateLsi";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolvePoolFields(
  profile: Awaited<ReturnType<typeof requireProfileForApp>>,
  orgId: string,
  poolIdRaw: string | null
) {
  return fetchPoolFieldsForOrg(orgId, poolIdRaw, profile);
}

async function readChemicalPayload(
  formData: FormData,
  orgId: string,
  loggedBy: string,
  profile: Awaited<ReturnType<typeof requireProfileForApp>>
) {
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

  const poolFields = await resolvePoolFields(profile, orgId, String(formData.get("poolId") ?? ""));

  return {
    org_id: orgId,
    ...poolFields,
    ph,
    free_chlorine: parseOptionalNumber(formData.get("freeChlorine")),
    total_chlorine: parseOptionalNumber(formData.get("totalChlorine")),
    alkalinity,
    temp_f,
    calcium_hardness,
    tds_ppm,
    cyanuric_acid_ppm: parseOptionalNumber(formData.get("cyanuricAcid")),
    filter_psi: parseOptionalNumber(formData.get("filterPsi")),
    flow_gpm: parseOptionalNumber(formData.get("flowGpm")),
    notes: String(formData.get("notes") ?? "").trim() || null,
    operator_initials: String(formData.get("operatorInitials") ?? "").trim() || null,
    langelier_saturation_index,
    logged_by: loggedBy,
  };
}

function chemicalLogsReturnPath(formData: FormData, status: string, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  const poolId = String(formData.get("returnPoolId") ?? "").trim();
  const date = String(formData.get("returnDate") ?? "").trim();
  const org = String(formData.get("returnOrg") ?? "").trim();
  if (org) params.set("org", org);
  if (poolId) params.set("pool_id", poolId);
  if (date) params.set("date", date);
  params.set("status", status);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  return `/app/chemical-logs?${params.toString()}`;
}

function hasAnyReading(payload: Awaited<ReturnType<typeof readChemicalPayload>>) {
  return !(
    payload.ph === null &&
    payload.free_chlorine === null &&
    payload.total_chlorine === null &&
    payload.alkalinity === null &&
    payload.temp_f === null &&
    payload.calcium_hardness === null &&
    payload.tds_ppm === null &&
    payload.cyanuric_acid_ppm === null
  );
}

export async function createChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const targetOrgId = await resolveTargetOrgId(profile, String(formData.get("orgId") ?? ""));
  if (!targetOrgId) redirect(chemicalLogsReturnPath(formData, "invalid"));

  const supabase = await createClient();
  const payload = await readChemicalPayload(formData, targetOrgId, profile.id, profile);
  if (!hasAnyReading(payload)) redirect(chemicalLogsReturnPath(formData, "invalid"));

  let { error } = await supabase.from("chemical_logs").insert(payload);
  if (error && (profile.role === "super_admin" || profile.org_id === targetOrgId)) {
    const admin = createAdminClient();
    ({ error } = await admin.from("chemical_logs").insert(payload));
  }
  if (error) redirect(chemicalLogsReturnPath(formData, "error"));

  revalidatePath("/app/chemical-logs");
  revalidatePath("/app/monitoring");
  redirect(chemicalLogsReturnPath(formData, "created"));
}

export async function updateChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const id = String(formData.get("id") ?? "");
  const targetOrgId = await resolveTargetOrgId(profile, String(formData.get("orgId") ?? ""));
  if (!targetOrgId || !id) redirect(chemicalLogsReturnPath(formData, "invalid"));

  const supabase = await createClient();
  const payload = await readChemicalPayload(formData, targetOrgId, profile.id, profile);
  if (!hasAnyReading(payload)) redirect(chemicalLogsReturnPath(formData, "invalid", { edit: id }));

  let { error } = await supabase
    .from("chemical_logs")
    .update({
      pool_id: payload.pool_id,
      pool_label: payload.pool_label,
      ph: payload.ph,
      free_chlorine: payload.free_chlorine,
      total_chlorine: payload.total_chlorine,
      alkalinity: payload.alkalinity,
      temp_f: payload.temp_f,
      calcium_hardness: payload.calcium_hardness,
      tds_ppm: payload.tds_ppm,
      cyanuric_acid_ppm: payload.cyanuric_acid_ppm,
      filter_psi: payload.filter_psi,
      flow_gpm: payload.flow_gpm,
      notes: payload.notes,
      operator_initials: payload.operator_initials,
      langelier_saturation_index: payload.langelier_saturation_index,
    })
    .eq("id", id)
    .eq("org_id", targetOrgId);

  if (error && (profile.role === "super_admin" || profile.org_id === targetOrgId)) {
    const admin = createAdminClient();
    ({ error } = await admin
      .from("chemical_logs")
      .update({
        pool_id: payload.pool_id,
        pool_label: payload.pool_label,
        ph: payload.ph,
        free_chlorine: payload.free_chlorine,
        total_chlorine: payload.total_chlorine,
        alkalinity: payload.alkalinity,
        temp_f: payload.temp_f,
        calcium_hardness: payload.calcium_hardness,
        tds_ppm: payload.tds_ppm,
        cyanuric_acid_ppm: payload.cyanuric_acid_ppm,
        filter_psi: payload.filter_psi,
        flow_gpm: payload.flow_gpm,
        notes: payload.notes,
        operator_initials: payload.operator_initials,
        langelier_saturation_index: payload.langelier_saturation_index,
      })
      .eq("id", id)
      .eq("org_id", targetOrgId));
  }

  if (error) redirect(chemicalLogsReturnPath(formData, "error", { edit: id }));
  revalidatePath("/app/chemical-logs");
  redirect(chemicalLogsReturnPath(formData, "updated"));
}

export async function deleteChemicalLogAction(formData: FormData) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const id = String(formData.get("id") ?? "");
  const targetOrgId = await resolveTargetOrgId(profile, String(formData.get("orgId") ?? ""));
  if (!targetOrgId || !id) redirect(chemicalLogsReturnPath(formData, "invalid"));

  const supabase = await createClient();
  const { error } = await supabase.from("chemical_logs").delete().eq("id", id).eq("org_id", targetOrgId);
  if (error) redirect(chemicalLogsReturnPath(formData, "error"));
  revalidatePath("/app/chemical-logs");
  redirect(chemicalLogsReturnPath(formData, "deleted"));
}
