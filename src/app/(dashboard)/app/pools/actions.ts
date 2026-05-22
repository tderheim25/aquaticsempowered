"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { fetchPoolByIdForProfile } from "@/lib/pools/fetchPool";
import { resolveTargetOrgId } from "@/lib/pools/resolveOrgId";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UsersRow } from "@/lib/auth/rbac";
import { poolIdSchema, poolSchema } from "@/lib/validations/pools";
import { DEFAULT_TARGET_RANGES } from "@/lib/water/defaultTargetRanges";

function canInsertPoolForOrg(profile: UsersRow, orgId: string) {
  if (profile.role === "super_admin") return true;
  return profile.org_id === orgId;
}

function parsePoolForm(formData: FormData) {
  const volumeRaw = String(formData.get("volume_gallons") ?? "").trim();
  return poolSchema.safeParse({
    name: formData.get("name"),
    pool_type: formData.get("pool_type"),
    volume_gallons: volumeRaw ? Number(volumeRaw) : null,
    location_label: String(formData.get("location_label") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    status: formData.get("status"),
  });
}

export async function createPoolAction(formData: FormData) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const orgId =
    profile.role === "super_admin"
      ? await resolveTargetOrgId(profile, String(formData.get("orgId") ?? ""))
      : profile.org_id;
  if (!orgId) redirect("/app/pools?status=no_org");
  if (profile.role !== "super_admin" && orgId !== profile.org_id) {
    redirect("/app/pools?status=no_org");
  }

  const parsed = parsePoolForm(formData);
  if (!parsed.success) redirect("/app/pools?status=invalid");

  const row = {
    org_id: orgId,
    name: parsed.data.name,
    pool_type: parsed.data.pool_type,
    volume_gallons: parsed.data.volume_gallons ?? null,
    location_label: parsed.data.location_label,
    notes: parsed.data.notes,
    status: parsed.data.status,
    target_ranges: DEFAULT_TARGET_RANGES,
    created_by: profile.id,
  };

  const supabase = await createClient();
  let { data, error } = await supabase.from("pools").insert(row).select("id, org_id").single();

  if ((error || !data) && canInsertPoolForOrg(profile, orgId)) {
    const admin = createAdminClient();
    ({ data, error } = await admin.from("pools").insert(row).select("id, org_id").single());
  }

  if (data && data.org_id !== orgId) {
    console.error("[createPoolAction] pool org mismatch", { expected: orgId, got: data.org_id });
    redirect("/app/pools?status=error");
  }

  if (error || !data) {
    console.error("[createPoolAction]", error?.message ?? "insert returned no row", {
      orgId,
      code: error?.code,
    });
    redirect("/app/pools?status=error");
  }
  revalidatePath("/app/pools");
  revalidatePath(`/app/pools/${data.id}`);
  redirect("/app/pools?status=created");
}

export async function updatePoolAction(formData: FormData) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const idParsed = poolIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect("/app/pools?status=invalid");

  const existing = await fetchPoolByIdForProfile(idParsed.data.id, profile);
  if (!existing) redirect("/app/pools?status=invalid");

  const parsed = parsePoolForm(formData);
  if (!parsed.success) redirect(`/app/pools/${idParsed.data.id}?status=invalid`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("pools")
    .update({
      name: parsed.data.name,
      pool_type: parsed.data.pool_type,
      volume_gallons: parsed.data.volume_gallons ?? null,
      location_label: parsed.data.location_label,
      notes: parsed.data.notes,
      status: parsed.data.status,
    })
    .eq("id", idParsed.data.id)
    .eq("org_id", existing.org_id);

  if (error) redirect(`/app/pools/${idParsed.data.id}?status=error`);
  revalidatePath("/app/pools");
  revalidatePath(`/app/pools/${idParsed.data.id}`);
  redirect(`/app/pools/${idParsed.data.id}?status=updated`);
}

export async function updatePoolTargetsAction(formData: FormData) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const idParsed = poolIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect("/app/pools?status=invalid");

  const existing = await fetchPoolByIdForProfile(idParsed.data.id, profile);
  if (!existing) redirect("/app/pools?status=invalid");

  const raw = String(formData.get("target_ranges") ?? "{}");
  let target_ranges: object = DEFAULT_TARGET_RANGES;
  try {
    target_ranges = JSON.parse(raw) as object;
  } catch {
    redirect(`/app/pools/${idParsed.data.id}?tab=targets&status=invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pools")
    .update({ target_ranges })
    .eq("id", idParsed.data.id)
    .eq("org_id", existing.org_id);
  if (error) redirect(`/app/pools/${idParsed.data.id}?tab=targets&status=error`);
  revalidatePath(`/app/pools/${idParsed.data.id}`);
  redirect(`/app/pools/${idParsed.data.id}?tab=targets&status=updated`);
}

export async function deletePoolAction(formData: FormData) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const idParsed = poolIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect("/app/pools?status=invalid");

  const existing = await fetchPoolByIdForProfile(idParsed.data.id, profile);
  if (!existing) redirect("/app/pools?status=invalid");

  const supabase = await createClient();
  const { error } = await supabase.from("pools").delete().eq("id", idParsed.data.id).eq("org_id", existing.org_id);
  if (error) redirect("/app/pools?status=error");
  revalidatePath("/app/pools");
  redirect("/app/pools?status=deleted");
}
