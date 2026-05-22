"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { portalTicketCreateSchema, ticketIdSchema } from "@/lib/validations/support";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

function parsePortalFromFormData(formData: FormData) {
  return {
    requester_company_name: String(formData.get("requester_company_name") ?? ""),
    contact_name: String(formData.get("contact_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address_line1: String(formData.get("address_line1") ?? ""),
    address_line2: optionalText(formData.get("address_line2")),
    city: String(formData.get("city") ?? ""),
    state_code: String(formData.get("state_code") ?? ""),
    postal_code: String(formData.get("postal_code") ?? ""),
    country: "US" as const,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    priority: String(formData.get("priority") ?? "medium"),
  };
}

export async function createPortalTicketAction(formData: FormData) {
  const profile = await requireViewAccess("support_center");
  const parsed = portalTicketCreateSchema.safeParse(parsePortalFromFormData(formData));
  if (!parsed.success) {
    redirect("/app/support?status=error");
  }

  const supabase = await createClient();
  const orgId = profile.org_id ?? (await resolveActiveOrgId(profile));

  const { error } = await supabase.from("support_tickets").insert({
    org_id: orgId,
    source: "portal",
    subject: parsed.data.subject.trim(),
    body: parsed.data.body.trim(),
    priority: parsed.data.priority,
    created_by: profile.id,
    requester_company_name: parsed.data.requester_company_name.trim(),
    contact_name: parsed.data.contact_name.trim(),
    phone: parsed.data.phone.trim(),
    address_line1: parsed.data.address_line1.trim(),
    address_line2: parsed.data.address_line2?.trim() ?? null,
    city: parsed.data.city.trim(),
    state_code: parsed.data.state_code,
    postal_code: parsed.data.postal_code.trim(),
    country: "US",
  });

  if (error) {
    redirect("/app/support?status=error");
  }

  revalidatePath("/app/support");
  redirect("/app/support?status=created");
}

export async function updateTicketAction(formData: FormData) {
  await requireViewAccess("support_center");
  const profile = await requireProfileForApp();

  const idRaw = String(formData.get("ticketId") ?? "");
  const idParsed = ticketIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/support?status=error");
  }

  const parsed = portalTicketCreateSchema.safeParse(parsePortalFromFormData(formData));
  if (!parsed.success) {
    redirect("/app/support?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      subject: parsed.data.subject.trim(),
      body: parsed.data.body.trim(),
      priority: parsed.data.priority,
      requester_company_name: parsed.data.requester_company_name.trim(),
      contact_name: parsed.data.contact_name.trim(),
      phone: parsed.data.phone.trim(),
      address_line1: parsed.data.address_line1.trim(),
      address_line2: parsed.data.address_line2?.trim() ?? null,
      city: parsed.data.city.trim(),
      state_code: parsed.data.state_code,
      postal_code: parsed.data.postal_code.trim(),
    })
    .eq("id", idParsed.data.id)
    .eq("created_by", profile.id);

  if (error) {
    redirect("/app/support?status=error");
  }

  revalidatePath("/app/support");
  redirect("/app/support?status=updated");
}
