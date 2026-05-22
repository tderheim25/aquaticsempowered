"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useMemo, useState } from "react";

import { LsiGauge } from "@/components/pool-ops/LsiGauge";
import { calculateLangelierSaturationIndex } from "@/lib/water/calculateLsi";
import type { PoolTargetRanges } from "@/types/database";

import { evaluateMetric } from "@/lib/water/evaluateReading";
import { mergeTargetRanges } from "@/lib/water/defaultTargetRanges";
import { poolOpsTokens } from "@/theme/poolOpsTokens";

export type PoolSelectOption = { id: string; name: string; target_ranges?: unknown };

export type ChemicalLogFormDefaults = Record<string, string | number | null | undefined>;

function fieldBorder(status: string): SxProps<Theme> {
  if (status === "low" || status === "high") {
    return { "& .MuiOutlinedInput-root fieldset": { borderColor: poolOpsTokens.water.high } };
  }
  if (status === "in_range") {
    return { "& .MuiOutlinedInput-root fieldset": { borderColor: poolOpsTokens.water.balanced } };
  }
  return {};
}

function toFieldString(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return String(value);
}

function buildFieldState(defaults?: ChemicalLogFormDefaults) {
  return {
    ph: toFieldString(defaults?.ph),
    freeChlorine: toFieldString(defaults?.freeChlorine),
    totalChlorine: toFieldString(defaults?.totalChlorine),
    alkalinity: toFieldString(defaults?.alkalinity),
    calciumHardness: toFieldString(defaults?.calciumHardness),
    cyanuricAcid: toFieldString(defaults?.cyanuricAcid),
    tempF: toFieldString(defaults?.tempF),
    filterPsi: toFieldString(defaults?.filterPsi),
    flowGpm: toFieldString(defaults?.flowGpm),
    tdsPpm: toFieldString(defaults?.tdsPpm),
    operatorInitials: toFieldString(defaults?.operatorInitials),
    notes: toFieldString(defaults?.notes),
  };
}

type FieldKey = keyof ReturnType<typeof buildFieldState>;

function labelProps(value: string) {
  return value !== "" ? { InputLabelProps: { shrink: true } } : {};
}

