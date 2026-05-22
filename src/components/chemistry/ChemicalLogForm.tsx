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
import { useMemo, useState } from "react";

import { LsiGauge } from "@/components/pool-ops/LsiGauge";
import { calculateLangelierSaturationIndex } from "@/lib/water/calculateLsi";
import type { PoolTargetRanges } from "@/types/database";

import { evaluateMetric } from "@/lib/water/evaluateReading";
import { mergeTargetRanges } from "@/lib/water/defaultTargetRanges";
import { poolOpsTokens } from "@/theme/poolOpsTokens";

export type PoolSelectOption = { id: string; name: string; target_ranges?: unknown };

function fieldBorder(status: string): SxProps<Theme> {
  if (status === "low" || status === "high") {
    return { "& .MuiOutlinedInput-root fieldset": { borderColor: poolOpsTokens.water.high } };
  }
  if (status === "in_range") {
    return { "& .MuiOutlinedInput-root fieldset": { borderColor: poolOpsTokens.water.balanced } };
  }
  return {};
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
  defaults?: Record<string, string | number | null | undefined>;
}) {
  const [ph, setPh] = useState(defaults?.ph?.toString() ?? "");
  const [tempF, setTempF] = useState(defaults?.tempF?.toString() ?? "");
  const [alk, setAlk] = useState(defaults?.alkalinity?.toString() ?? "");
  const [ch, setCh] = useState(defaults?.calciumHardness?.toString() ?? "");
  const [tds, setTds] = useState(defaults?.tdsPpm?.toString() ?? "");

  const activePoolId = fixedPoolId ?? defaultPoolId ?? pools[0]?.id;
  const selectedPool = pools.find((p) => p.id === activePoolId);
  const targets = mergeTargetRanges(selectedPool?.target_ranges) as PoolTargetRanges;

  const lsi = useMemo(() => {
    const p = ph ? Number(ph) : null;
    const t = tempF ? Number(tempF) : null;
    const a = alk ? Number(alk) : null;
    const c = ch ? Number(ch) : null;
    const d = tds ? Number(tds) : 800;
    if (p == null || t == null || a == null || c == null) return null;
    return calculateLangelierSaturationIndex({ tempF: t, ph: p, alkalinityPpm: a, calciumHardnessPpm: c, tdsPpm: d });
  }, [ph, tempF, alk, ch, tds]);

  return (
    <Box component="form" action={action}>
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
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                inputProps={{ step: "0.01" }}
                fullWidth
                sx={fieldBorder(evaluateMetric(ph ? Number(ph) : null, "ph", targets))}
              />
              <TextField name="freeChlorine" label="Free chlorine" type="number" defaultValue={defaults?.freeChlorine ?? ""} inputProps={{ step: "0.01" }} fullWidth />
              <TextField name="totalChlorine" label="Total chlorine" type="number" defaultValue={defaults?.totalChlorine ?? ""} inputProps={{ step: "0.01" }} fullWidth />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Balance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <TextField name="alkalinity" label="Alkalinity" type="number" value={alk} onChange={(e) => setAlk(e.target.value)} fullWidth />
              <TextField name="calciumHardness" label="Calcium hardness" type="number" value={ch} onChange={(e) => setCh(e.target.value)} fullWidth />
              <TextField name="cyanuricAcid" label="CYA (ppm)" type="number" defaultValue={defaults?.cyanuricAcid ?? ""} fullWidth />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>System</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField name="tempF" label="Temp (°F)" type="number" value={tempF} onChange={(e) => setTempF(e.target.value)} fullWidth />
              <TextField name="filterPsi" label="Filter PSI" type="number" defaultValue={defaults?.filterPsi ?? ""} fullWidth />
              <TextField name="flowGpm" label="Flow (GPM)" type="number" defaultValue={defaults?.flowGpm ?? ""} fullWidth />
              <TextField name="tdsPpm" label="TDS (ppm)" type="number" value={tds} onChange={(e) => setTds(e.target.value)} fullWidth />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <TextField name="operatorInitials" label="Initials" size="small" defaultValue={defaults?.operatorInitials ?? ""} sx={{ maxWidth: 120 }} />
        <TextField name="notes" label="Notes" multiline rows={2} defaultValue={defaults?.notes ?? ""} fullWidth />

        <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start", minHeight: 48 }}>
          {editId ? "Update log" : "Save log"}
        </Button>
      </Stack>
    </Box>
  );
}
