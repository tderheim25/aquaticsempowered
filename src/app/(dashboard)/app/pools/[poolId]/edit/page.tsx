import { Container } from "@mui/material";
import { notFound } from "next/navigation";

import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolForm } from "@/components/pools/PoolForm";
import { updatePoolAction } from "@/app/(dashboard)/app/pools/actions";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { fetchPoolByIdForProfile } from "@/lib/pools/fetchPool";

export default async function EditPoolPage({ params }: { params: Promise<{ poolId: string }> }) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const { poolId } = await params;
  const pool = await fetchPoolByIdForProfile(poolId, profile);
  if (!pool) notFound();

  return (
    <Container maxWidth="md">
      <PoolOpsPageShell title={`Edit ${pool.name}`} accent="pools">
        <PoolForm
          action={updatePoolAction}
          poolId={pool.id}
          defaults={{
            name: pool.name,
            pool_type: pool.pool_type,
            volume_gallons: pool.volume_gallons,
            location_label: pool.location_label,
            notes: pool.notes,
            status: pool.status,
          }}
        />
      </PoolOpsPageShell>
    </Container>
  );
}
