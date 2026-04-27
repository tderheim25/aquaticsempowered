import { Box, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import { SentryThrow } from "./SentryThrow";

export default function SentryTestPage() {
  const allow =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_ROUTES === "true";
  if (!allow) {
    notFound();
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Dev: Sentry / error boundary test
      </Typography>
      <SentryThrow />
    </Box>
  );
}
