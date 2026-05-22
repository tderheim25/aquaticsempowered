import { Alert, Button, Container, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";

import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { hasFeature } from "@/lib/auth/plans";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";

export const metadata = { title: "Chemistry reports | Aquatics Empowered" };

function defaultMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function ChemicalReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const { org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;
  const orgName = orgCtx.activeOrgName ?? "Organization";

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Chemistry reports" subtitle="Monthly PDF exports for audit and health inspections." accent="chemistry">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  if (!hasFeature(orgCtx.planCode, "chemistry_reports", profile.role)) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Chemistry reports" subtitle="Monthly PDF exports for audit and health inspections." accent="chemistry">
          <Alert severity="info">
            Monthly chemistry reports are not enabled for this organization&apos;s plan.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        </PoolOpsPageShell>
      </Container>
    );
  }

  const monthDefault = defaultMonth();

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Chemistry reports"
        subtitle={`Download a PDF of all readings for ${orgName} by calendar month.`}
        accent="chemistry"
        actions={
          <Button component={Link} href="/app/chemical-logs" size="small" variant="outlined">
            Back to logs
          </Button>
        }
      >
        <PoolOpsSectionCard accent="chemistry">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Exports include pool name, core chemistry fields, and LSI for each log in the selected month.
          </Typography>
          <Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }} action="/app/chemical-logs/reports/export" method="get" target="_blank">
            {activeOrgId !== profile.org_id ? <input type="hidden" name="org" value={activeOrgId} /> : null}
            <TextField
              name="month"
              label="Month"
              type="month"
              size="small"
              defaultValue={monthDefault}
              required
              InputLabelProps={{ shrink: true }}
            />
            <Button type="submit" variant="contained">
              Download PDF
            </Button>
          </Stack>
        </PoolOpsSectionCard>
      </PoolOpsPageShell>
    </Container>
  );
}
