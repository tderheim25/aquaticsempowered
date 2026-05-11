import { Alert, Box, Button, Container, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Link from "next/link";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { createChemicalLogAction, deleteChemicalLogAction, updateChemicalLogAction } from "./actions";

export const metadata = {
  title: "Chemical Logs | Aquatics Empowered",
};

function statusMessage(status?: string) {
  switch (status) {
    case "created":
      return { severity: "success" as const, text: "Chemical log saved." };
    case "invalid":
      return { severity: "error" as const, text: "Please add at least one reading before saving." };
    case "updated":
      return { severity: "success" as const, text: "Chemical log updated." };
    case "deleted":
      return { severity: "success" as const, text: "Chemical log deleted." };
    case "error":
      return { severity: "error" as const, text: "Unable to save chemical log. Please try again." };
    default:
      return null;
  }
}

type ChemicalLogRow = {
  id: string;
  pool_label: string | null;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  logged_by: string | null;
  logged_at: string;
};

export default async function ChemicalLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; pool?: string; from?: string; to?: string; edit?: string; org?: string }>;
}) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const { status, pool, from, to, edit, org } = await searchParams;
  const flash = statusMessage(status);
  const isSuperAdmin = profile.role === "super_admin";

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: orgOptions } =
    isSuperAdmin && !profile.org_id
      ? await admin.from("organizations").select("id, name").order("name", { ascending: true }).limit(200)
      : { data: [] as { id: string; name: string }[] };

  const activeOrgId = profile.org_id ?? (isSuperAdmin ? (org?.trim() || orgOptions?.[0]?.id || null) : null);

  if (!activeOrgId) {
    const hasOrgOptions = Boolean(orgOptions && orgOptions.length > 0);
    return (
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Alert severity="warning">
            {isSuperAdmin
              ? "No organization yet. Choose an organization to manage chemical logs."
              : "No organization yet. Your account is not linked to an organization."}
          </Alert>
          {isSuperAdmin && hasOrgOptions ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack component="form" direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
                <TextField name="org" label="Organization" select size="small" defaultValue="">
                  {(orgOptions ?? []).map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="outlined">
                  Open logs
                </Button>
              </Stack>
            </Paper>
          ) : null}
          {isSuperAdmin && !hasOrgOptions ? (
            <Alert severity="info">No organizations exist yet. Create an organization first, then return to Chemical Logs.</Alert>
          ) : null}
        </Stack>
      </Container>
    );
  }

  let logsQuery = supabase
    .from("chemical_logs")
    .select("id, pool_label, ph, free_chlorine, total_chlorine, alkalinity, temp_f, logged_by, logged_at")
    .eq("org_id", activeOrgId);
  if (pool?.trim()) {
    logsQuery = logsQuery.eq("pool_label", pool.trim());
  }
  if (from?.trim()) {
    logsQuery = logsQuery.gte("logged_at", `${from.trim()}T00:00:00`);
  }
  if (to?.trim()) {
    logsQuery = logsQuery.lte("logged_at", `${to.trim()}T23:59:59.999`);
  }
  const { data: logs, error: logsError } = await logsQuery.order("logged_at", { ascending: false }).limit(200);

  const loggerIds = [...new Set((logs ?? []).map((log) => log.logged_by).filter((id): id is string => Boolean(id)))];
  const { data: loggerRows } = loggerIds.length
    ? await supabase.from("users").select("id, full_name, email").in("id", loggerIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const loggerNameById = new Map(
    (loggerRows ?? []).map((u) => [u.id, u.full_name?.trim() || u.email.split("@")[0] || "Unknown user"])
  );
  const poolLabels = [...new Set((logs ?? []).map((l) => l.pool_label?.trim()).filter((v): v is string => Boolean(v)))].sort();
  const selectedLog = (logs ?? []).find((log) => log.id === edit) as ChemicalLogRow | undefined;

  function csvHref() {
    const params = new URLSearchParams();
    if (activeOrgId !== profile.org_id) params.set("org", activeOrgId);
    if (pool?.trim()) params.set("pool", pool.trim());
    if (from?.trim()) params.set("from", from.trim());
    if (to?.trim()) params.set("to", to.trim());
    return `/app/chemical-logs/export${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function outOfRangeStyle(value: number | null, min: number, max: number) {
    if (value === null) return {};
    if (value < min || value > max) return { color: "error.main", fontWeight: 700 };
    return {};
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Chemical Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track water chemistry readings per pool and keep a timestamped history.
          </Typography>
        </div>

        {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}
        {logsError ? <Alert severity="error">Could not load chemical logs for your organization.</Alert> : null}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack component="form" direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
            {isSuperAdmin && !profile.org_id ? (
              <TextField name="org" label="Organization" size="small" select defaultValue={activeOrgId} sx={{ minWidth: 260 }}>
                {(orgOptions ?? []).map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField name="pool" label="Pool" size="small" select defaultValue={pool?.trim() || ""} sx={{ minWidth: 220 }}>
              <MenuItem value="">All pools</MenuItem>
              {poolLabels.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField name="from" label="From" type="date" size="small" defaultValue={from || ""} InputLabelProps={{ shrink: true }} />
            <TextField name="to" label="To" type="date" size="small" defaultValue={to || ""} InputLabelProps={{ shrink: true }} />
            <Button type="submit" variant="outlined">
              Apply filters
            </Button>
            <Button component={Link} href="/app/chemical-logs" variant="text">
              Clear
            </Button>
            <Button component={Link} href={csvHref()} variant="outlined">
              Export CSV
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Add reading
          </Typography>
          <Box component="form" action={createChemicalLogAction}>
            <input type="hidden" name="orgId" value={activeOrgId} />
            <Stack spacing={1.5}>
              <TextField name="poolLabel" label="Pool label" size="small" placeholder="e.g. Main Lap Pool" />
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField name="ph" label="pH" type="number" size="small" inputProps={{ step: "0.01" }} fullWidth />
                <TextField name="freeChlorine" label="Free Chlorine" type="number" size="small" inputProps={{ step: "0.01" }} fullWidth />
                <TextField name="totalChlorine" label="Total Chlorine" type="number" size="small" inputProps={{ step: "0.01" }} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField name="alkalinity" label="Alkalinity" type="number" size="small" inputProps={{ step: "0.01" }} fullWidth />
                <TextField name="tempF" label="Temperature (F)" type="number" size="small" inputProps={{ step: "0.1" }} fullWidth />
              </Stack>
              <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
                Save log
              </Button>
            </Stack>
          </Box>
        </Paper>

        {selectedLog ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Edit reading
            </Typography>
            <Box component="form" action={updateChemicalLogAction}>
              <input type="hidden" name="id" value={selectedLog.id} />
              <input type="hidden" name="orgId" value={activeOrgId} />
              <Stack spacing={1.5}>
                <TextField name="poolLabel" label="Pool label" size="small" defaultValue={selectedLog.pool_label || ""} />
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField name="ph" label="pH" type="number" size="small" defaultValue={selectedLog.ph ?? ""} inputProps={{ step: "0.01" }} fullWidth />
                  <TextField name="freeChlorine" label="Free Chlorine" type="number" size="small" defaultValue={selectedLog.free_chlorine ?? ""} inputProps={{ step: "0.01" }} fullWidth />
                  <TextField name="totalChlorine" label="Total Chlorine" type="number" size="small" defaultValue={selectedLog.total_chlorine ?? ""} inputProps={{ step: "0.01" }} fullWidth />
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField name="alkalinity" label="Alkalinity" type="number" size="small" defaultValue={selectedLog.alkalinity ?? ""} inputProps={{ step: "0.01" }} fullWidth />
                  <TextField name="tempF" label="Temperature (F)" type="number" size="small" defaultValue={selectedLog.temp_f ?? ""} inputProps={{ step: "0.1" }} fullWidth />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained">
                    Update log
                  </Button>
                  <Button component={Link} href="/app/chemical-logs" variant="text">
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        ) : null}

        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Logged at</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>pH</TableCell>
                <TableCell>Free Cl</TableCell>
                <TableCell>Total Cl</TableCell>
                <TableCell>Alkalinity</TableCell>
                <TableCell>Temp (F)</TableCell>
                <TableCell>Logged by</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(logs as ChemicalLogRow[] | null)?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.logged_at).toLocaleString()}</TableCell>
                  <TableCell>{log.pool_label || "-"}</TableCell>
                  <TableCell sx={outOfRangeStyle(log.ph, 7.2, 7.8)}>{log.ph ?? "-"}</TableCell>
                  <TableCell sx={outOfRangeStyle(log.free_chlorine, 1, 4)}>{log.free_chlorine ?? "-"}</TableCell>
                  <TableCell sx={outOfRangeStyle(log.total_chlorine, 1, 5)}>{log.total_chlorine ?? "-"}</TableCell>
                  <TableCell sx={outOfRangeStyle(log.alkalinity, 80, 120)}>{log.alkalinity ?? "-"}</TableCell>
                  <TableCell sx={outOfRangeStyle(log.temp_f, 78, 84)}>{log.temp_f ?? "-"}</TableCell>
                  <TableCell>{(log.logged_by && loggerNameById.get(log.logged_by)) || "Unknown user"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" component={Link} href={`/app/chemical-logs?edit=${encodeURIComponent(log.id)}`}>
                        Edit
                      </Button>
                      <Box component="form" action={deleteChemicalLogAction}>
                        <input type="hidden" name="id" value={log.id} />
                        <input type="hidden" name="orgId" value={activeOrgId} />
                        <Button size="small" type="submit" color="error">
                          Delete
                        </Button>
                      </Box>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary">
                      No logs yet. Add your first reading above.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
