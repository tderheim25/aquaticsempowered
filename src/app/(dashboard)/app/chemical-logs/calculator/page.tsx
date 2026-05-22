import { Alert, Button, Container, MenuItem, Stack, TextField } from "@mui/material";
import Link from "next/link";

import { ChemistryCalculatorPanel } from "@/components/chemistry/ChemistryCalculatorPanel";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { hasFeature } from "@/lib/auth/plans";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import {
  fetchLatestChemicalReadingForPool,
  fetchPoolCalculatorOptionsForOrg,
} from "@/lib/org/fetchOrgScopedData";

export const metadata = { title: "Chemistry calculator | Aquatics Empowered" };

export default async function ChemicalCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ pool_id?: string; org?: string }>;
}) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const { pool_id: poolIdParam, org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell
          title="Chemistry calculator"
          subtitle="Dosing and shock estimates from your latest readings."
          accent="chemistry"
        >
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  if (!hasFeature(orgCtx.planCode, "chemistry_calculator", profile.role)) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell
          title="Chemistry calculator"
          subtitle="Dosing and shock estimates from your latest readings."
          accent="chemistry"
        >
          <Alert severity="info">
            The chemistry calculator is not enabled for this organization&apos;s plan.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        </PoolOpsPageShell>
      </Container>
    );
  }

  const poolOptions = await fetchPoolCalculatorOptionsForOrg(activeOrgId, profile);
  const selectedPoolId = poolIdParam?.trim() || poolOptions[0]?.id || "";
  const selectedPool = poolOptions.find((p) => p.id === selectedPoolId);

  const latestReading = selectedPoolId
    ? await fetchLatestChemicalReadingForPool(activeOrgId, selectedPoolId, profile)
    : null;

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Chemistry calculator"
        subtitle="Informational dosing and breakpoint shock estimates from the latest log per pool."
        accent="chemistry"
        actions={
          <Button component={Link} href="/app/chemical-logs" size="small" variant="outlined">
            Back to logs
          </Button>
        }
      >
        <PoolOpsSectionCard accent="chemistry">
          <form method="get">
            {activeOrgId !== profile.org_id ? <input type="hidden" name="org" value={activeOrgId} /> : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-end" }}>
              <TextField name="pool_id" label="Pool" select size="small" defaultValue={selectedPoolId} sx={{ minWidth: 280 }} required>
                {poolOptions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained">
                Load
              </Button>
            </Stack>
          </form>
        </PoolOpsSectionCard>

        {poolOptions.length === 0 ? (
          <Alert severity="info">Add a pool to use the calculator.</Alert>
        ) : selectedPool ? (
          <ChemistryCalculatorPanel
            poolName={selectedPool.name}
            volumeGallons={selectedPool.volume_gallons}
            targetRanges={selectedPool.target_ranges}
            reading={latestReading}
          />
        ) : null}
      </PoolOpsPageShell>
    </Container>
  );
}
