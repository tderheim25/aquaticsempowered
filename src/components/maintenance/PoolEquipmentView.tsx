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
  TableBody,
  TableCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { deletePoolEquipmentAction } from "@/app/(dashboard)/app/maintenance/equipment/actions";
import { PoolContextBar, type PoolOption } from "@/components/pool-ops/PoolContextBar";
import type { Database } from "@/types/database";

import { PoolEquipmentForm } from "./PoolEquipmentForm";

type EquipmentRow = Database["public"]["Tables"]["pool_equipment"]["Row"];

const FLASH: Record<string, { severity: "success" | "error"; text: string }> = {
  created: { severity: "success", text: "Equipment added." },
  updated: { severity: "success", text: "Equipment updated." },
  deleted: { severity: "success", text: "Equipment removed." },
  error: { severity: "error", text: "Could not save equipment." },
};

export function PoolEquipmentView({
  equipment,
  pools,
}: {
  equipment: EquipmentRow[];
  pools: PoolOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<EquipmentRow | null>(null);
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
      <PoolContextBar pools={pools} basePath="/app/maintenance/equipment" />
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setDialogMode("create");
            setEditing(null);
            setDialogOpen(true);
          }}
          disabled={pools.length === 0}
        >
          Add equipment
        </Button>
      </Stack>
      {pools.length === 0 ? (
        <Alert severity="info">Add a pool under Pools before registering equipment.</Alert>
      ) : equipment.length === 0 ? (
        <Typography color="text.secondary">No equipment registered for this pool.</Typography>
      ) : (
        <DataTable>
            <TableHead>
              <TableRow>
                <TableCell>Kind</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Installed</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.kind}</TableCell>
                  <TableCell>{row.model ?? "—"}</TableCell>
                  <TableCell>{row.installed_on ?? "—"}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" noWrap title={row.notes ?? undefined}>
                      {row.notes ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDialogMode("edit");
                          setEditing(row);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box component="form" action={deletePoolEquipmentAction} display="inline">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="pool_id" value={row.pool_id} />
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
      <PoolEquipmentForm
        open={dialogOpen}
        mode={dialogMode}
        item={dialogMode === "edit" ? editing : null}
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
