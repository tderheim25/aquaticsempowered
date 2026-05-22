import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { LsiGauge } from "@/components/pool-ops/LsiGauge";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { StatusChip } from "@/components/pool-ops/StatusChip";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { hasFeature } from "@/lib/auth/plans";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { evaluateChemicalAttention } from "@/lib/water/evaluateReading";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Monitoring | Aquatics Empowered" };

type LatestLog = {
  pool_id: string;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  langelier_saturation_index: number | null;
  logged_at: string;
};

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  await requireViewAccess("monitoring");
  const profile = await requireProfileForApp();
  const { org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;
  const monitoringUnlocked = hasFeature(orgCtx.planCode, "monitoring", profile.role);

  const supabase = await createClient();

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Monitoring" subtitle="Org-wide water-quality status board." accent="monitoring">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  if (!monitoringUnlocked) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Monitoring" subtitle="Org-wide water-quality status board." accent="monitoring">
          <Alert severity="info">
            Monitoring is not enabled for this organization&apos;s plan.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        </PoolOpsPageShell>
      </Container>
    );
  }

  const { data: pools } = await supabase
    .from("pools")
    .select("id, name, target_ranges, status")
    .eq("org_id", activeOrgId)
    .order("name");

  const poolList = pools ?? [];
  const poolIds = poolList.map((p) => p.id);

  const latestByPool = new Map<string, LatestLog>();
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
        latestByPool.set(log.pool_id, log as LatestLog);
      }
    }
  }

  const { data: openTasks } = await supabase
    .from("maintenance_tasks")
    .select("pool_id")
    .eq("org_id", activeOrgId)
    .in("status", ["open", "in_progress"])
    .not("pool_id", "is", null);

  const openCountByPool = new Map<string, number>();
  for (const t of openTasks ?? []) {
    if (!t.pool_id) continue;
    openCountByPool.set(t.pool_id, (openCountByPool.get(t.pool_id) ?? 0) + 1);
  }

  let attentionCount = 0;

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Monitoring"
        subtitle="Status board per pool — latest chemistry, LSI, and open maintenance work."
        accent="monitoring"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button component={Link} href="/app/monitoring/alerts" size="small" variant="outlined">
              Alerts
            </Button>
            {hasFeature(orgCtx.planCode, "sensors", profile.role) ? (
              <Button component={Link} href="/app/monitoring/sensors" size="small" variant="outlined">
                Sensors
              </Button>
            ) : null}
            <Button component={Link} href="/app/chemical-logs" size="small" variant="outlined">
              Chemical logs
            </Button>
          </Stack>
        }
      >
        {poolList.length === 0 ? (
          <Alert severity="info">
            No pools registered.{" "}
            <MuiLink component={Link} href="/app/pools?add=1">
              Add a pool
            </MuiLink>{" "}
            to populate monitoring.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {poolList.map((pool, index) => {
              const log = latestByPool.get(pool.id);
              const reasons = log
                ? evaluateChemicalAttention({ ...log, target_ranges: pool.target_ranges })
                : [];
              const needsAttention = reasons.length > 0;
              if (needsAttention) attentionCount += 1;
              const openTasksCount = openCountByPool.get(pool.id) ?? 0;

              return (
                <Grid key={pool.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <PoolOpsSectionCard accent="monitoring" index={index}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {pool.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pool.status}
                          </Typography>
                        </Box>
                        {needsAttention ? <StatusChip status="high" label="Review" /> : <StatusChip status="in_range" label="OK" />}
                      </Stack>

                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <LsiGauge lsi={log?.langelier_saturation_index ?? null} size={96} />
                      </Box>

                      {log ? (
                        <Typography variant="body2" color="text.secondary">
                          pH {log.ph ?? "—"} · FC {log.free_chlorine ?? "—"} ppm
                          <br />
                          Last log {new Date(log.logged_at).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No readings yet
                        </Typography>
                      )}

                      <Typography variant="body2">
                        Open tasks: <strong>{openTasksCount}</strong>
                      </Typography>

                      {needsAttention ? (
                        <Typography variant="caption" color="warning.main">
                          {reasons.join(", ")}
                        </Typography>
                      ) : null}

                      <Button component={Link} href={`/app/chemical-logs?pool_id=${pool.id}`} size="small" variant="text">
                        View logs
                      </Button>
                    </Stack>
                  </PoolOpsSectionCard>
                </Grid>
              );
            })}
          </Grid>
        )}

        {poolList.length > 0 ? (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {attentionCount} of {poolList.length} pools flagged on latest reading. See{" "}
                <MuiLink component={Link} href="/app/monitoring/alerts">
                  alerts
                </MuiLink>{" "}
                for detail.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </PoolOpsPageShell>
    </Container>
  );
}
