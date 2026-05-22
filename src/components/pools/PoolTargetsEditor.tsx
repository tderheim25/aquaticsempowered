"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { DEFAULT_TARGET_RANGES } from "@/lib/water/defaultTargetRanges";
import type { PoolTargetRanges } from "@/types/database";

const METRICS = [
  { key: "ph", label: "pH" },
  { key: "free_chlorine", label: "Free chlorine (ppm)" },
  { key: "total_alkalinity", label: "Total alkalinity (ppm)" },
  { key: "calcium_hardness", label: "Calcium hardness (ppm)" },
  { key: "cyanuric_acid", label: "CYA (ppm)" },
  { key: "temp_f", label: "Temperature (°F)" },
] as const;

export function PoolTargetsEditor({
  poolId,
  targets,
  saveAction,
}: {
  poolId: string;
  targets: PoolTargetRanges;
  saveAction: (formData: FormData) => void;
}) {
  const merged = { ...DEFAULT_TARGET_RANGES, ...targets };
  const [json, setJson] = useState(JSON.stringify(merged, null, 2));

  return (
    <form action={saveAction}>
      <input type="hidden" name="id" value={poolId} />
      <input type="hidden" name="target_ranges" value={json} />
      <Stack spacing={2} maxWidth={720}>
        <Typography variant="body2" color="text.secondary">
          Ideal bands used for highlighting, monitoring alerts, and the dosing calculator.
        </Typography>
        {METRICS.map((m) => {
          const band = merged[m.key];
          if (!band) return null;
          return (
            <Stack key={m.key} direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Typography sx={{ minWidth: 200, pt: 1 }} variant="subtitle2">
                {m.label}
              </Typography>
              <TextField
                size="small"
                label="Min"
                type="number"
                defaultValue={band.min}
                onChange={(e) => {
                  const next = { ...merged, [m.key]: { ...band, min: Number(e.target.value) } };
                  setJson(JSON.stringify(next));
                }}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                label="Max"
                type="number"
                defaultValue={band.max}
                onChange={(e) => {
                  const next = { ...merged, [m.key]: { ...band, max: Number(e.target.value) } };
                  setJson(JSON.stringify(next));
                }}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                label="Ideal"
                type="number"
                defaultValue={band.ideal ?? ""}
                onChange={(e) => {
                  const next = {
                    ...merged,
                    [m.key]: { ...band, ideal: Number(e.target.value) },
                  };
                  setJson(JSON.stringify(next));
                }}
                sx={{ width: 100 }}
              />
            </Stack>
          );
        })}
        <Button type="submit" variant="contained">
          Save targets
        </Button>
      </Stack>
    </form>
  );
}
