"use client";

import { Box, Fade, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { SoftStatCard } from "@/components/ui/SoftStatCard";
import { softUiTokens, type SoftAccent } from "@/theme/softUiTokens";

export function AeConsoleSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 0.5 }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontSize: { xs: "1.5rem", md: "1.875rem" },
            color: softUiTokens.text.primary,
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, maxWidth: 560, color: softUiTokens.text.secondary }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

export function AeConsolePanel({
  children,
  noPadding,
  sx,
}: {
  children: ReactNode;
  noPadding?: boolean;
  sx?: object;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid rgba(15, 35, 54, 0.06)",
        borderRadius: `${softUiTokens.radius.card}px`,
        bgcolor: softUiTokens.background.card,
        overflow: "hidden",
        boxShadow: softUiTokens.shadow.card,
        ...(noPadding ? {} : { p: { xs: 2, md: 2.5 } }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

const LEGACY_ACCENT_TO_SOFT: Record<
  "primary" | "secondary" | "warning" | "default",
  SoftAccent
> = {
  primary: "navy",
  secondary: "aqua",
  warning: "amber",
  default: "violet",
};

/**
 * Backwards-compatible stat card. Existing call sites pass `accent`
 * using the legacy MUI palette names; we map them to soft-UI accents
 * so the new design lights up without touching every consumer.
 */
export function AeConsoleStatCard({
  label,
  value,
  hint,
  accent = "primary",
  href,
  progress,
  trend = "up",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "secondary" | "warning" | "default";
  href?: string;
  progress?: number;
  trend?: "up" | "down";
}) {
  return (
    <SoftStatCard
      label={label}
      value={value}
      hint={hint}
      accent={LEGACY_ACCENT_TO_SOFT[accent]}
      href={href}
      progress={progress}
      trend={trend}
    />
  );
}

export function AeConsoleContentFrame({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  return (
    <Fade in key={sectionKey} timeout={320} appear>
      <Box sx={{ width: "100%" }}>{children}</Box>
    </Fade>
  );
}