export function ChemicalLogForm({
  action,
  orgId,
  pools,
  defaultPoolId,
  fixedPoolId,
  filterDate,
  returnOrg,
  editId,
  defaults,
}: {
  action: (formData: FormData) => void;
  orgId: string;
  pools: PoolSelectOption[];
  defaultPoolId?: string;
  /** When set, pool is chosen by the page filter — no second dropdown. */
  fixedPoolId?: string;
  filterDate?: string;
  returnOrg?: string;
  editId?: string;
  defaults?: ChemicalLogFormDefaults;
}) {
  const [fields, setFields] = useState(() => buildFieldState(defaults));

  useEffect(() => {
    setFields(buildFieldState(defaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when switching create vs edit target
  }, [editId]);

  const setField = (key: FieldKey) => (value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const activePoolId = fixedPoolId ?? defaultPoolId ?? pools[0]?.id;
  const selectedPool = pools.find((p) => p.id === activePoolId);
  const targets = mergeTargetRanges(selectedPool?.target_ranges) as PoolTargetRanges;

  const lsi = useMemo(() => {
    const p = fields.ph ? Number(fields.ph) : null;
    const t = fields.tempF ? Number(fields.tempF) : null;
    const a = fields.alkalinity ? Number(fields.alkalinity) : null;
    const c = fields.calciumHardness ? Number(fields.calciumHardness) : null;
    const d = fields.tdsPpm ? Number(fields.tdsPpm) : 800;
    if (p == null || t == null || a == null || c == null) return null;
    return calculateLangelierSaturationIndex({ tempF: t, ph: p, alkalinityPpm: a, calciumHardnessPpm: c, tdsPpm: d });
  }, [fields.ph, fields.tempF, fields.alkalinity, fields.calciumHardness, fields.tdsPpm]);

  const formKey = editId ?? "new";

  return (
    <Box key={formKey} component="form" action={action}>
      <input type="hidden" name="orgId" value={orgId} />
      {fixedPoolId ? <input type="hidden" name="returnPoolId" value={fixedPoolId} /> : null}
      {filterDate ? <input type="hidden" name="returnDate" value={filterDate} /> : null}
      {returnOrg ? <input type="hidden" name="returnOrg" value={returnOrg} /> : null}
      {editId ? <input type="hidden" name="id" value={editId} /> : null}
      <Stack spacing={2}>
        {fixedPoolId ? (
          <input type="hidden" name="poolId" value={fixedPoolId} />
        ) : (
          <TextField
            name="poolId"
            label="Pool"
            select
            required
            size="small"
            defaultValue={activePoolId ?? ""}
            fullWidth
            sx={{ maxWidth: 400 }}
            InputLabelProps={{ shrink: true }}
          >
            {pools.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <LsiGauge lsi={lsi} />
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Basics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                name="ph"
                label="pH"
                type="number"
                size="small"
                value={fields.ph}
                onChange={(e) => setField("ph")(e.target.value)}
                inputProps={{ step: "0.01" }}
                fullWidth
                sx={fieldBorder(evaluateMetric(fields.ph ? Number(fields.ph) : null, "ph", targets))}
                {...labelProps(fields.ph)}
              />
              <TextField
                name="freeChlorine"
                label="Free chlorine"
                type="number"
                size="small"
                value={fields.freeChlorine}
                onChange={(e) => setField("freeChlorine")(e.target.value)}
                inputProps={{ step: "0.01" }}
                fullWidth
                {...labelProps(fields.freeChlorine)}
              />
              <TextField
                name="totalChlorine"
                label="Total chlorine"
                type="number"
                size="small"
                value={fields.totalChlorine}
                onChange={(e) => setField("totalChlorine")(e.target.value)}
                inputProps={{ step: "0.01" }}
                fullWidth
                {...labelProps(fields.totalChlorine)}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Balance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <TextField
                name="alkalinity"
                label="Alkalinity"
                type="number"
                size="small"
                value={fields.alkalinity}
                onChange={(e) => setField("alkalinity")(e.target.value)}
                fullWidth
                {...labelProps(fields.alkalinity)}
              />
              <TextField
                name="calciumHardness"
                label="Calcium hardness"
                type="number"
                size="small"
                value={fields.calciumHardness}
                onChange={(e) => setField("calciumHardness")(e.target.value)}
                fullWidth
                {...labelProps(fields.calciumHardness)}
              />
              <TextField
                name="cyanuricAcid"
                label="CYA (ppm)"
                type="number"
                size="small"
                value={fields.cyanuricAcid}
                onChange={(e) => setField("cyanuricAcid")(e.target.value)}
                fullWidth
                {...labelProps(fields.cyanuricAcid)}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>System</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                name="tempF"
                label="Temp (°F)"
                type="number"
                size="small"
                value={fields.tempF}
                onChange={(e) => setField("tempF")(e.target.value)}
                fullWidth
                {...labelProps(fields.tempF)}
              />
              <TextField
                name="filterPsi"
                label="Filter PSI"
                type="number"
                size="small"
                value={fields.filterPsi}
                onChange={(e) => setField("filterPsi")(e.target.value)}
                fullWidth
                {...labelProps(fields.filterPsi)}
              />
              <TextField
                name="flowGpm"
                label="Flow (GPM)"
                type="number"
                size="small"
                value={fields.flowGpm}
                onChange={(e) => setField("flowGpm")(e.target.value)}
                fullWidth
                {...labelProps(fields.flowGpm)}
              />
              <TextField
                name="tdsPpm"
                label="TDS (ppm)"
                type="number"
                size="small"
                value={fields.tdsPpm}
                onChange={(e) => setField("tdsPpm")(e.target.value)}
                fullWidth
                {...labelProps(fields.tdsPpm)}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <TextField
          name="operatorInitials"
          label="Initials"
          size="small"
          value={fields.operatorInitials}
          onChange={(e) => setField("operatorInitials")(e.target.value)}
          sx={{ maxWidth: 120 }}
          {...labelProps(fields.operatorInitials)}
        />
        <TextField
          name="notes"
          label="Notes"
          multiline
          rows={2}
          size="small"
          value={fields.notes}
          onChange={(e) => setField("notes")(e.target.value)}
          fullWidth
          {...labelProps(fields.notes)}
        />

        <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start", minHeight: 48 }}>
          {editId ? "Update log" : "Save log"}
        </Button>
      </Stack>
    </Box>
  );
}
