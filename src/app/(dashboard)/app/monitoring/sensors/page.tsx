import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import {
  DataTable,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { StatusToast, type StatusToastMessages } from "@/components/ui/StatusToast";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { hasFeature } from "@/lib/auth/plans";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";

import { ingestSensorReadingAction } from "../actions";

export const metadata = { title: "Sensor readings | Aquatics Empowered" };

const SENSORS_TOAST_MESSAGES: StatusToastMessages = {
  created: { severity: "success", text: "Reading recorded." },
  forbidden: { severity: "warning", text: "Sensors are not enabled for this organization." },
  invalid: { severity: "error", text: "Check device, metric, and value." },
  error: { severity: "error", text: "Could not save reading." },
};

type SensorRow = {
  id: string;
  device_id: string;
  metric: string;
  value: number;
  unit: string | null;
  recorded_at: string;
  pool_id: string | null;
  pools: { name: string } | { name: string }[] | null;
};

function sensorPoolName(row: SensorRow) {
  const p = row.pools;
  if (Array.isArray(p)) return p[0]?.name ?? "—";
  return p?.name ?? "—";
}

export default async function MonitoringSensorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; org?: string }>;
}) {
  await requireViewAccess("monitoring");
  const profile = await requireProfileForApp();
  const { status, org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;

  const supabase = await createClient();

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Sensors" subtitle="Ingest device telemetry and review recent readings." accent="monitoring">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  if (!hasFeature(orgCtx.planCode, "sensors", profile.role)) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Sensors" subtitle="Ingest device telemetry and review recent readings." accent="monitoring">
          <Alert severity="info">
            Sensor ingest is not enabled for this organization&apos;s plan. Use the API with a bearer token for automated devices.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        </PoolOpsPageShell>
      </Container>
    );
  }

  const { data: pools } = await supabase.from("pools").select("id, name").eq("org_id", activeOrgId).order("name");

  const { data: readings, error } = await supabase
    .from("sensor_readings")
    .select("id, device_id, metric, value, unit, recorded_at, pool_id, pools(name)")
    .eq("org_id", activeOrgId)
    .order("recorded_at", { ascending: false })
    .limit(100);

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Sensors"
        subtitle="Manual ingest for testing; production devices POST to /api/sensors/ingest."
        accent="monitoring"
        actions={
          <Button component={Link} href="/app/monitoring" size="small" variant="outlined">
            Status board
          </Button>
        }
      >
        <StatusToast status={status} messages={SENSORS_TOAST_MESSAGES} />
        {error ? <Alert severity="error">Could not load sensor readings.</Alert> : null}

        <PoolOpsSectionCard accent="monitoring">
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Manual ingest
          </Typography>
          <Box component="form" action={ingestSensorReadingAction}>
            <input type="hidden" name="orgId" value={activeOrgId} />
            <Stack spacing={1.5} sx={{ maxWidth: 480 }}>
              <TextField name="poolId" label="Pool (optional)" select size="small" defaultValue="">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(pools ?? []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField name="deviceId" label="Device ID" size="small" required />
              <TextField name="metric" label="Metric" size="small" required placeholder="ph, temp_f, …" />
              <TextField name="value" label="Value" type="number" size="small" required inputProps={{ step: "any" }} />
              <TextField name="unit" label="Unit" size="small" placeholder="ppm, °F" />
              <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
                Record reading
              </Button>
            </Stack>
          </Box>
        </PoolOpsSectionCard>

        <PoolOpsSectionCard accent="monitoring" index={1} sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Recent readings
          </Typography>
          <DataTable embedded>
            <TableHead>
              <TableRow>
                <TableCell>Recorded</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(readings as SensorRow[] | null)?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <TableDateTimeCell iso={row.recorded_at} />
                  </TableCell>
                  <TableCell>{sensorPoolName(row)}</TableCell>
                  <TableCell>{row.device_id}</TableCell>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell align="right">
                    {row.value}
                    {row.unit ? ` ${row.unit}` : ""}
                  </TableCell>
                </TableRow>
              ))}
              {(!readings || readings.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      No sensor readings yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </DataTable>
        </PoolOpsSectionCard>
      </PoolOpsPageShell>
    </Container>
  );
}
