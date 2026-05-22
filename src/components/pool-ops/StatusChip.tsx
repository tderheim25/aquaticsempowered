"use client";

import { Chip } from "@mui/material";

import type { ReadingStatus } from "@/lib/water/evaluateReading";
import { poolOpsTokens } from "@/theme/poolOpsTokens";

const LABEL: Record<ReadingStatus, string> = {
  in_range: "In range",
  low: "Low",
  high: "High",
  unknown: "—",
};

const COLOR: Record<ReadingStatus, string> = {
  in_range: poolOpsTokens.water.balanced,
  low: poolOpsTokens.water.low,
  high: poolOpsTokens.water.high,
  unknown: poolOpsTokens.water.unknown,
};

export function StatusChip({ status, label }: { status: ReadingStatus; label?: string }) {
  return (
    <Chip
      size="small"
      label={label ?? LABEL[status]}
      sx={{
        bgcolor: `${COLOR[status]}18`,
        color: COLOR[status],
        fontWeight: 600,
        transition: "background-color 200ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    />
  );
}
