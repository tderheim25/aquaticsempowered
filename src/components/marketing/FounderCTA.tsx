import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";

import { TrackedButton } from "@/components/marketing/TrackedButton";

export function FounderCTA() {
  return (
    <Box sx={{ py: 6, bgcolor: "secondary.main", color: "secondary.contrastText" }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Be among the first 50 founder facilities
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
          Preferred pricing, concierge onboarding, and a direct voice in the roadmap.
        </Typography>
        <TrackedButton
          component={Link}
          href="/founders"
          variant="contained"
          color="primary"
          size="large"
          eventName="cta_click_founders"
          eventProps={{ location: "founder_banner" }}
        >
          Apply for founder access
        </TrackedButton>
      </Container>
    </Box>
  );
}
