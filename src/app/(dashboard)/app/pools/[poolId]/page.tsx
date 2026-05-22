import { Alert, Container } from "@mui/material";
import { notFound } from "next/navigation";

import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolDetailTabs } from "@/components/pools/PoolDetailTabs";
import {
  deletePoolAction,
  updatePoolTargetsAction,
} from "@/app/(dashboard)/app/pools/actions";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { fetchPoolByIdForProfile, fetchPoolEquipmentForProfile } from "@/lib/pools/fetchPool";

export const metadata = { title: "Pool | Aquatics Empowered" };

export default async function PoolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const { poolId } = await params;
  const { status } = await searchParams;

  const pool = await fetchPoolByIdForProfile(poolId, profile);
  if (!pool) notFound();

  const equipment = await fetchPoolEquipmentForProfile(poolId, profile, pool.org_id);

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell title={pool.name} subtitle={pool.location_label ?? undefined} accent="pools">
        {status === "created" && <Alert severity="success">Pool created.</Alert>}
        {status === "updated" && <Alert severity="success">Saved.</Alert>}
        <PoolDetailTabs
          pool={pool}
          equipment={equipment ?? []}
          updateTargetsAction={updatePoolTargetsAction}
          deleteAction={deletePoolAction}
        />
      </PoolOpsPageShell>
    </Container>
  );
}
