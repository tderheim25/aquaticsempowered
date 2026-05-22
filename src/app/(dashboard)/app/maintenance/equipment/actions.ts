"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { poolEquipmentIdSchema, poolEquipmentSchema } from "@/lib/validations/equipment";

const BASE = "/app/maintenance/equipment";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? null : t;
}

function parseEquipmentForm(formData: FormData) {
  const installedRaw = optionalText(formData.get("installed_on"));
  return poolEquipmentSchema.safeParse({
    pool_id: String(formData.get("pool_id") ?? ""),
    kind: String(formData.get("kind") ?? "other"),
    model: optionalText(formData.get("model")),
    installed_on: installedRaw,
    notes: optionalText(formData.get("notes")),
  });
}

export async function createPoolEquipmentAction(formData: FormData) {
  await requireViewAccess("maintenance");
  const profile = await requireOrg();
  const parsed = parseEquipmentForm(formData);
  if (!parsed.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { data: pool } = await supabase
    .from("pools")
    .select("id")
    .eq("id", parsed.data.pool_id)
    .eq("org_id", profile.org_id!)
    .maybeSingle();
  if (!pool) redirect(`${BASE}?status=error`);

  const { error } = await supabase.from("pool_equipment").insert({
    org_id: profile.org_id!,
    pool_id: parsed.data.pool_id,
    kind: parsed.data.kind,
    model: parsed.data.model,
    installed_on: parsed.data.installed_on,
    notes: parsed.data.notes,
  });

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  revalidatePath(`/app/pools/${parsed.data.pool_id}`);
  redirect(`${BASE}?status=created&pool=${parsed.data.pool_id}`);
}

export async function updatePoolEquipmentAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = poolEquipmentIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const parsed = parseEquipmentForm(formData);
  if (!parsed.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("pool_equipment")
    .update({
      pool_id: parsed.data.pool_id,
      kind: parsed.data.kind,
      model: parsed.data.model,
      installed_on: parsed.data.installed_on,
      notes: parsed.data.notes,
    })
    .eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  revalidatePath(`/app/pools/${parsed.data.pool_id}`);
  redirect(`${BASE}?status=updated&pool=${parsed.data.pool_id}`);
}

export async function deletePoolEquipmentAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = poolEquipmentIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const poolId = String(formData.get("pool_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("pool_equipment").delete().eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error`);
  revalidatePath(BASE);
  if (poolId) revalidatePath(`/app/pools/${poolId}`);
  redirect(poolId ? `${BASE}?status=deleted&pool=${poolId}` : `${BASE}?status=deleted`);
}
