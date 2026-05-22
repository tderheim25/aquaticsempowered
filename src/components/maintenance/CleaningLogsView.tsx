"use client";

import { Add as AddIcon, DeleteOutline, Edit } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  DataTable,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deleteCleaningLogAction } from "@/app/(dashboard)/app/maintenance/cleaning/actions";
import { PoolContextBar, type PoolOption } from "@/components/pool-ops/PoolContextBar";
import type { Database } from "@/types/database";

import { CleaningLogForm } from "./CleaningLogForm";

type CleaningLogRow = Database["public"]["Tables"]["cleaning_logs"]["Row"];

const TASK_KEYS = ["brush", "net", "vacuum", "skimmer_basket", "pump_basket", "pump_filter", "deck"] as const;
const TASK_SHORT: Record<(typeof TASK_KEYS)[number], string> = {
  brush: "Brush",
  net: "Net",
  vacuum: "Vacuum",
  skimmer_basket: "Skimmer",
  pump_basket: "Pump basket",
  pump_filter: "Filter",
  deck: "Deck",
};

const FLASH: Record<string, { severity: "success" | "error"; text: string }> = {
  created: { severity: "success", text: "Cleaning log saved." },
  updated: { severity: "success", text: "Cleaning log updated." },
  deleted: { severity: "success", text: "Cleaning log deleted." },
  error: { severity: "error", text: "Could not save cleaning log." },
};

export function CleaningLogsView({
  logs,
  pools,
  poolNames,
}: {
  logs: CleaningLogRow[];
  pools: PoolOption[];
  poolNames: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CleaningLogRow | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const poolFromUrl = searchParams.get("pool") ?? "";
  const defaultPoolId =
    poolFromUrl && pools.some((p) => p.id === poolFromUrl) ? poolFromUrl : pools[0]?.id;

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

  const openCreate = () => {
    setDialogMode("create");
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (log: CleaningLogRow) => {
    setDialogMode("edit");
    setEditing(log);
    setDialogOpen(true);
  };

  return (
    <>
      <PoolContextBar pools={pools} basePath="/app/maintenance/cleaning" />
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={pools.length === 0}>
          Log cleaning
        </Button>
      </Stack>
      {pools.length === 0 ? (
        <Alert severity="info">Add a pool under Pools before logging cleaning tasks.</Alert>
      ) : logs.length === 0 ? (
        <Typography color="text.secondary">No cleaning logs for this pool yet.</Typography>
      ) : (
        <DataTable>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Pool</TableCell>
                <TableCell>Tasks</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <TableDateTimeCell iso={log.cleaned_at} />
                  </TableCell>
                  <TableCell>{poolNames[log.pool_id] ?? "—"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {TASK_KEYS.filter((k) => log[k]).map((k) => (
                        <Chip key={k} label={TASK_SHORT[k]} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" noWrap title={log.notes ?? undefined}>
                      {log.notes ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(log)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box component="form" action={deleteCleaningLogAction} display="inline">
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
              ))}
            </TableBody>
        </DataTable>
      )}
      <CleaningLogForm
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
