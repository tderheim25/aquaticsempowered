"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import {
  procurementRequestCreateSchema,
  procurementRequestIdSchema,
  procurementRequestUpdateSchema,
} from "@/lib/validations/procurement";
import type { PlanCode } from "@/types/database";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

async function requireProcurementPlan() {
  const profile = await requireOrg();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan_code")
    .eq("id", profile.org_id!)
    .maybeSingle();
  const plan = (org?.plan_code as PlanCode) ?? "free";
  if (!hasFeature(plan, "procurement")) {
    redirect("/app/procurement?status=plan");
  }
  return profile;
}

export async function createProcurementRequestAction(formData: FormData) {
  await requireViewAccess("procurement");
  const profile = await requireProcurementPlan();

  const vendorRaw = String(formData.get("preferred_vendor_id") ?? "").trim();
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: optionalText(formData.get("description")),
    category: String(formData.get("category") ?? "other"),
    preferred_vendor_id: vendorRaw === "" ? undefined : vendorRaw,
  };

  const parsed = procurementRequestCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/procurement?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("procurement_requests").insert({
    org_id: profile.org_id!,
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
    category: parsed.data.category,
    preferred_vendor_id: parsed.data.preferred_vendor_id ?? null,
    status: "submitted",
    created_by: profile.id,
  });

  if (error) {
    redirect("/app/procurement?status=error");
  }

  revalidatePath("/app/procurement");
  redirect("/app/procurement?status=created");
}

export async function updateProcurementRequestAction(formData: FormData) {
  await requireViewAccess("procurement");
  const profile = await requireProcurementPlan();

  const idRaw = String(formData.get("requestId") ?? "");
  const idParsed = procurementRequestIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/procurement?status=error");
  }

  const vendorRaw = String(formData.get("preferred_vendor_id") ?? "").trim();
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: optionalText(formData.get("description")),
    category: String(formData.get("category") ?? "other"),
    status: String(formData.get("status") ?? "submitted"),
    preferred_vendor_id: vendorRaw === "" ? undefined : vendorRaw,
  };

  const parsed = procurementRequestUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/procurement?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("procurement_requests")
    .update({
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
      category: parsed.data.category,
      status: parsed.data.status,
      preferred_vendor_id: parsed.data.preferred_vendor_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", idParsed.data.id)
    .eq("org_id", profile.org_id!);

  if (error) {
    redirect("/app/procurement?status=error");
  }

  revalidatePath("/app/procurement");
  redirect("/app/procurement?status=updated");
}
