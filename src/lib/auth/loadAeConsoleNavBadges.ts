import type { AeConsoleNavBadges } from "@/components/super-admin/AeConsoleNav";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadAeConsoleNavBadges(): Promise<AeConsoleNavBadges> {
  const admin = createAdminClient();

  const [vendorPending, ticketsOpen] = await Promise.all([
    admin.from("vendor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "pending"]),
  ]);

  return {
    vendors: vendorPending.count ?? 0,
    support: ticketsOpen.count ?? 0,
  };
}
