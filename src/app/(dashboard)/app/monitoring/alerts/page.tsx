import {
  Alert,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { hasFeature } from "@/lib/auth/plans";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { evaluateChemicalAttention, type AttentionReason } from "@/lib/water/evaluateReading";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Monitoring alerts | Aquatics Empowered" };

function reasonLabel(r: AttentionReason) {
  switch (r) {
    case "ph":
      return "pH";
    case "free_chlorine":
      return "Free chlorine";
    case "combined_chlorine":
      return "Combined chlorine";
    case "lsi":
      return "LSI";
    default:
      return r;
  }
}

export default async function MonitoringAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  await requireViewAccess("monitoring");
  const profile = await requireProfileForApp();
  const { org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;

  const supabase = await createClient();

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Monitoring alerts" subtitle="Pools that need attention on latest readings." accent="monitoring">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  if (!hasFeature(orgCtx.planCode, "monitoring", profile.role)) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning">Monitoring alerts are not enabled for this organization&apos;s plan.</Alert>
      </Container>
    );
  }

  const { data: pools } = await supabase
    .from("pools")
    .select("id, name, target_ranges")
    .eq("org_id", activeOrgId)
    .order("name");

  const poolList = pools ?? [];
  const poolIds = poolList.map((p) => p.id);
  const latestByPool = new Map<
    string,
    {
      ph: number | null;
      free_chlorine: number | null;
      total_chlorine: number | null;
      langelier_saturation_index: number | null;
      logged_at: string;
    }
  >();

  if (poolIds.length > 0) {
    const { data: logs } = await supabase
      .from("chemical_logs")
      .select("pool_id, ph, free_chlorine, total_chlorine, langelier_saturation_index, logged_at")
      .eq("org_id", activeOrgId)
      .in("pool_id", poolIds)
      .order("logged_at", { ascending: false })
      .limit(500);

    for (const log of logs ?? []) {
      if (log.pool_id && !latestByPool.has(log.pool_id)) {
        latestByPool.set(log.pool_id, log);
      }
    }
  }

  const rows = poolList.map((pool) => {
    const log = latestByPool.get(pool.id);
    const reasons = log
      ? evaluateChemicalAttention({ ...log, target_ranges: pool.target_ranges })
      : [];
    return { pool, log, reasons };
  });

  const attentionRows = rows.filter((r) => r.reasons.length > 0);

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Monitoring alerts"
        subtitle="Latest reading per pool evaluated against facility target ranges."
        accent="monitoring"
        actions={
          <Button component={Link} href="/app/monitoring" size="small" variant="outlined">
            Status board
          </Button>
        }
      >
        <PoolOpsSectionCard accent="monitoring">
          <DataTable embedded>
            <TableHead>
              <TableRow>
                <TableCell>Pool</TableCell>
                <TableCell align="right">pH</TableCell>
                <TableCell align="right">FC</TableCell>
                <TableCell align="right">TC</TableCell>
                <TableCell align="right">LSI</TableCell>
                <TableCell>Logged</TableCell>
                <TableCell>Flags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attentionRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      No pools need review on their latest reading.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attentionRows.map(({ pool, log, reasons }) => (
                  <TableRow key={pool.id}>
                    <TableCell>{pool.name}</TableCell>
                    <TableCell align="right">{log?.ph ?? "—"}</TableCell>
                    <TableCell align="right">{log?.free_chlorine ?? "—"}</TableCell>
                    <TableCell align="right">{log?.total_chlorine ?? "—"}</TableCell>
                    <TableCell align="right">{log?.langelier_saturation_index ?? "—"}</TableCell>
                    <TableCell>{log ? <TableDateTimeCell iso={log.logged_at} /> : "—"}</TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {reasons.map((r) => (
                          <StatusPill key={r} label={reasonLabel(r)} tone="warning" size="small" />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </PoolOpsSectionCard>

        {rows.some((r) => !r.log) ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Pools without any chemical log are omitted from this table.
          </Alert>
        ) : null}
      </PoolOpsPageShell>
    </Container>
  );
}
