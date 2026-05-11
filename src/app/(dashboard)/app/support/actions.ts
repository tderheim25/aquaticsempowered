"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { ticketCreateSchema, ticketIdSchema, ticketUpdateSchema } from "@/lib/validations/support";
import type { PlanCode } from "@/types/database";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

async function requireSupportPlan() {
  const profile = await requireOrg();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan_code")
    .eq("id", profile.org_id!)
    .maybeSingle();
  const plan = (org?.plan_code as PlanCode) ?? "free";
  if (!hasFeature(plan, "support")) {
    redirect("/app/support?status=plan");
  }
  return profile;
}

export async function createTicketAction(formData: FormData) {
  await requireViewAccess("support_center");
  const profile = await requireSupportPlan();

  const raw = {
    subject: String(formData.get("subject") ?? ""),
    body: optionalText(formData.get("body")),
    priority: String(formData.get("priority") ?? "medium"),
  };

  const parsed = ticketCreateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/support?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").insert({
    org_id: profile.org_id!,
    subject: parsed.data.subject.trim(),
    body: parsed.data.body?.trim() ? parsed.data.body.trim() : null,
    priority: parsed.data.priority,
    created_by: profile.id,
  });

  if (error) {
    redirect("/app/support?status=error");
  }

  revalidatePath("/app/support");
  redirect("/app/support?status=created");
}

export async function updateTicketAction(formData: FormData) {
  await requireViewAccess("support_center");
  await requireSupportPlan();

  const idRaw = String(formData.get("ticketId") ?? "");
  const idParsed = ticketIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/support?status=error");
  }

  const raw = {
    subject: String(formData.get("subject") ?? ""),
    body: optionalText(formData.get("body")),
    status: String(formData.get("status") ?? "open"),
    priority: String(formData.get("priority") ?? "medium"),
  };

  const parsed = ticketUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/support?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      subject: parsed.data.subject.trim(),
      body: parsed.data.body?.trim() ? parsed.data.body.trim() : null,
      status: parsed.data.status,
      priority: parsed.data.priority,
    })
    .eq("id", idParsed.data.id);

  if (error) {
    redirect("/app/support?status=error");
  }

  revalidatePath("/app/support");
  redirect("/app/support?status=updated");
}
