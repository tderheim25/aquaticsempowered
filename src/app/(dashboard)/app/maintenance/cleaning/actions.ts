"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { cleaningLogIdSchema, cleaningLogSchema } from "@/lib/validations/cleaning";

const BASE = "/app/maintenance/cleaning";

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? null : t;
}

function parseCleaningForm(formData: FormData) {
  return cleaningLogSchema.safeParse({
    pool_id: String(formData.get("pool_id") ?? ""),
    cleaned_at: String(formData.get("cleaned_at") ?? ""),
    brush: checkbox(formData, "brush"),
    net: checkbox(formData, "net"),
    vacuum: checkbox(formData, "vacuum"),
    skimmer_basket: checkbox(formData, "skimmer_basket"),
    pump_basket: checkbox(formData, "pump_basket"),
    pump_filter: checkbox(formData, "pump_filter"),
    deck: checkbox(formData, "deck"),
    notes: optionalText(formData.get("notes")),
  });
}

export async function createCleaningLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  const profile = await requireOrg();
  const parsed = parseCleaningForm(formData);
  if (!parsed.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { data: pool } = await supabase
    .from("pools")
    .select("id")
    .eq("id", parsed.data.pool_id)
    .eq("org_id", profile.org_id!)
    .maybeSingle();
  if (!pool) redirect(`${BASE}?status=error`);

  const { error } = await supabase.from("cleaning_logs").insert({
    org_id: profile.org_id!,
    pool_id: parsed.data.pool_id,
    cleaned_at: new Date(parsed.data.cleaned_at).toISOString(),
    brush: parsed.data.brush,
    net: parsed.data.net,
    vacuum: parsed.data.vacuum,
    skimmer_basket: parsed.data.skimmer_basket,
    pump_basket: parsed.data.pump_basket,
    pump_filter: parsed.data.pump_filter,
    deck: parsed.data.deck,
    notes: parsed.data.notes,
    logged_by: profile.id,
  });

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  redirect(`${BASE}?status=created&pool=${parsed.data.pool_id}`);
}

export async function updateCleaningLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = cleaningLogIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const parsed = parseCleaningForm(formData);
  if (!parsed.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("cleaning_logs")
    .update({
      pool_id: parsed.data.pool_id,
      cleaned_at: new Date(parsed.data.cleaned_at).toISOString(),
      brush: parsed.data.brush,
      net: parsed.data.net,
      vacuum: parsed.data.vacuum,
      skimmer_basket: parsed.data.skimmer_basket,
      pump_basket: parsed.data.pump_basket,
      pump_filter: parsed.data.pump_filter,
      deck: parsed.data.deck,
      notes: parsed.data.notes,
    })
    .eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  redirect(`${BASE}?status=updated&pool=${parsed.data.pool_id}`);
}

export async function deleteCleaningLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = cleaningLogIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const poolId = String(formData.get("pool_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("cleaning_logs").delete().eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error`);
  revalidatePath(BASE);
  redirect(poolId ? `${BASE}?status=deleted&pool=${poolId}` : `${BASE}?status=deleted`);
}
