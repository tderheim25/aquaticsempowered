import { Alert, CircularProgress, Container, Stack } from "@mui/material";
import { Suspense } from "react";

import { MaintenanceView } from "@/components/maintenance/MaintenanceView";
import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/validations/maintenance";
import type { Database, TaskCategory, TaskPriority, TaskStatus } from "@/types/database";

export const metadata = {
  title: "Maintenance | Aquatics Empowered",
};

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = {
  id: string;
  full_name: string | null;
  email: string;
};

function parseView(v: string | undefined) {
  return v === "kanban" ? "kanban" : "list";
}

function parseOptionalEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function isUuid(value: string | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewAccess("maintenance");

  const sp = await searchParams;
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const profile = await requireOrg(raw("org"));
  const orgId = profile.org_id!;
  const userId = profile.id;

  const view = parseView(raw("view"));
  const q = raw("q")?.trim() || undefined;
  const status = parseOptionalEnum(raw("status"), TASK_STATUSES);
  const priority = parseOptionalEnum(raw("priority"), TASK_PRIORITIES);
  const category = parseOptionalEnum(raw("category"), TASK_CATEGORIES);
  const assigneeRaw = raw("assignee");
  const assignee = isUuid(assigneeRaw) ? assigneeRaw : undefined;
  const mine = raw("mine") === "1" || raw("mine") === "true";
  const poolRaw = raw("pool");
  const poolFilter = isUuid(poolRaw) ? poolRaw : undefined;

  const supabase = await createClient();

  let tasksQuery = supabase.from("maintenance_tasks").select("*").eq("org_id", orgId);

  if (q) {
    tasksQuery = tasksQuery.ilike("title", `%${q}%`);
  }
  if (status) {
    tasksQuery = tasksQuery.eq("status", status);
  }
  if (priority) {
    tasksQuery = tasksQuery.eq("priority", priority);
  }
  if (category) {
    tasksQuery = tasksQuery.eq("category", category);
  }
  if (mine) {
    tasksQuery = tasksQuery.eq("assigned_to", userId);
  } else if (assignee) {
    tasksQuery = tasksQuery.eq("assigned_to", assignee);
  }
  if (poolFilter) {
    tasksQuery = tasksQuery.eq("pool_id", poolFilter);
  }

  tasksQuery = tasksQuery.order("updated_at", { ascending: false });

  const [tasksRes, usersRes, poolsRes] = await Promise.all([
    tasksQuery,
    supabase.from("users").select("id, full_name, email").eq("org_id", orgId).order("full_name", { ascending: true }),
    supabase.from("pools").select("id, name").eq("org_id", orgId).order("name", { ascending: true }),
  ]);

  const tasks = (tasksRes.data ?? []) as MaintenanceTaskRow[];
  const orgMembers = (usersRes.data ?? []) as OrgMember[];
  const pools = (poolsRes.data ?? []) as { id: string; name: string }[];

  if (tasksRes.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="error">
          Could not load maintenance tasks. If you just added this feature, run migration{" "}
          <code>0006_maintenance_extensions.sql</code> in Supabase. ({tasksRes.error.message})
        </Alert>
      </Container>
    );
  }

  return (
    <Suspense
      fallback={
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Stack alignItems="center">
            <CircularProgress />
          </Stack>
        </Container>
      }
    >
      <MaintenanceView
        tasks={tasks}
        orgMembers={orgMembers}
        pools={pools}
        initialView={view}
        initialFilters={{
          q: q ?? "",
          status: (status ?? "") as TaskStatus | "",
          priority: (priority ?? "") as TaskPriority | "",
          category: (category ?? "") as TaskCategory | "",
          assignee: assignee ?? "",
          mine,
          pool: poolFilter ?? "",
        }}
      />
    </Suspense>
  );
}
