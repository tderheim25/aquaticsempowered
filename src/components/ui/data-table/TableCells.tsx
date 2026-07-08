"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { formatTableDate, formatTableTime } from "@/lib/formatTableDateTime";

export function TablePrimaryCell({
  primary,
  secondary,
  monogram,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  /** Optional 1–2 letter monogram block before the title (avatar-style). */
  monogram?: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      {monogram ? (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "primary.main",
            bgcolor: (theme) => theme.palette.action.hover,
            border: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {monogram.slice(0, 2)}
        </Box>
      ) : null}
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
          }}
        >
          {primary}
        </Typography>
        {secondary ? (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ maxWidth: 280, display: "block", fontSize: "0.75rem" }}
          >
            {secondary}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function TableDateTimeCell({ iso }: { iso: string }) {
  let date = iso;
  let time = "";
  try {
    date = formatTableDate(iso);
    time = formatTableTime(iso);
  } catch {
    /* keep raw */
  }
  return (
    <Stack spacing={0.15} sx={{ fontVariantNumeric: "tabular-nums" }}>
      <Typography component="div" variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
        {date}
      </Typography>
      {time ? (
        <Typography component="div" variant="caption" color="text.secondary">
          {time}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function TableMutedCell({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

/** Right-aligned tabular numeric value with optional unit. */
export function TableNumericCell({
  value,
  unit,
  tone = "default",
}: {
  value: ReactNode;
  unit?: string;
  tone?: "default" | "muted" | "strong";
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.5,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"',
        color: tone === "muted" ? "text.secondary" : "text.primary",
        fontWeight: tone === "strong" ? 700 : 500,
        fontSize: "0.875rem",
      }}
    >
      <span>{value}</span>
      {unit ? (
        <Box component="span" sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 500 }}>
          {unit}
        </Box>
      ) : null}
    </Box>
  );
}

/** Wraps row action buttons; fades in on row hover via the theme's `.row-actions` rule. */
export function TableRowActions({ children }: { children: ReactNode }) {
  return (
    <Box
      className="row-actions"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        justifyContent: "flex-end",
      }}
    >
      {children}
    </Box>
  );
}
