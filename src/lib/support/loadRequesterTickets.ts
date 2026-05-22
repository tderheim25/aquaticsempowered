import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TicketStatus, UserRole } from "@/types/database";
import type { Database } from "@/types/database";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

export type RequesterTicketFilters = {
  q?: string;
  status?: TicketStatus;
  priority?: TaskPriority;
  mineOnly?: boolean;
};

function isStackDepthError(message: string | undefined) {
  return (message ?? "").toLowerCase().includes("stack depth");
}

function mergeTickets(mine: SupportTicketRow[], org: SupportTicketRow[]) {
  const byId = new Map<string, SupportTicketRow>();
  for (const t of org) byId.set(t.id, t);
  for (const t of mine) byId.set(t.id, t);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function canUseAdminOrgRead(role: UserRole) {
  return role === "super_admin" || role === "org_admin" || role === "manager";
}

/**
 * Loads tickets visible on /app/support for requesters (not the technician queue).
 */
export async function loadRequesterSupportTickets(
  userId: string,
  role: UserRole,
  orgId: string | null,
  filters: RequesterTicketFilters
): Promise<{ tickets: SupportTicketRow[]; loadWarning?: string }> {
  const supabase = await createClient();

  let mineQuery = supabase.from("support_tickets").select("*").eq("created_by", userId);
  if (filters.q) mineQuery = mineQuery.ilike("subject", `%${filters.q}%`);
  if (filters.status) mineQuery = mineQuery.eq("status", filters.status);
  if (filters.priority) mineQuery = mineQuery.eq("priority", filters.priority);

  const mineRes = await mineQuery.order("created_at", { ascending: false });
  if (mineRes.error && !isStackDepthError(mineRes.error.message)) {
    return { tickets: [], loadWarning: mineRes.error.message };
  }

  const mineTickets = (mineRes.data ?? []) as SupportTicketRow[];

  if (!orgId || filters.mineOnly) {
    return { tickets: mineTickets };
  }

  if (!canUseAdminOrgRead(role)) {
    return { tickets: mineTickets };
  }

  let orgQuery = supabase.from("support_tickets").select("*").eq("org_id", orgId);
  if (filters.q) orgQuery = orgQuery.ilike("subject", `%${filters.q}%`);
  if (filters.status) orgQuery = orgQuery.eq("status", filters.status);
  if (filters.priority) orgQuery = orgQuery.eq("priority", filters.priority);

  let orgRes = await orgQuery.order("created_at", { ascending: false });

  if (orgRes.error && isStackDepthError(orgRes.error.message) && canUseAdminOrgRead(role)) {
    const admin = createAdminClient();
    let adminQuery = admin.from("support_tickets").select("*").eq("org_id", orgId);
    if (filters.q) adminQuery = adminQuery.ilike("subject", `%${filters.q}%`);
    if (filters.status) adminQuery = adminQuery.eq("status", filters.status);
    if (filters.priority) adminQuery = adminQuery.eq("priority", filters.priority);
    orgRes = await adminQuery.order("created_at", { ascending: false });
  }

  if (orgRes.error) {
    return {
      tickets: mineTickets,
      loadWarning:
        mineTickets.length > 0
          ? "Showing only your requests. Run migrations 0029_fix_rls_stack_depth.sql and 0030_tickets_rls_jwt_org.sql in Supabase to load all organization tickets."
          : orgRes.error.message,
    };
  }

  return { tickets: mergeTickets(mineTickets, (orgRes.data ?? []) as SupportTicketRow[]) };
}
