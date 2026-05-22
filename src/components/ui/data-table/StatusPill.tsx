"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export type StatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "primary"
  | "purple"
  | "orange";

const TONE_STYLES: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
  success: { bg: "rgba(16, 185, 129, 0.12)", fg: "#047857", dot: "#10b981" },
  warning: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", dot: "#f59e0b" },
  error: { bg: "rgba(244, 63, 94, 0.12)", fg: "#be123c", dot: "#f43f5e" },
  info: { bg: "rgba(59, 130, 246, 0.12)", fg: "#1d4ed8", dot: "#3b82f6" },
  neutral: { bg: "rgba(100, 116, 139, 0.12)", fg: "#475569", dot: "#94a3b8" },
  primary: { bg: "rgba(0, 59, 111, 0.1)", fg: "#003b6f", dot: "#003b6f" },
  purple: { bg: "rgba(139, 92, 246, 0.12)", fg: "#6d28d9", dot: "#8b5cf6" },
  orange: { bg: "rgba(249, 115, 22, 0.12)", fg: "#c2410c", dot: "#f97316" },
};

export function statusToneFromLabel(label: string): StatusTone {
  const s = label.toLowerCase();
  if (["approved", "completed", "done", "resolved", "visible", "active", "paid", "success"].some((k) => s.includes(k))) {
    return "success";
  }
  if (["pending", "open", "in progress", "in_progress", "in query"].some((k) => s.includes(k))) {
    return s.includes("open") ? "warning" : "orange";
  }
  if (["rejected", "blocked", "error", "hidden", "cancelled", "closed"].some((k) => s.includes(k))) {
    return s.includes("closed") && !s.includes("block") ? "neutral" : "error";
  }
  if (["shipping", "ship"].some((k) => s.includes(k))) return "purple";
  if (["draft", "unpaid"].some((k) => s.includes(k))) return "neutral";
  return "info";
}

export function StatusPill({
  label,
  tone,
  dot = true,
  size = "small",
}: {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  size?: "small" | "medium";
}) {
  const t = tone ?? statusToneFromLabel(label);
  const palette = TONE_STYLES[t];
  const py = size === "medium" ? 0.65 : 0.45;
  const px = size === "medium" ? 1.35 : 1.1;
  const fontSize = size === "medium" ? "0.8125rem" : "0.75rem";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        py,
        px,
        borderRadius: 999,
        bgcolor: palette.bg,
        color: palette.fg,
        fontWeight: 600,
        fontSize,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        border: "1px solid",
        borderColor: alpha(palette.dot, 0.12),
      }}
    >
      {dot ? (
        <Box
          component="span"
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: palette.dot,
            flexShrink: 0,
          }}
        />
      ) : null}
      <Typography component="span" variant="inherit" sx={{ font: "inherit", color: "inherit" }}>
        {label}
      </Typography>
    </Box>
  );
}
