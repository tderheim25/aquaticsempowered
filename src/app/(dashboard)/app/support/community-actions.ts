"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export async function createCommunitySupportTicketAction(formData: FormData) {
  const profile = await requireProfileForApp();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");

  if (!subject || subject.length < 3) {
    redirect("/community?support=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").insert({
    org_id: profile.org_id,
    source: "community",
    subject,
    body: body || null,
    priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
    created_by: profile.id,
  });

  if (error) {
    redirect("/community?support=error");
  }

  revalidatePath("/community");
  redirect("/community?support=submitted");
}
