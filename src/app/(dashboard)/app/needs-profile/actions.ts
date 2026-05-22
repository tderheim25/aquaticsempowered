"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { provisionUserProfileFromSession } from "@/lib/auth/provisionProfile";

export async function completeAccountSetupAction() {
  const profile = await provisionUserProfileFromSession();
  if (!profile) {
    redirect("/app/needs-profile?status=failed");
  }
  revalidatePath("/app");
  if (profile.role === "support_technician") {
    redirect("/portal/queue");
  }
  if (profile.role === "super_admin") {
    redirect("/app");
  }
  redirect(profile.org_id ? "/app" : "/app/no-organization");
}
