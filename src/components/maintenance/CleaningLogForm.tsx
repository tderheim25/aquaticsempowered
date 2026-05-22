"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTransition } from "react";

import { createCleaningLogAction, updateCleaningLogAction } from "@/app/(dashboard)/app/maintenance/cleaning/actions";
import type { CleaningLogFormValues } from "@/lib/validations/cleaning";
import type { Database } from "@/types/database";

type CleaningLogRow = Database["public"]["Tables"]["cleaning_logs"]["Row"];
type PoolOption = { id: string; name: string };

const TASK_LABELS: { key: keyof Pick<CleaningLogFormValues, "brush" | "net" | "vacuum" | "skimmer_basket" | "pump_basket" | "pump_filter" | "deck">; label: string }[] = [
  { key: "brush", label: "Brush walls & floor" },
  { key: "net", label: "Skim / net debris" },
  { key: "vacuum", label: "Vacuum" },
  { key: "skimmer_basket", label: "Empty skimmer baskets" },
  { key: "pump_basket", label: "Empty pump basket" },
  { key: "pump_filter", label: "Backwash / clean filter" },
  { key: "deck", label: "Deck / surrounding area" },
];

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalDatetime() {
  return toLocalDatetime(new Date().toISOString());
}

function rowToForm(log: CleaningLogRow): CleaningLogFormValues {
  return {
    pool_id: log.pool_id,
    cleaned_at: toLocalDatetime(log.cleaned_at),
    brush: log.brush,
    net: log.net,
    vacuum: log.vacuum,
    skimmer_basket: log.skimmer_basket,
    pump_basket: log.pump_basket,
    pump_filter: log.pump_filter,
    deck: log.deck,
    notes: log.notes,
  };
}

export function CleaningLogForm({
  open,
  mode,
  log,
  pools,
  defaultPoolId,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  log: CleaningLogRow | null;
  pools: PoolOption[];
  defaultPoolId?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const initial = mode === "edit" && log ? rowToForm(log) : null;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (mode === "edit" && log) fd.set("id", log.id);
    startTransition(() => {
      void (mode === "create" ? createCleaningLogAction(fd) : updateCleaningLogAction(fd));
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Log cleaning" : "Edit cleaning log"}</DialogTitle>
      <form key={log?.id ?? `new-${defaultPoolId ?? ""}`} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" required>
              <InputLabel id="clean-pool-label">Pool</InputLabel>
              <Select
                name="pool_id"
                labelId="clean-pool-label"
                label="Pool"
                defaultValue={initial?.pool_id ?? defaultPoolId ?? pools[0]?.id ?? ""}
                required
              >
                {pools.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="cleaned_at"
              label="Cleaned at"
              type="datetime-local"
              fullWidth
              required
              defaultValue={initial?.cleaned_at ?? nowLocalDatetime()}
              InputLabelProps={{ shrink: true }}
            />
            <Box>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Tasks completed
              </FormLabel>
              <FormGroup>
                {TASK_LABELS.map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={<Checkbox name={key} defaultChecked={initial?.[key] ?? false} />}
                    label={label}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">
                Check each task performed during this round.
              </Typography>
            </Box>
            <TextField name="notes" label="Notes (optional)" fullWidth multiline minRows={2} defaultValue={initial?.notes ?? ""} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {mode === "create" ? "Save log" : "Update"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
