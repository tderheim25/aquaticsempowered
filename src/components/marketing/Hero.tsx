import { Box, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { TrackedButton } from "@/components/marketing/TrackedButton";

export function Hero() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: "linear-gradient(135deg, #003B6F 0%, #0a4d8c 45%, #2EA5A0 100%)",
        color: "common.white",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3} maxWidth={720}>
          <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.9 }}>
            Operating system for aquatic facilities
          </Typography>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            The operating system for aquatic facilities
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.95, maxWidth: 640 }}>
            Protect pools, cut operating costs, improve safety, and extend facility life — so communities keep
            access to water they depend on.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} pt={1}>
            <TrackedButton
              component={Link}
              href="/founders"
              variant="contained"
              color="secondary"
              size="large"
              eventName="cta_click_founders"
              eventProps={{ location: "hero_primary" }}
              sx={{ px: 3 }}
            >
              Join the Founder Program
            </TrackedButton>
            <TrackedButton
              component={Link}
              href="/pricing"
              variant="outlined"
              size="large"
              eventName="cta_click_pricing"
              eventProps={{ location: "hero_secondary" }}
              sx={{ px: 3, borderColor: "rgba(255,255,255,0.7)", color: "common.white" }}
            >
              View pricing
            </TrackedButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
