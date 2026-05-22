"use client";

import { Alert, Box, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import { LsiGauge } from "@/components/pool-ops/LsiGauge";
import { PoolOpsSectionCard } from "@/components/pool-ops/PoolOpsSectionCard";
import { calculateDosing } from "@/lib/water/dosingCalculator";
import { calculateShock } from "@/lib/water/shockCalculator";
import { mergeTargetRanges } from "@/lib/water/defaultTargetRanges";
import type { PoolTargetRanges } from "@/types/database";

export type CalculatorReading = {
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  calcium_hardness: number | null;
  cyanuric_acid_ppm: number | null;
  langelier_saturation_index: number | null;
};

export function ChemistryCalculatorPanel({
  poolName,
  volumeGallons,
  targetRanges,
  reading,
}: {
  poolName: string;
  volumeGallons: number | null;
  targetRanges?: unknown;
  reading: CalculatorReading | null;
}) {
  const targets = mergeTargetRanges(targetRanges) as PoolTargetRanges;

  const dosing = useMemo(() => {
    if (!reading || !volumeGallons) return [];
    return calculateDosing({
      volumeGallons,
      ph: reading.ph,
      freeChlorine: reading.free_chlorine,
      totalAlkalinity: reading.alkalinity,
      calciumHardness: reading.calcium_hardness,
      cyanuricAcid: reading.cyanuric_acid_ppm,
      targets: {
        ph: targets.ph,
        free_chlorine: targets.free_chlorine,
        total_alkalinity: targets.total_alkalinity,
        calcium_hardness: targets.calcium_hardness,
        cyanuric_acid: targets.cyanuric_acid,
      },
    });
  }, [reading, volumeGallons, targets]);

  const shock = useMemo(() => {
    if (!reading || !volumeGallons || reading.free_chlorine == null || reading.total_chlorine == null) {
      return null;
    }
    return calculateShock({
      volumeGallons,
      freeChlorine: reading.free_chlorine,
      totalChlorine: reading.total_chlorine,
    });
  }, [reading, volumeGallons]);

  if (!reading) {
    return (
      <Alert severity="info">
        No chemical log for {poolName} yet. Log a reading first to see dosing suggestions.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <PoolOpsSectionCard accent="chemistry">
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Latest reading — {poolName}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <LsiGauge lsi={reading.langelier_saturation_index} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          pH {reading.ph ?? "—"} · FC {reading.free_chlorine ?? "—"} ppm · TA {reading.alkalinity ?? "—"} ppm
        </Typography>
      </PoolOpsSectionCard>

      <PoolOpsSectionCard accent="chemistry" index={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Dosing suggestions
        </Typography>
        {!volumeGallons ? (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Set pool volume on the pool record for volume-based estimates.
          </Alert>
        ) : null}
        {dosing.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No adjustments suggested against current targets. Always verify with product labels and local SOPs.
          </Typography>
        ) : (
          <List dense disablePadding>
            {dosing.map((d) => (
              <ListItem key={d.chemical} disableGutters>
                <ListItemText
                  primary={`${d.chemical}: ${d.amount} ${d.unit}`}
                  secondary={d.note}
                />
              </ListItem>
            ))}
          </List>
        )}
      </PoolOpsSectionCard>

      {shock ? (
        <PoolOpsSectionCard accent="chemistry" index={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Shock / breakpoint
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {shock.message}
          </Typography>
          {shock.needed ? (
            <Typography variant="body2">
              Estimated liquid chlorine (12.5%): <strong>{shock.shockOzLiquid12} fl oz</strong>
            </Typography>
          ) : null}
        </PoolOpsSectionCard>
      ) : null}

      <Typography variant="caption" color="text.secondary">
        Informational estimates only — not a substitute for certified operator judgment or manufacturer instructions.
      </Typography>
    </Stack>
  );
}
