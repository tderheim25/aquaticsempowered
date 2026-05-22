import { Alert, Container } from "@mui/material";

import { InspectionLogsView } from "@/components/maintenance/InspectionLogsView";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata = { title: "Inspections | Aquatics Empowered" };

type InspectionLogRow = Database["public"]["Tables"]["inspection_logs"]["Row"];

function isUuid(value: string | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewAccess("maintenance");
  const sp = await searchParams;
  const orgParam = Array.isArray(sp.org) ? sp.org[0] : sp.org;
  const profile = await requireOrg(orgParam);
  const orgId = profile.org_id!;
  const poolRaw = Array.isArray(sp.pool) ? sp.pool[0] : sp.pool;
  const poolFilter = isUuid(poolRaw) ? poolRaw : undefined;

  const supabase = await createClient();
  const { data: pools } = await supabase.from("pools").select("id, name").eq("org_id", orgId).order("name");

  const poolList = pools ?? [];
  const activePoolId = poolFilter && poolList.some((p) => p.id === poolFilter) ? poolFilter : poolList[0]?.id;

  let logsQuery = supabase.from("inspection_logs").select("*").eq("org_id", orgId).order("inspected_at", { ascending: false }).limit(100);
  if (activePoolId) {
    logsQuery = logsQuery.eq("pool_id", activePoolId);
  }

  const { data: logs, error } = await logsQuery;
  const poolNames = Object.fromEntries(poolList.map((p) => [p.id, p.name]));

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="error">Could not load inspections. ({error.message})</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Inspections"
        subtitle="Run opening and safety checklists from standard templates."
        accent="maintenance"
      >
        <InspectionLogsView logs={(logs ?? []) as InspectionLogRow[]} pools={poolList} poolNames={poolNames} />
      </PoolOpsPageShell>
    </Container>
  );
}
