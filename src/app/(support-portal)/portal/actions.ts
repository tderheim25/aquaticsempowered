"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSupportTechnicianRole } from "@/lib/auth/supportTechnician";
import { createClient } from "@/lib/supabase/server";
import { ticketIdSchema } from "@/lib/validations/support";

export async function acceptTicketAction(formData: FormData) {
  const profile = await requireSupportTechnicianRole();
  if (!profile.support_provider_id) {
    redirect("/portal/queue?status=no_provider");
  }
  const providerId = profile.support_provider_id;

  const idParsed = ticketIdSchema.safeParse({ id: String(formData.get("ticketId") ?? "") });
  if (!idParsed.success) {
    redirect("/portal/queue?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      assigned_support_provider_id: providerId,
      assigned_to: profile.id,
      accepted_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("id", idParsed.data.id)
    .eq("status", "open")
    .is("assigned_support_provider_id", null);

  if (error) {
    redirect("/portal/queue?status=error");
  }

  revalidatePath("/portal/queue");
  revalidatePath("/portal/assignments");
  redirect("/portal/assignments?status=accepted");
}

export async function updateAssignedTicketStatusAction(formData: FormData) {
  await requireSupportTechnicianRole();

  const idParsed = ticketIdSchema.safeParse({ id: String(formData.get("ticketId") ?? "") });
  const status = String(formData.get("status") ?? "");
  if (!idParsed.success || !["open", "pending", "resolved", "closed"].includes(status)) {
    redirect("/portal/assignments?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ status: status as "open" | "pending" | "resolved" | "closed" })
    .eq("id", idParsed.data.id);

  if (error) {
    redirect("/portal/assignments?status=error");
  }

  revalidatePath("/portal/queue");
  revalidatePath("/portal/assignments");
  redirect("/portal/assignments?status=updated");
}
