"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  consoleSectionUrl,
  getSuperAdminPortalPath,
  requireSuperAdminConsole,
} from "@/lib/auth/superAdminPortal";
import { createAdminClient } from "@/lib/supabase/admin";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateDemoRequestEmailAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();

  const raw = String(formData.get("demo_request_email") ?? "").trim();
  if (raw && !isValidEmail(raw)) {
    redirect(consoleSectionUrl("settings", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert(
      {
        key: "demo_request_email",
        value: { email: raw },
        description: "Inbox that receives founder demo-request notifications.",
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      },
      { onConflict: "key" },
    );

  if (error) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("settings", { status: "settings_saved" }));
}
