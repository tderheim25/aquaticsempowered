"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { getInspectionTemplate } from "@/lib/maintenance/inspectionTemplates";
import { createClient } from "@/lib/supabase/server";
import { inspectionLogIdSchema, inspectionLogSchema } from "@/lib/validations/inspection";

const BASE = "/app/maintenance/inspections";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? null : t;
}

function parseChecklist(formData: FormData, templateKey: string) {
  const template = getInspectionTemplate(templateKey);
  if (!template) return null;
  return template.items.map((item) => {
    const raw = String(formData.get(`check_${item.key}`) ?? "");
    const passed = raw === "pass" ? true : raw === "fail" ? false : null;
    return { key: item.key, label: item.label, passed };
  });
}

function parseInspectionForm(formData: FormData) {
  const templateKey = String(formData.get("template_key") ?? "");
  const checklist = parseChecklist(formData, templateKey);
  if (!checklist) return null;

  const allAnswered = checklist.every((c) => c.passed !== null);
  const passed = allAnswered ? checklist.every((c) => c.passed === true) : null;

  return inspectionLogSchema.safeParse({
    pool_id: String(formData.get("pool_id") ?? ""),
    inspected_at: String(formData.get("inspected_at") ?? ""),
    template_key: templateKey,
    checklist,
    passed,
    notes: optionalText(formData.get("notes")),
    operator_initials: optionalText(formData.get("operator_initials")),
  });
}

export async function createInspectionLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  const profile = await requireOrg();
  const parsed = parseInspectionForm(formData);
  if (!parsed?.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { data: pool } = await supabase
    .from("pools")
    .select("id")
    .eq("id", parsed.data.pool_id)
    .eq("org_id", profile.org_id!)
    .maybeSingle();
  if (!pool) redirect(`${BASE}?status=error`);

  const { error } = await supabase.from("inspection_logs").insert({
    org_id: profile.org_id!,
    pool_id: parsed.data.pool_id,
    inspected_at: new Date(parsed.data.inspected_at).toISOString(),
    template_key: parsed.data.template_key,
    checklist: parsed.data.checklist,
    passed: parsed.data.passed,
    notes: parsed.data.notes,
    operator_initials: parsed.data.operator_initials,
    logged_by: profile.id,
  });

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  redirect(`${BASE}?status=created&pool=${parsed.data.pool_id}`);
}

export async function updateInspectionLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = inspectionLogIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const parsed = parseInspectionForm(formData);
  if (!parsed?.success) redirect(`${BASE}?status=error`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("inspection_logs")
    .update({
      pool_id: parsed.data.pool_id,
      inspected_at: new Date(parsed.data.inspected_at).toISOString(),
      template_key: parsed.data.template_key,
      checklist: parsed.data.checklist,
      passed: parsed.data.passed,
      notes: parsed.data.notes,
      operator_initials: parsed.data.operator_initials,
    })
    .eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error&pool=${parsed.data.pool_id}`);
  revalidatePath(BASE);
  redirect(`${BASE}?status=updated&pool=${parsed.data.pool_id}`);
}

export async function deleteInspectionLogAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idParsed = inspectionLogIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) redirect(`${BASE}?status=error`);

  const poolId = String(formData.get("pool_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("inspection_logs").delete().eq("id", idParsed.data.id);

  if (error) redirect(`${BASE}?status=error`);
  revalidatePath(BASE);
  redirect(poolId ? `${BASE}?status=deleted&pool=${poolId}` : `${BASE}?status=deleted`);
}
