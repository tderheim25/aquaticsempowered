"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deleteEnergyAuditAction } from "@/app/(dashboard)/app/energy-audits/actions";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import { isEnergyAuditBetaOpen } from "@/lib/auth/energyAuditAccess";
import type { Database, EnergyAuditStatus } from "@/types/database";

import { EnergyAuditFormDialog } from "./EnergyAuditFormDialog";

type EnergyAuditRow = Database["public"]["Tables"]["energy_audits"]["Row"];
type PoolOption = { id: string; name: string };

const FLASH: Record<string, { severity: "success" | "error" | "info"; text: string }> = {
  created: { severity: "success", text: "Energy audit created." },
  updated: { severity: "success", text: "Energy audit saved." },
  deleted: { severity: "success", text: "Energy audit removed." },
  error: { severity: "error", text: "Something went wrong. Please try again." },
  plan: {
    severity: "info",
    text: "Energy audits are included on Professional and Enterprise plans (beta is open for pilot orgs).",
  },
};

function statusTone(status: EnergyAuditStatus) {
  if (status === "completed") return "success" as const;
  if (status === "submitted") return "info" as const;
  return "warning" as const;
}

function statusLabel(status: EnergyAuditStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EnergyAuditView({
  audits,
  pools,
  enabled,
  poolNameById,
}: {
  audits: EnergyAuditRow[];
  pools: PoolOption[];
  enabled: boolean;
  poolNameById: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EnergyAuditRow | null>(null);
  const [detail, setDetail] = useState<EnergyAuditRow | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);

  const stripFlash = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("status");
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status || !FLASH[status]) return;
    setSnack(FLASH[status]);
    setSnackOpen(true);
    stripFlash();
  }, [searchParams, stripFlash]);

  if (!enabled) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          {FLASH.plan.text}{" "}
          <Link href="/founders" style={{ fontWeight: 600 }}>
            Contact us
          </Link>{" "}
          about Professional, or return to{" "}
          <Link href="/community?tab=programs" style={{ fontWeight: 600 }}>
            Community Programs
          </Link>
          .
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Energy audits
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
              Document pump, heater, and schedule reviews for board and capital planning.
              {isEnergyAuditBetaOpen() ? (
                <>
                  {" "}
                  <Chip size="small" label="Beta" color="primary" sx={{ ml: 0.5, verticalAlign: "middle" }} />
                </>
              ) : null}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New audit
          </Button>
        </Stack>

        {isEnergyAuditBetaOpen() ? (
          <Alert severity="info">
            Beta energy audits are enabled for your organization. Share feedback from{" "}
            <Link href="/community?tab=programs">Community → Programs</Link> or{" "}
            <Link href="/app/support">Support</Link>.
          </Alert>
        ) : null}

        {audits.length === 0 ? (
          <Alert severity="info">
            No energy audits yet. Create your first audit to capture findings for leadership.
          </Alert>
        ) : (
          <DataTable>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audits.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <TablePrimaryCell
                      primary={
                        <Button
                          variant="text"
                          size="small"
                          sx={{ textTransform: "none", fontWeight: 600, p: 0, minWidth: 0 }}
                          onClick={() => setDetail(row)}
                        >
                          {row.title}
                        </Button>
                      }
                    />
                  </TableCell>
                  <TableCell>{row.pool_id ? poolNameById[row.pool_id] ?? "—" : "—"}</TableCell>
                  <TableCell>
                    <StatusPill label={statusLabel(row.status)} tone={statusTone(row.status)} />
                  </TableCell>
                  <TableDateTimeCell iso={row.updated_at} />
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => {
                          setEditing(row);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Box
                        component="form"
                        action={deleteEnergyAuditAction}
                        sx={{ display: "inline" }}
                      >
                        <input type="hidden" name="auditId" value={row.id} />
                        <Button type="submit" size="small" color="error">
                          Delete
                        </Button>
                      </Box>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}

        {detail ? (
          <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detail.title}
              </Typography>
              <Button size="small" onClick={() => setDetail(null)}>
                Close
              </Button>
            </Stack>
            <StatusPill label={statusLabel(detail.status)} tone={statusTone(detail.status)} />
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {[
                ["Facility summary", detail.facility_summary],
                ["Pump systems", detail.pump_notes],
                ["Heaters", detail.heater_notes],
                ["Schedules", detail.schedule_notes],
                ["Findings", detail.findings],
                ["Recommendations", detail.recommendations],
                ["Estimated savings", detail.estimated_savings_notes],
              ].map(([label, value]) =>
                value ? (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {value}
                    </Typography>
                  </Box>
                ) : null,
              )}
            </Stack>
          </Box>
        ) : null}
      </Stack>

      <EnergyAuditFormDialog
        open={dialogOpen}
        mode={editing ? "edit" : "create"}
        audit={editing}
        pools={pools}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />

      <Snackbar
        open={snackOpen && Boolean(snack)}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack?.severity ?? "info"} onClose={() => setSnackOpen(false)} sx={{ width: "100%" }}>
          {snack?.text ?? ""}
        </Alert>
      </Snackbar>
    </Container>
  );
}
