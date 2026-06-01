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
import { useEffect, useState, useTransition } from "react";

import {
  createEnergyAuditAction,
  updateEnergyAuditAction,
} from "@/app/(dashboard)/app/energy-audits/actions";
import { ENERGY_AUDIT_STATUSES } from "@/lib/validations/energyAudit";
import type { Database, EnergyAuditStatus } from "@/types/database";

type EnergyAuditRow = Database["public"]["Tables"]["energy_audits"]["Row"];
type PoolOption = { id: string; name: string };

function labelStatus(s: EnergyAuditStatus) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function EnergyAuditFormDialog({
  open,
  mode,
  audit,
  pools,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  audit: EnergyAuditRow | null;
  pools: PoolOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = mode === "edit" && audit;

  const [title, setTitle] = useState("");
  const [poolId, setPoolId] = useState("");
  const [status, setStatus] = useState<EnergyAuditStatus>("draft");
  const [facilitySummary, setFacilitySummary] = useState("");
  const [pumpNotes, setPumpNotes] = useState("");
  const [heaterNotes, setHeaterNotes] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [savingsNotes, setSavingsNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit && audit) {
      setTitle(audit.title);
      setPoolId(audit.pool_id ?? "");
      setStatus(audit.status);
      setFacilitySummary(audit.facility_summary ?? "");
      setPumpNotes(audit.pump_notes ?? "");
      setHeaterNotes(audit.heater_notes ?? "");
      setScheduleNotes(audit.schedule_notes ?? "");
      setFindings(audit.findings ?? "");
      setRecommendations(audit.recommendations ?? "");
      setSavingsNotes(audit.estimated_savings_notes ?? "");
    } else {
      setTitle("");
      setPoolId("");
      setStatus("draft");
      setFacilitySummary("");
      setPumpNotes("");
      setHeaterNotes("");
      setScheduleNotes("");
      setFindings("");
      setRecommendations("");
      setSavingsNotes("");
    }
  }, [open, isEdit, audit]);

  const submit = () => {
    const fd = new FormData();
    if (isEdit && audit) fd.set("auditId", audit.id);
    fd.set("title", title);
    fd.set("pool_id", poolId);
    fd.set("status", status);
    fd.set("facility_summary", facilitySummary);
    fd.set("pump_notes", pumpNotes);
    fd.set("heater_notes", heaterNotes);
    fd.set("schedule_notes", scheduleNotes);
    fd.set("findings", findings);
    fd.set("recommendations", recommendations);
    fd.set("estimated_savings_notes", savingsNotes);

    startTransition(() => {
      if (isEdit) void updateEnergyAuditAction(fd);
      else void createEnergyAuditAction(fd);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? "Edit energy audit" : "New energy audit"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <TextField
            label="Audit title"
            required
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Main pool — spring 2026 audit"
          />
          <FormControl fullWidth>
            <InputLabel id="energy-audit-pool-label">Pool (optional)</InputLabel>
            <Select
              labelId="energy-audit-pool-label"
              label="Pool (optional)"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
            >
              <MenuItem value="">
                <em>Not linked to a pool</em>
              </MenuItem>
              {pools.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isEdit ? (
            <FormControl fullWidth>
              <InputLabel id="energy-audit-status-label">Status</InputLabel>
              <Select
                labelId="energy-audit-status-label"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EnergyAuditStatus)}
              >
                {ENERGY_AUDIT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {labelStatus(s)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <TextField
            label="Facility summary"
            multiline
            minRows={2}
            fullWidth
            value={facilitySummary}
            onChange={(e) => setFacilitySummary(e.target.value)}
          />
          <TextField
            label="Pump systems"
            multiline
            minRows={2}
            fullWidth
            value={pumpNotes}
            onChange={(e) => setPumpNotes(e.target.value)}
            placeholder="Horsepower, run times, variable-speed settings…"
          />
          <TextField
            label="Heaters & boilers"
            multiline
            minRows={2}
            fullWidth
            value={heaterNotes}
            onChange={(e) => setHeaterNotes(e.target.value)}
          />
          <TextField
            label="Schedules & operating patterns"
            multiline
            minRows={2}
            fullWidth
            value={scheduleNotes}
            onChange={(e) => setScheduleNotes(e.target.value)}
          />
          <TextField
            label="Findings"
            multiline
            minRows={3}
            fullWidth
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />
          <TextField
            label="Recommendations"
            multiline
            minRows={3}
            fullWidth
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
          />
          <TextField
            label="Estimated savings notes"
            multiline
            minRows={2}
            fullWidth
            value={savingsNotes}
            onChange={(e) => setSavingsNotes(e.target.value)}
            placeholder="Optional — for board or capital planning"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={pending || !title.trim()}>
          {pending ? "Saving…" : isEdit ? "Save audit" : "Create audit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
