import { Alert, Container } from "@mui/material";

import { getUsersRowForAuthUser, requireOrg } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { getAllowedViewsForProfile, requireViewAccess } from "@/lib/auth/viewPermissions";
import { SupportCenterView } from "@/components/support/SupportCenterView";
import { createClient } from "@/lib/supabase/server";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/validations/support";
import type { Database, PlanCode, TaskPriority, TicketStatus } from "@/types/database";

export const metadata = {
  title: "Support Center | Aquatics Empowered",
};

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

type OrgMember = {
  id: string;
  full_name: string | null;
  email: string;
};

function parseOptionalEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewAccess("support_center");
  const profile = await requireOrg();
  const orgId = profile.org_id!;
  const userId = profile.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewsProfile = user ? await getUsersRowForAuthUser(user.id) : null;
  const allowedViews = await getAllowedViewsForProfile(
    viewsProfile ? { role: viewsProfile.role, app_role_id: viewsProfile.app_role_id } : null
  );
  const hasMaintenanceView = allowedViews.includes("maintenance");

  const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", orgId).maybeSingle();
  const planCode = (org?.plan_code as PlanCode) ?? "free";
  const supportEnabled = hasFeature(planCode, "support");

  const sp = await searchParams;
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = raw("q")?.trim() || undefined;
  const status = parseOptionalEnum(raw("status"), TICKET_STATUSES);
  const priority = parseOptionalEnum(raw("priority"), TICKET_PRIORITIES);
  const mine = raw("mine") === "1" || raw("mine") === "true";

  let tickets: SupportTicketRow[] = [];
  let orgMembers: OrgMember[] = [];

  if (supportEnabled) {
    const [ticketsRes, usersRes] = await Promise.all([
      (async () => {
        let ticketsQuery = supabase.from("support_tickets").select("*").eq("org_id", orgId);

        if (q) {
          ticketsQuery = ticketsQuery.ilike("subject", `%${q}%`);
        }
        if (status) {
          ticketsQuery = ticketsQuery.eq("status", status);
        }
        if (priority) {
          ticketsQuery = ticketsQuery.eq("priority", priority);
        }
        if (mine) {
          ticketsQuery = ticketsQuery.eq("created_by", userId);
        }

        return ticketsQuery.order("created_at", { ascending: false });
      })(),
      supabase.from("users").select("id, full_name, email").eq("org_id", orgId).order("full_name", { ascending: true }),
    ]);

    tickets = (ticketsRes.data ?? []) as SupportTicketRow[];
    orgMembers = (usersRes.data ?? []) as OrgMember[];

    if (ticketsRes.error) {
      return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Alert severity="error">Could not load support tickets. ({ticketsRes.error.message})</Alert>
        </Container>
      );
    }
  }

  return (
    <SupportCenterView
      tickets={tickets}
      orgMembers={orgMembers}
      supportEnabled={supportEnabled}
      hasMaintenanceView={hasMaintenanceView}
      initialFilters={{
        q: q ?? "",
        status: (status ?? "") as TicketStatus | "",
        priority: (priority ?? "") as TaskPriority | "",
        mine,
      }}
    />
  );
}
