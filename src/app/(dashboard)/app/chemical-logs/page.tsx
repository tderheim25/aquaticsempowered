import { Alert, Button, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChemicalLogForm } from "@/components/chemistry/ChemicalLogForm";
import { ChemicalLogsFilters } from "@/components/chemistry/ChemicalLogsFilters";
import {
  DataTable,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";
import { EmptyStateIllustration } from "@/components/pool-ops/EmptyStateIllustration";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { StatusToast, type StatusToastMessages } from "@/components/ui/StatusToast";
import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { localDateString } from "@/lib/dates/localDate";
import { fetchChemicalLogsForOrg, fetchPoolOptionsForOrg, type ChemicalLogListRow } from "@/lib/org/fetchOrgScopedData";
import { createClient } from "@/lib/supabase/server";

import { createChemicalLogAction, deleteChemicalLogAction, updateChemicalLogAction } from "./actions";

export const metadata = { title: "Chemical Logs | Aquatics Empowered" };

const CHEMICAL_LOG_TOAST_MESSAGES: StatusToastMessages = {
  created: { severity: "success", text: "Chemical log saved." },
  invalid: { severity: "error", text: "Please add at least one reading before saving." },
  updated: { severity: "success", text: "Chemical log updated." },
  deleted: { severity: "success", text: "Chemical log deleted." },
  error: { severity: "error", text: "Unable to save chemical log. Please try again." },
};

function outOfRangeStyle(value: number | null, min: number, max: number) {
  if (value === null) return {};
  if (value < min || value > max) return { color: "error.main", fontWeight: 700 };
  return {};
}

export default async function ChemicalLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; pool_id?: string; date?: string; edit?: string; org?: string }>;
}) {
  await requireViewAccess("chemical_logs");
  const profile = await requireProfileForApp();
  const { status, pool_id: poolIdParam, date: dateParam, edit, org } = await searchParams;
  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;
  const isSuperAdmin = profile.role === "super_admin";

  const supabase = await createClient();

  if (!activeOrgId) {
    return (
      <Container maxWidth="lg">
        <PoolOpsPageShell title="Chemical Logs" subtitle="Record water chemistry and LSI.">
          <SelectOrgSidebarHint superAdmin={isSuperAdmin} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  const orgId = activeOrgId;
  const poolOptions = await fetchPoolOptionsForOrg(orgId, profile);
  const filterDate = dateParam?.trim() || localDateString();

  if (poolOptions.length > 0 && !poolIdParam?.trim()) {
    const params = new URLSearchParams();
    if (org) params.set("org", org);
    params.set("pool_id", poolOptions[0].id);
    params.set("date", filterDate);
    if (edit) params.set("edit", edit);
    if (status) params.set("status", status);
    redirect(`/app/chemical-logs?${params.toString()}`);
  }

  const activePoolId = poolIdParam?.trim() || "";
  const { logs, error: logsError } = await fetchChemicalLogsForOrg(orgId, profile, {
    poolId: activePoolId || undefined,
    date: filterDate,
    limit: 200,
  });

  const loggerIds = [...new Set((logs ?? []).map((log) => log.logged_by).filter((id): id is string => Boolean(id)))];
  const { data: loggerRows } = loggerIds.length
    ? await supabase.from("users").select("id, full_name, email").in("id", loggerIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const loggerNameById = new Map(
    (loggerRows ?? []).map((u) => [u.id, u.full_name?.trim() || u.email.split("@")[0] || "Unknown user"])
  );

  const selectedLog = logs.find((log) => log.id === edit);

  function poolName(log: ChemicalLogListRow) {
    const p = log.pools;
    if (Array.isArray(p)) return p[0]?.name ?? log.pool_label ?? "—";
    return p?.name ?? log.pool_label ?? "—";
  }

  function queryHref(extra?: { edit?: string }) {
    const params = new URLSearchParams();
    if (orgId !== profile.org_id) params.set("org", orgId);
    if (activePoolId) params.set("pool_id", activePoolId);
    if (filterDate) params.set("date", filterDate);
    if (extra?.edit) params.set("edit", extra.edit);
    const qs = params.toString();
    return `/app/chemical-logs${qs ? `?${qs}` : ""}`;
  }

  function csvHref() {
    const params = new URLSearchParams();
    if (orgId !== profile.org_id) params.set("org", orgId);
    if (activePoolId) params.set("pool_id", activePoolId);
    if (filterDate) {
      params.set("from", filterDate);
      params.set("to", filterDate);
    }
    return `/app/chemical-logs/export${params.toString() ? `?${params.toString()}` : ""}`;
  }

  return (
    <Container maxWidth="lg">
      <PoolOpsPageShell
        title="Chemical Logs"
        subtitle="Track water chemistry readings per pool with LSI when hardness and core readings are provided."
        accent="chemistry"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button component={Link} href="/app/chemical-logs/history" size="small" variant="outlined">
              Trends
            </Button>
            <Button component={Link} href="/app/chemical-logs/calculator" size="small" variant="outlined">
              Calculator
            </Button>
            <Button component={Link} href="/app/chemical-logs/reports" size="small" variant="outlined">
              Reports
            </Button>
            <Button component={Link} href={csvHref()} size="small" variant="outlined">
              Export CSV
            </Button>
          </Stack>
        }
      >
        <StatusToast status={status} messages={CHEMICAL_LOG_TOAST_MESSAGES} />
        {logsError ? <Alert severity="error">Could not load chemical logs for your organization.</Alert> : null}

        {poolOptions.length > 0 ? (
          <PoolOpsSectionCard accent="chemistry">
            <ChemicalLogsFilters
              pools={poolOptions}
              poolId={activePoolId}
              date={filterDate}
              orgQuery={orgId !== profile.org_id ? orgId : undefined}
            />
          </PoolOpsSectionCard>
        ) : null}

        {poolOptions.length === 0 ? (
          <EmptyStateIllustration
            title="No pools yet"
            description="Register pools before logging chemistry readings."
            action={
              <Button component={Link} href="/app/pools?add=1" variant="contained">
                Add pool
              </Button>
            }
          />
        ) : (
          <>
            <PoolOpsSectionCard accent="chemistry" index={1}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedLog ? "Edit reading" : "Add reading"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {poolOptions.find((p) => p.id === (selectedLog?.pool_id ?? activePoolId))?.name ?? "Pool"} · {filterDate}
              </Typography>
              <ChemicalLogForm
                action={selectedLog ? updateChemicalLogAction : createChemicalLogAction}
                orgId={orgId}
                pools={poolOptions}
                fixedPoolId={selectedLog?.pool_id ?? activePoolId}
                filterDate={filterDate}
                returnOrg={orgId !== profile.org_id ? orgId : undefined}
                editId={selectedLog?.id}
                defaults={
                  selectedLog
                    ? {
                        ph: selectedLog.ph,
                        freeChlorine: selectedLog.free_chlorine,
                        totalChlorine: selectedLog.total_chlorine,
                        alkalinity: selectedLog.alkalinity,
                        tempF: selectedLog.temp_f,
                        calciumHardness: selectedLog.calcium_hardness,
                        tdsPpm: selectedLog.tds_ppm,
                        cyanuricAcid: selectedLog.cyanuric_acid_ppm,
                        filterPsi: selectedLog.filter_psi,
                        flowGpm: selectedLog.flow_gpm,
                        notes: selectedLog.notes,
                        operatorInitials: selectedLog.operator_initials,
                      }
                    : undefined
                }
              />
              {selectedLog ? (
                <Button component={Link} href={queryHref()} sx={{ mt: 1 }}>
                  Cancel edit
                </Button>
              ) : null}
            </PoolOpsSectionCard>

            <PoolOpsSectionCard accent="chemistry" index={2}>
              <DataTable embedded>
                <TableHead>
                  <TableRow>
                    <TableCell>Logged at</TableCell>
                    <TableCell>Pool</TableCell>
                    <TableCell>pH</TableCell>
                    <TableCell>Free Cl</TableCell>
                    <TableCell>Alkalinity</TableCell>
                    <TableCell>Temp (F)</TableCell>
                    <TableCell>LSI</TableCell>
                    <TableCell>Logged by</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <TableDateTimeCell iso={log.logged_at} />
                      </TableCell>
                      <TableCell>{poolName(log)}</TableCell>
                      <TableCell sx={outOfRangeStyle(log.ph, 7.2, 7.8)}>{log.ph ?? "—"}</TableCell>
                      <TableCell sx={outOfRangeStyle(log.free_chlorine, 1, 4)}>{log.free_chlorine ?? "—"}</TableCell>
                      <TableCell sx={outOfRangeStyle(log.alkalinity, 80, 120)}>{log.alkalinity ?? "—"}</TableCell>
                      <TableCell sx={outOfRangeStyle(log.temp_f, 78, 84)}>{log.temp_f ?? "—"}</TableCell>
                      <TableCell>{log.langelier_saturation_index ?? "—"}</TableCell>
                      <TableCell>{(log.logged_by && loggerNameById.get(log.logged_by)) || "—"}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            component={Link}
                            href={queryHref({ edit: log.id })}
                          >
                            Edit
                          </Button>
                          <form action={deleteChemicalLogAction}>
                            <input type="hidden" name="id" value={log.id} />
                            <input type="hidden" name="orgId" value={orgId} />
                            <input type="hidden" name="returnPoolId" value={activePoolId} />
                            <input type="hidden" name="returnDate" value={filterDate} />
                            {orgId !== profile.org_id ? <input type="hidden" name="returnOrg" value={orgId} /> : null}
                            <Button size="small" type="submit" color="error">
                              Delete
                            </Button>
                          </form>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" color="text.secondary">
                          No readings for this pool on {filterDate}. Add one above or pick another date.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </DataTable>
            </PoolOpsSectionCard>
          </>
        )}

        <Typography variant="body2" color="text.secondary">
          View{" "}
          <MuiLink component={Link} href="/app/chemical-logs/history">
            chemistry trends
          </MuiLink>{" "}
          or{" "}
          <MuiLink component={Link} href="/app/monitoring">
            monitoring
          </MuiLink>
          .
        </Typography>
      </PoolOpsPageShell>
    </Container>
  );
}
