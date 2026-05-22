"use client";

import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import SouthEastRoundedIcon from "@mui/icons-material/SouthEastRounded";
import { Box, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import { softUiTokens, type SoftAccent } from "@/theme/softUiTokens";

/**
 * Radial progress ring with a directional arrow in the center.
 * Trend "up" = saturated accent + outward arrow; "down" = same accent
 * but a southeast arrow to signal decline. Progress is a 0–100 number.
 */
function RadialIndicator({
  accent,
  progress,
  trend = "up",
  size = 52,
  strokeWidth = 5,
}: {
  accent: SoftAccent;
  progress: number;
  trend?: "up" | "down";
  size?: number;
  strokeWidth?: number;
}) {
  const palette = softUiTokens.accent[accent];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.soft}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: palette.ring,
        }}
      >
        {trend === "up" ? (
          <ArrowOutwardRoundedIcon sx={{ fontSize: size * 0.42 }} />
        ) : (
          <SouthEastRoundedIcon sx={{ fontSize: size * 0.42 }} />
        )}
      </Box>
    </Box>
  );
}

export type SoftStatCardProps = {
  label: string;
  value: string | number;
  /** Optional helper line under the value. */
  hint?: string;
  /** Accent color from the soft palette. Defaults to "aqua". */
  accent?: SoftAccent;
  /** Progress 0-100 for the radial ring. Defaults to 72. */
  progress?: number;
  /** Visual trend direction the arrow points (up = positive). */
  trend?: "up" | "down";
  /** When provided, the card becomes a `next/link`. */
  href?: string;
  /** Optional leading icon, displayed inline next to the label. */
  icon?: ReactNode;
};

export function SoftStatCard({
  label,
  value,
  hint,
  accent = "aqua",
  progress = 72,
  trend = "up",
  href,
  icon,
}: SoftStatCardProps) {
  const palette = softUiTokens.accent[accent];

  return (
    <Paper
      elevation={0}
      component={href ? Link : "div"}
      href={href}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${softUiTokens.radius.card}px`,
        bgcolor: softUiTokens.background.card,
        border: "1px solid rgba(15, 35, 54, 0.05)",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        position: "relative",
        overflow: "hidden",
        boxShadow: softUiTokens.shadow.card,
        transition: (t) =>
          t.transitions.create(["transform", "box-shadow"], {
            duration: t.transitions.duration.shorter,
          }),
        "&:hover": href
          ? {
              transform: "translateY(-3px)",
              boxShadow: softUiTokens.shadow.cardHover,
            }
          : {},
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {icon ? (
              <Box
                sx={{
                  color: palette.ring,
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "1rem",
                }}
              >
                {icon}
              </Box>
            ) : null}
            <Typography
              variant="overline"
              sx={{
                color: softUiTokens.text.muted,
                fontWeight: 700,
                letterSpacing: "0.12em",
                lineHeight: 1.4,
              }}
            >
              {label}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta), var(--font-inter), sans-serif",
              fontWeight: 800,
              fontSize: { xs: "1.75rem", md: "2rem" },
              lineHeight: 1.1,
              color: softUiTokens.text.primary,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </Typography>
          {hint ? (
            <Typography
              variant="caption"
              sx={{
                color: softUiTokens.text.secondary,
                mt: 0.25,
                display: "block",
                lineHeight: 1.45,
              }}
            >
              {hint}
            </Typography>
          ) : null}
        </Stack>
        <RadialIndicator accent={accent} progress={progress} trend={trend} />
      </Stack>
    </Paper>
  );
}
