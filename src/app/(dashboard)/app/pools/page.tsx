import { Alert, Container } from "@mui/material";

import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { EmptyStateIllustration } from "@/components/pool-ops/EmptyStateIllustration";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { AddPoolModal } from "@/components/pools/AddPoolModal";
import { PoolsList, type PoolListItem } from "@/components/pools/PoolsList";
import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { fetchLastReadingByPool, fetchPoolsForOrg } from "@/lib/pools/fetchPool";

export const metadata = { title: "Pools | Aquatics Empowered" };

export default async function PoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; org?: string; add?: string }>;
}) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const { status, org, add } = await searchParams;

  const activeOrgId = await resolveActiveOrgId(profile, org);

  if (!activeOrgId) {
    return (
      <Container maxWidth="xl">
        <PoolOpsPageShell title="Pools" subtitle="Register pools and spas for your facility.">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  const pools = await fetchPoolsForOrg(activeOrgId, profile);
  const poolIds = pools.map((p) => p.id);
  const lastByPool = await fetchLastReadingByPool(activeOrgId, poolIds, profile);

  const list: PoolListItem[] = pools.map((p) => ({
    ...p,
    lastReadingAt: lastByPool.get(p.id) ?? null,
  }));

  const reopenModal = add === "1" || status === "invalid" || status === "error";

  return (
    <Container maxWidth="xl">
      <PoolOpsPageShell
        title="Pools"
        subtitle="Register pools and spas for your facility."
        actions={
          <AddPoolModal orgId={activeOrgId} status={status} defaultOpen={reopenModal} />
        }
      >
        {status === "created" && <Alert severity="success">Pool created.</Alert>}
        {status === "deleted" && <Alert severity="success">Pool deleted.</Alert>}
        {list.length === 0 ? (
          <EmptyStateIllustration
            title="No pools yet"
            description="Add your first pool to link chemical logs, maintenance, and monitoring."
            action={<AddPoolModal orgId={activeOrgId} status={status} />}
          />
        ) : (
          <PoolsList pools={list} />
        )}
      </PoolOpsPageShell>
    </Container>
  );
}
