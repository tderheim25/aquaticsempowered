"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Fade } from "@mui/material";
import type { ReactNode } from "react";

import { poolOpsTokens } from "@/theme/poolOpsTokens";

export function PoolOpsPageShell({
  title,
  subtitle,
  accent = "pools",
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: keyof typeof poolOpsTokens.accent;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const color = poolOpsTokens.accent[accent];
  return (
    <Fade in timeout={200}>
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box sx={{ borderLeft: `4px solid ${color}`, pl: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {actions ? <Box>{actions}</Box> : null}
        </Stack>
        {children}
      </Box>
    </Fade>
  );
}
