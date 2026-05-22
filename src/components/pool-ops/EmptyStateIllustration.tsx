"use client";

import { Box, Typography } from "@mui/material";

export function EmptyStateIllustration({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      <Box
        sx={{
          width: 120,
          height: 48,
          mx: "auto",
          mb: 2,
          borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
          bgcolor: "primary.main",
          opacity: 0.12,
        }}
      />
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 360, mx: "auto" }}>
        {description}
      </Typography>
      {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
    </Box>
  );
}
