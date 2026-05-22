"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { createAdminClient } from "@/lib/supabase/admin";
import { supportProviderSchema, ticketIdSchema } from "@/lib/validations/support";
import type { TicketStatus } from "@/types/database";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

function parseProviderForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    contact_name: String(formData.get("contact_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address_line1: String(formData.get("address_line1") ?? ""),
    address_line2: optionalText(formData.get("address_line2")),
    city: String(formData.get("city") ?? ""),
    state_code: String(formData.get("state_code") ?? ""),
    postal_code: String(formData.get("postal_code") ?? ""),
    country: "US" as const,
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  };
}

export async function upsertSupportProviderAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("providerId") ?? "").trim();
  const parsed = supportProviderSchema.safeParse(parseProviderForm(formData));
  if (!parsed.success) {
    redirect(consoleSectionUrl("support_providers", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const payload = {
    name: parsed.data.name.trim(),
    contact_name: parsed.data.contact_name.trim(),
    phone: parsed.data.phone.trim(),
    address_line1: parsed.data.address_line1.trim(),
    address_line2: parsed.data.address_line2?.trim() ?? null,
    city: parsed.data.city.trim(),
    state_code: parsed.data.state_code,
    postal_code: parsed.data.postal_code.trim(),
    country: "US",
    is_active: parsed.data.is_active ?? true,
  };

  if (id) {
    const { error } = await admin.from("support_providers").update(payload).eq("id", id);
    if (error) redirect(consoleSectionUrl("support_providers", { status: "error" }));
  } else {
    const { error } = await admin.from("support_providers").insert(payload);
    if (error) redirect(consoleSectionUrl("support_providers", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("support_providers", { status: "saved" }));
}

export async function assignSupportTicketAction(formData: FormData) {
  await requireSuperAdminConsole();

  const idParsed = ticketIdSchema.safeParse({ id: String(formData.get("ticketId") ?? "") });
  const providerId = String(formData.get("assigned_support_provider_id") ?? "").trim() || null;
  const assignedTo = String(formData.get("assigned_to") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "") as TicketStatus;
  const valid: TicketStatus[] = ["open", "pending", "resolved", "closed"];

  if (!idParsed.success || !valid.includes(status)) {
    redirect(consoleSectionUrl("support", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    status,
    assigned_support_provider_id: providerId,
    assigned_to: assignedTo,
  };
  if (providerId && !assignedTo) {
    update.accepted_at = null;
  }
  if (providerId && assignedTo) {
    update.accepted_at = new Date().toISOString();
    if (status === "open") update.status = "pending";
  }
  if (!providerId) {
    update.assigned_to = null;
    update.accepted_at = null;
  }

  const { error } = await admin.from("support_tickets").update(update).eq("id", idParsed.data.id);
  if (error) redirect(consoleSectionUrl("support", { status: "error" }));

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/portal/queue");
  revalidatePath("/portal/assignments");
  redirect(consoleSectionUrl("support", { status: "updated" }));
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as TicketStatus;
  const valid: TicketStatus[] = ["open", "pending", "resolved", "closed"];
  if (!id || !valid.includes(status)) {
    redirect(consoleSectionUrl("support", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin.from("support_tickets").update({ status }).eq("id", id);
  if (error) redirect(consoleSectionUrl("support", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("support", { status: "updated" }));
}
