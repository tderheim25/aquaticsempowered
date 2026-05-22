import { notFound } from "next/navigation";

import { requireViewAccess } from "@/lib/auth/viewPermissions";

export async function requireSupportTechnicianRole() {
  const profile = await requireViewAccess("support_portal");
  if (profile.role !== "support_technician") {
    notFound();
  }
  return profile;
}
