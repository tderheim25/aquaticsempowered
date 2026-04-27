import { Box, Typography } from "@mui/material";
import { notFound } from "next/navigation";

export default function DevTestAuthPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Dev: auth session probe
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This route only exists outside production. Use it to verify Supabase cookies after magic-link sign-in.
      </Typography>
    </Box>
  );
}
