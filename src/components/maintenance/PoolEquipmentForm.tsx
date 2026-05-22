"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useTransition } from "react";

import { createPoolEquipmentAction, updatePoolEquipmentAction } from "@/app/(dashboard)/app/maintenance/equipment/actions";
import { EQUIPMENT_KINDS } from "@/lib/validations/equipment";
import type { Database } from "@/types/database";

type EquipmentRow = Database["public"]["Tables"]["pool_equipment"]["Row"];
type PoolOption = { id: string; name: string };

export function PoolEquipmentForm({
  open,
  mode,
  item,
  pools,
  defaultPoolId,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  item: EquipmentRow | null;
  pools: PoolOption[];
  defaultPoolId?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (mode === "edit" && item) fd.set("id", item.id);
    startTransition(() => {
      void (mode === "create" ? createPoolEquipmentAction(fd) : updatePoolEquipmentAction(fd));
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Add equipment" : "Edit equipment"}</DialogTitle>
      <form key={item?.id ?? `new-${defaultPoolId ?? ""}`} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" required>
              <InputLabel id="eq-pool-label">Pool</InputLabel>
              <Select
                name="pool_id"
                labelId="eq-pool-label"
                label="Pool"
                defaultValue={item?.pool_id ?? defaultPoolId ?? pools[0]?.id ?? ""}
                required
              >
                {pools.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" required>
              <InputLabel id="eq-kind-label">Kind</InputLabel>
              <Select name="kind" labelId="eq-kind-label" label="Kind" defaultValue={item?.kind ?? "other"} required>
                {EQUIPMENT_KINDS.map((k) => (
                  <MenuItem key={k} value={k}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField name="model" label="Model (optional)" fullWidth defaultValue={item?.model ?? ""} />
            <TextField
              name="installed_on"
              label="Installed on"
              type="date"
              fullWidth
              defaultValue={item?.installed_on ?? ""}
              InputLabelProps={{ shrink: true }}
            />
            <TextField name="notes" label="Notes (optional)" fullWidth multiline minRows={2} defaultValue={item?.notes ?? ""} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {mode === "create" ? "Add" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
