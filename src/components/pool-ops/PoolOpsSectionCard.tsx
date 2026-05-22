"use client";

import { Box, Paper, type PaperProps } from "@mui/material";
import { Grow } from "@mui/material";

import { poolOpsTokens } from "@/theme/poolOpsTokens";
import { staggerDelay } from "@/lib/motion/poolOpsMotion";

export function PoolOpsSectionCard({
  accent = "pools",
  index = 0,
  children,
  ...paperProps
}: PaperProps & {
  accent?: keyof typeof poolOpsTokens.accent;
  index?: number;
}) {
  const color = poolOpsTokens.accent[accent];
  return (
    <Grow in timeout={320} style={{ transformOrigin: "top left" }}>
      <Paper
        variant="outlined"
        {...paperProps}
        sx={{
          p: 2,
          borderLeft: `4px solid ${color}`,
          transition: "box-shadow 200ms ease, transform 120ms ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          "&:hover": {
            boxShadow: "0 4px 12px rgba(15,23,42,0.1)",
            "@media (prefers-reduced-motion: reduce)": { boxShadow: undefined },
          },
          ...paperProps.sx,
        }}
      >
        <Box sx={{ transitionDelay: `${staggerDelay(index)}ms` }}>{children}</Box>
      </Paper>
    </Grow>
  );
}
