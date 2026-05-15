import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Monitoring | Aquatics Empowered",
};

type ChemicalLogRow = {
  id: string;
  pool_label: string | null;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  langelier_saturation_index: number | null;
  logged_at: string;
};

type AttentionReason = "ph" | "free_chlorine" | "combined_chlorine" | "lsi";

function evaluateReading(log: ChemicalLogRow): { attention: boolean; reasons: AttentionReason[] } {
  const reasons: AttentionReason[] = [];

  if (log.ph != null && (log.ph < 7.2 || log.ph > 7.8)) {
    reasons.push("ph");
  }

  if (log.free_chlorine != null && (log.free_chlorine < 1 || log.free_chlorine > 5)) {
    reasons.push("free_chlorine");
  }

  if (
    log.free_chlorine != null &&
    log.total_chlorine != null &&
    log.total_chlorine >= log.free_chlorine &&
    log.total_chlorine - log.free_chlorine > 0.5
  ) {
    reasons.push("combined_chlorine");
  }

  if (log.langelier_saturation_index != null && (log.langelier_saturation_index < -0.5 || log.langelier_saturation_index > 0.5)) {
    reasons.push("lsi");
  }

  return { attention: reasons.length > 0, reasons };
}

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

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  await requireViewAccess("monitoring");
  const profile = await requireProfileForApp();
  const { org } = await searchParams;
  const isSuperAdmin = profile.role === "super_admin";

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: orgOptions } =
    isSuperAdmin && !profile.org_id
      ? await admin.from("organizations").select("id, name").order("name", { ascending: true }).limit(200)
      : { data: [] as { id: string; name: string }[] };

  const activeOrgId = profile.org_id ?? (isSuperAdmin ? (org?.trim() || orgOptions?.[0]?.id || null) : null);

  let planCode: PlanCode = "free";
  if (profile.org_id) {
    const { data: orgRow } = await supabase.from("organizations").select("plan_code").eq("id", profile.org_id).maybeSingle();
    planCode = (orgRow?.plan_code as PlanCode) ?? "free";
  } else if (activeOrgId) {
    const { data: orgRow } = await admin.from("organizations").select("plan_code").eq("id", activeOrgId).maybeSingle();
    planCode = (orgRow?.plan_code as PlanCode) ?? "free";
  }

  const monitoringUnlocked = hasFeature(planCode, "monitoring");

  if (!activeOrgId) {
    const hasOrgOptions = Boolean(orgOptions && orgOptions.length > 0);
    return (
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Water-quality attention summary based on your organization&apos;s chemical logs. Choose an organization to
              review recent readings.
            </Typography>
          </Box>
          {!monitoringUnlocked ? (
            <Alert severity="info">
              Live monitoring dashboards and alerting are included on the Enterprise plan.{" "}
              <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
                View plans
              </Button>
            </Alert>
          ) : null}
          <Alert severity="warning">
            {isSuperAdmin
              ? "Pick an organization to load monitoring data."
              : "Your account is not linked to an organization yet."}
          </Alert>
          {isSuperAdmin && hasOrgOptions ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack component="form" direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
                <TextField name="org" label="Organization" select size="small" defaultValue="" sx={{ minWidth: 260 }}>
                  <MenuItem value="">
                    <em>Select…</em>
                  </MenuItem>
                  {(orgOptions ?? []).map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="outlined">
                  Open monitoring
                </Button>
              </Stack>
            </Paper>
          ) : null}
          {isSuperAdmin && !hasOrgOptions ? (
            <Alert severity="info">No organizations exist yet. Create an organization first.</Alert>
          ) : null}
        </Stack>
      </Container>
    );
  }

  if (!monitoringUnlocked) {
    return (
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enterprise includes prioritized views of chemistry trends, out-of-range readings, and support for future
              integrations (sensors, ticketing, and scheduled digests).
            </Typography>
          </Box>
          <Alert severity="info">
            Your current plan does not include the monitoring workspace. Upgrade to Enterprise for org-wide water-quality
            oversight.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                What you get on Enterprise
              </Typography>
              <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Attention panel for pH, sanitizer, combined chlorine, and Langelier Saturation Index thresholds.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Rolling history tied to{" "}
                  <MuiLink component={Link} href="/app/chemical-logs">
                    Chemical Logs
                  </MuiLink>{" "}
                  — no duplicate data entry.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Roadmap: email or in-app alerts, per-venue targets, and exportable audit trails.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { data: logs, error: logsError } = await supabase
    .from("chemical_logs")
    .select(
      "id, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, langelier_saturation_index, logged_at"
    )
    .eq("org_id", activeOrgId)
    .gte("logged_at", sinceIso)
    .order("logged_at", { ascending: false })
    .limit(400);

  const rows = (logs ?? []) as ChemicalLogRow[];
  const evaluated = rows.map((log) => ({ log, ...evaluateReading(log) }));
  const attentionRows = evaluated.filter((e) => e.attention);
  const poolKeys = new Set(rows.map((r) => r.pool_label?.trim() || "Unlabeled pool"));
  const lastReadingByPool = new Map<string, ChemicalLogRow>();
  for (const log of rows) {
    const key = log.pool_label?.trim() || "Unlabeled pool";
    if (!lastReadingByPool.has(key)) {
      lastReadingByPool.set(key, log);
    }
  }
  let venuesLatestNeedReview = 0;
  for (const log of lastReadingByPool.values()) {
    if (evaluateReading(log).attention) venuesLatestNeedReview += 1;
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Last 30 days of chemical logs, highlighted when readings fall outside common operating bands (pH 7.2–7.8,
            free chlorine 1–5 ppm, combined chlorine &gt; 0.5 ppm, LSI outside −0.5 to +0.5). Adjust targets with your
            local health authority and facility SOPs.
          </Typography>
        </Box>

        {isSuperAdmin && !profile.org_id && orgOptions && orgOptions.length > 0 ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack component="form" direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
              <TextField
                name="org"
                label="View as organization"
                select
                size="small"
                defaultValue={activeOrgId ?? ""}
                sx={{ minWidth: 260 }}
              >
                {(orgOptions ?? []).map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="outlined">
                Apply
              </Button>
            </Stack>
          </Paper>
        ) : null}

        {logsError ? (
          <Alert severity="error">Unable to load chemical logs. Check your connection and try again.</Alert>
        ) : null}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Pools / venues
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {poolKeys.size}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distinct labels in the window
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Readings (30 d)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {rows.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Up to 400 most recent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Attention events
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: attentionRows.length ? "warning.main" : "text.primary" }}>
                  {attentionRows.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Log rows with one or more flags
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Venues needing review
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: venuesLatestNeedReview ? "warning.main" : "text.primary" }}>
                  {venuesLatestNeedReview}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest log per venue matches attention rules
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Latest reading per venue
            </Typography>
            {lastReadingByPool.size === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No chemical logs in the last 30 days.{" "}
                <MuiLink component={Link} href="/app/chemical-logs">
                  Add readings in Chemical Logs
                </MuiLink>{" "}
                to populate monitoring.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Venue</TableCell>
                    <TableCell align="right">pH</TableCell>
                    <TableCell align="right">FC (ppm)</TableCell>
                    <TableCell align="right">LSI</TableCell>
                    <TableCell>Logged</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...lastReadingByPool.entries()]
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([pool, log]) => {
                      const { attention, reasons } = evaluateReading(log);
                      return (
                        <TableRow key={pool}>
                          <TableCell>{pool}</TableCell>
                          <TableCell align="right">{log.ph ?? "—"}</TableCell>
                          <TableCell align="right">{log.free_chlorine ?? "—"}</TableCell>
                          <TableCell align="right">{log.langelier_saturation_index ?? "—"}</TableCell>
                          <TableCell>{new Date(log.logged_at).toLocaleString()}</TableCell>
                          <TableCell>
                            {attention ? (
                              <Chip size="small" label="Review" color="warning" variant="outlined" />
                            ) : (
                              <Chip size="small" label="OK" variant="outlined" />
                            )}
                            {attention ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                {reasons.map(reasonLabel).join(", ")}
                              </Typography>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Attention log (recent first)
              </Typography>
              <Button component={Link} href="/app/chemical-logs" size="small" variant="outlined">
                Open chemical logs
              </Button>
            </Stack>
            {attentionRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No flagged readings in this window. Thresholds are a starting point — tune them for your jurisdiction and
                water type.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Venue</TableCell>
                    <TableCell align="right">pH</TableCell>
                    <TableCell align="right">FC</TableCell>
                    <TableCell align="right">TC</TableCell>
                    <TableCell align="right">LSI</TableCell>
                    <TableCell>Logged</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attentionRows.slice(0, 50).map(({ log, reasons }) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.pool_label?.trim() || "Unlabeled pool"}</TableCell>
                      <TableCell align="right">{log.ph ?? "—"}</TableCell>
                      <TableCell align="right">{log.free_chlorine ?? "—"}</TableCell>
                      <TableCell align="right">{log.total_chlorine ?? "—"}</TableCell>
                      <TableCell align="right">{log.langelier_saturation_index ?? "—"}</TableCell>
                      <TableCell>{new Date(log.logged_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" gap={0.5} flexWrap="wrap">
                          {reasons.map((r) => (
                            <Chip key={r} size="small" label={reasonLabel(r)} variant="outlined" />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {attentionRows.length > 50 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Showing 50 of {attentionRows.length} flagged rows. Narrow the date range in Chemical Logs exports when
                you need a full history.
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
