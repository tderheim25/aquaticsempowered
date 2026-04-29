"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          px: 6,
          py: 8,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Aquatics Empowered
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 420 }}>
          Peace of mind for rural pools, city and county aquatics, hotels, schools, therapy water, and every facility in
          between.
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Card sx={{ width: "100%", maxWidth: 440, boxShadow: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            ) : (
              <Box sx={{ mb: 3 }} />
            )}
            {children}
            <Stack direction="row" spacing={1} sx={{ mt: 3 }} justifyContent="center">
              <Typography variant="caption" color="text.secondary">
                <Link href="/" style={{ color: "inherit" }}>
                  ← Back to home
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
