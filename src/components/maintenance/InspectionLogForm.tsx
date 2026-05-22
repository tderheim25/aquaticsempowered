"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";

import { createInspectionLogAction, updateInspectionLogAction } from "@/app/(dashboard)/app/maintenance/inspections/actions";
import { getInspectionTemplate, INSPECTION_TEMPLATES, type InspectionTemplate } from "@/lib/maintenance/inspectionTemplates";
import type { Database } from "@/types/database";

type InspectionLogRow = Database["public"]["Tables"]["inspection_logs"]["Row"];
type PoolOption = { id: string; name: string };

type ChecklistItem = { key: string; label: string; passed: boolean | null };

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalDatetime() {
  return toLocalDatetime(new Date().toISOString());
}

function parseChecklistJson(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is ChecklistItem => typeof x === "object" && x !== null && "key" in x && "label" in x)
    .map((x) => ({
      key: String((x as ChecklistItem).key),
      label: String((x as ChecklistItem).label),
      passed: (x as ChecklistItem).passed ?? null,
    }));
}

export function InspectionLogForm({
  open,
  mode,
  log,
  pools,
  defaultPoolId,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  log: InspectionLogRow | null;
  pools: PoolOption[];
  defaultPoolId?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [templateKey, setTemplateKey] = useState(log?.template_key ?? INSPECTION_TEMPLATES[0]?.key ?? "");
  const template = getInspectionTemplate(templateKey) as InspectionTemplate | undefined;
  const savedChecklist = log ? parseChecklistJson(log.checklist) : [];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (mode === "edit" && log) fd.set("id", log.id);
    startTransition(() => {
      void (mode === "create" ? createInspectionLogAction(fd) : updateInspectionLogAction(fd));
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "create" ? "New inspection" : "Edit inspection"}</DialogTitle>
      <form key={log?.id ?? `new-${defaultPoolId ?? ""}-${templateKey}`} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" required>
              <InputLabel id="insp-pool-label">Pool</InputLabel>
              <Select
                name="pool_id"
                labelId="insp-pool-label"
                label="Pool"
                defaultValue={log?.pool_id ?? defaultPoolId ?? pools[0]?.id ?? ""}
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
              <InputLabel id="insp-template-label">Template</InputLabel>
              <Select
                name="template_key"
                labelId="insp-template-label"
                label="Template"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                required
              >
                {INSPECTION_TEMPLATES.map((t) => (
                  <MenuItem key={t.key} value={t.key}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="inspected_at"
              label="Inspected at"
              type="datetime-local"
              fullWidth
              required
              defaultValue={log ? toLocalDatetime(log.inspected_at) : nowLocalDatetime()}
              InputLabelProps={{ shrink: true }}
            />
            {template ? (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
                <FormLabel component="legend" sx={{ fontWeight: 600 }}>
                  Checklist
                </FormLabel>
                {template.items.map((item) => {
                  const saved = savedChecklist.find((c) => c.key === item.key);
                  const defaultVal = saved?.passed === true ? "pass" : saved?.passed === false ? "fail" : "";
                  return (
                    <FormControl key={item.key} component="fieldset" variant="standard">
                      <FormLabel component="legend" sx={{ fontSize: "0.875rem" }}>
                        {item.label}
                      </FormLabel>
                      <RadioGroup row name={`check_${item.key}`} defaultValue={defaultVal}>
                        <FormControlLabel value="pass" control={<Radio size="small" />} label="Pass" />
                        <FormControlLabel value="fail" control={<Radio size="small" />} label="Fail" />
                        <FormControlLabel value="" control={<Radio size="small" />} label="N/A" />
                      </RadioGroup>
                    </FormControl>
                  );
                })}
              </Stack>
            ) : null}
            <TextField
              name="operator_initials"
              label="Operator initials"
              size="small"
              inputProps={{ maxLength: 8 }}
              defaultValue={log?.operator_initials ?? ""}
            />
            <TextField name="notes" label="Notes (optional)" fullWidth multiline minRows={2} defaultValue={log?.notes ?? ""} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {mode === "create" ? "Save inspection" : "Update"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
