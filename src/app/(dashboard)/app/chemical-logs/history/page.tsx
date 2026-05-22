import { Alert, Button, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";

import { ChemistryTrendChart } from "@/components/chemistry/ChemistryTrendChart";
import { fetchChemicalTrendLogsForOrg, fetchPoolOptionsForOrg } from "@/lib/org/fetchOrgScopedData";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
export const metadata = { title: "Chemistry trends | Aquatics Empowered" };

const DAY_OPTIONS = [7, 30, 90] as const;

export default async function ChemicalLogsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ pool_id?: string; days?: string; org?: string }>;
}) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const { pool_id: poolIdParam, days: daysParam, org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="History & trends" subtitle="Charts from your logged readings." accent="chemistry">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  const days = DAY_OPTIONS.includes(Number(daysParam) as (typeof DAY_OPTIONS)[number])
    ? Number(daysParam)
    : 30;

  const poolOptions = await fetchPoolOptionsForOrg(activeOrgId, profile);
  const selectedPoolId = poolIdParam?.trim() || poolOptions[0]?.id || "";

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { points, error } = await fetchChemicalTrendLogsForOrg(activeOrgId, profile, {
    poolId: selectedPoolId || undefined,
    since: since.toISOString(),
  });

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Chemistry trends"
        subtitle="Rolling history for pH, sanitizer, alkalinity, temperature, and LSI."
        accent="chemistry"
        actions={
          <Button component={Link} href="/app/chemical-logs" size="small" variant="outlined">
            Back to logs
          </Button>
        }
      >
        {error ? <Alert severity="error">Could not load trend data.</Alert> : null}

        <PoolOpsSectionCard accent="chemistry">
          <form method="get">
            {activeOrgId !== profile.org_id ? <input type="hidden" name="org" value={activeOrgId} /> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
              <TextField name="pool_id" label="Pool" select size="small" defaultValue={selectedPoolId} sx={{ minWidth: 240 }} required>
                {poolOptions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField name="days" label="Window" select size="small" defaultValue={String(days)} sx={{ minWidth: 120 }}>
                {DAY_OPTIONS.map((d) => (
                  <MenuItem key={d} value={String(d)}>
                    {d} days
                  </MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained">
                Update chart
              </Button>
            </Stack>
          </form>
        </PoolOpsSectionCard>

        {poolOptions.length === 0 ? (
          <Alert severity="info">Add a pool to view trends.</Alert>
        ) : (
          <PoolOpsSectionCard accent="chemistry" index={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {points.length} readings in the last {days} days
            </Typography>
            <ChemistryTrendChart points={points} />
          </PoolOpsSectionCard>
        )}
      </PoolOpsPageShell>
    </Container>
  );
}
