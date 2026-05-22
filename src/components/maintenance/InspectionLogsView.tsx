"use client";

import { Add as AddIcon, DeleteOutline, Edit } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deleteInspectionLogAction } from "@/app/(dashboard)/app/maintenance/inspections/actions";
import { getInspectionTemplate } from "@/lib/maintenance/inspectionTemplates";
import { PoolContextBar, type PoolOption } from "@/components/pool-ops/PoolContextBar";
import type { Database } from "@/types/database";

import { InspectionLogForm } from "./InspectionLogForm";

type InspectionLogRow = Database["public"]["Tables"]["inspection_logs"]["Row"];

const FLASH: Record<string, { severity: "success" | "error"; text: string }> = {
  created: { severity: "success", text: "Inspection saved." },
  updated: { severity: "success", text: "Inspection updated." },
  deleted: { severity: "success", text: "Inspection deleted." },
  error: { severity: "error", text: "Could not save inspection." },
};

export function InspectionLogsView({
  logs,
  pools,
  poolNames,
}: {
  logs: InspectionLogRow[];
  pools: PoolOption[];
  poolNames: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<InspectionLogRow | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const poolFromUrl = searchParams.get("pool") ?? "";
  const defaultPoolId = poolFromUrl && pools.some((p) => p.id === poolFromUrl) ? poolFromUrl : pools[0]?.id;

  const stripFlash = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has("status")) return;
    p.delete("status");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) return;
    const msg = FLASH[status];
    if (msg) {
      setSnack(msg);
      setSnackOpen(true);
    }
    stripFlash();
  }, [searchParams, stripFlash]);

  return (
    <>
      <PoolContextBar pools={pools} basePath="/app/maintenance/inspections" />
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setDialogMode("create"); setEditing(null); setDialogOpen(true); }} disabled={pools.length === 0}>
          New inspection
        </Button>
      </Stack>
      {pools.length === 0 ? (
        <Alert severity="info">Add a pool under Pools before recording inspections.</Alert>
      ) : logs.length === 0 ? (
        <Typography color="text.secondary">No inspections for this pool yet.</Typography>
      ) : (
        <DataTable>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Result</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => {
                const tmpl = getInspectionTemplate(log.template_key);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <TableDateTimeCell iso={log.inspected_at} />
                    </TableCell>
                    <TableCell>{poolNames[log.pool_id] ?? "—"}</TableCell>
                    <TableCell>{tmpl?.label ?? log.template_key}</TableCell>
                    <TableCell>
                      {log.passed === true ? (
                        <StatusPill label="Pass" tone="success" />
                      ) : log.passed === false ? (
                        <StatusPill label="Fail" tone="error" />
                      ) : (
                        <StatusPill label="Incomplete" tone="neutral" dot={false} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setDialogMode("edit"); setEditing(log); setDialogOpen(true); }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Box component="form" action={deleteInspectionLogAction} display="inline">
                        <input type="hidden" name="id" value={log.id} />
                        <input type="hidden" name="pool_id" value={log.pool_id} />
                        <Tooltip title="Delete">
                          <IconButton type="submit" size="small" color="error">
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
        </DataTable>
      )}
      <InspectionLogForm
        open={dialogOpen}
        mode={dialogMode}
        log={dialogMode === "edit" ? editing : null}
        pools={pools}
        defaultPoolId={defaultPoolId}
        onClose={() => setDialogOpen(false)}
      />
      <Snackbar open={snackOpen} autoHideDuration={5000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? <Alert severity={snack.severity} onClose={() => setSnackOpen(false)}>{snack.text}</Alert> : undefined}
      </Snackbar>
    </>
  );
}
