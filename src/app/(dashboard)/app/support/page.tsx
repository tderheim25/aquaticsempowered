import { Alert, Container } from "@mui/material";

import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { getUsersRowForAuthUser, requireProfileForApp } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile, requireViewAccess } from "@/lib/auth/viewPermissions";
import { loadRequesterSupportTickets } from "@/lib/support/loadRequesterTickets";
import { SupportCenterView } from "@/components/support/SupportCenterView";
import { createClient } from "@/lib/supabase/server";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/validations/support";
import type { TaskPriority, TicketStatus, UserRole } from "@/types/database";

export const metadata = {
  title: "Support Center | Aquatics Empowered",
};

type OrgMember = {
  id: string;
  full_name: string | null;
  email: string;
};

function parseOptionalEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function isOrgLead(role: UserRole) {
  return role === "org_admin" || role === "manager";
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewAccess("support_center");
  const profile = await requireProfileForApp();
  const userId = profile.id;
  const facilityOrgId = profile.org_id ?? (await resolveActiveOrgId(profile));
  const canSeeOrgTickets =
    !!facilityOrgId && (isOrgLead(profile.role) || profile.role === "super_admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewsProfile = user ? await getUsersRowForAuthUser(user.id) : null;
  const allowedViews = await getAllowedViewsForProfile(
    viewsProfile ? { role: viewsProfile.role, app_role_id: viewsProfile.app_role_id } : null
  );
  const hasMaintenanceView = allowedViews.includes("maintenance");

  let orgName: string | null = null;
  if (facilityOrgId) {
    const { data: org } = await supabase.from("organizations").select("name").eq("id", facilityOrgId).maybeSingle();
    orgName = org?.name ?? null;
  }

  const sp = await searchParams;
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = raw("q")?.trim() || undefined;
  const status = parseOptionalEnum(raw("status"), TICKET_STATUSES);
  const priority = parseOptionalEnum(raw("priority"), TICKET_PRIORITIES);
  const mineOnly = raw("mine") === "1" || raw("mine") === "true";

  const { tickets, loadWarning } = await loadRequesterSupportTickets(userId, profile.role, facilityOrgId, {
    q,
    status,
    priority,
    mineOnly: mineOnly || !canSeeOrgTickets,
  });

  let orgMembers: OrgMember[] = [];
  if (facilityOrgId) {
    const usersRes = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("org_id", facilityOrgId)
      .order("full_name", { ascending: true });
    orgMembers = (usersRes.data ?? []) as OrgMember[];
  }

  const formDefaults = {
    requester_company_name: orgName ?? "",
    contact_name: profile.full_name?.trim() ?? "",
    phone: "",
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      {loadWarning ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadWarning}
        </Alert>
      ) : null}
      <SupportCenterView
        tickets={tickets}
        orgMembers={orgMembers}
        canSeeOrgTickets={canSeeOrgTickets}
        hasMaintenanceView={hasMaintenanceView}
        formDefaults={formDefaults}
        initialFilters={{
          q: q ?? "",
          status: (status ?? "") as TicketStatus | "",
          priority: (priority ?? "") as TaskPriority | "",
          mine: mineOnly || !canSeeOrgTickets,
        }}
      />
    </Container>
  );
}
