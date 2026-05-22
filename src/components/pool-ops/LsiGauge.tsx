"use client";

import { Box, Typography } from "@mui/material";

import { poolOpsTokens } from "@/theme/poolOpsTokens";

function lsiColor(lsi: number | null): string {
  if (lsi == null) return poolOpsTokens.water.unknown;
  if (lsi < -0.3) return poolOpsTokens.water.lsiCorrosive;
  if (lsi > 0.3) return poolOpsTokens.water.lsiScale;
  return poolOpsTokens.water.lsiBalanced;
}

function lsiLabel(lsi: number | null): string {
  if (lsi == null) return "LSI —";
  if (lsi < -0.3) return "Corrosive tendency";
  if (lsi > 0.3) return "Scale-forming";
  return "Balanced";
}

export function LsiGauge({ lsi, size = 120 }: { lsi: number | null; size?: number }) {
  const color = lsiColor(lsi);
  const pct = lsi == null ? 0.5 : Math.min(1, Math.max(0, (lsi + 1) / 2));
  const needleDeg = -90 + pct * 180;

  return (
    <Box
      role="meter"
      aria-valuenow={lsi ?? undefined}
      aria-label={`Langelier Saturation Index: ${lsiLabel(lsi)}`}
      sx={{ width: size, textAlign: "center" }}
    >
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size / 2,
          mx: "auto",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            border: `8px solid ${color}33`,
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            transform: "rotate(-45deg)",
            boxSizing: "border-box",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: 4,
            height: size / 2 - 12,
            bgcolor: color,
            transformOrigin: "bottom center",
            transform: `translateX(-50%) rotate(${needleDeg}deg)`,
            transition: "transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: 2,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color, mt: 0.5 }}>
        {lsi != null ? lsi.toFixed(2) : "—"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {lsiLabel(lsi)}
      </Typography>
    </Box>
  );
}
