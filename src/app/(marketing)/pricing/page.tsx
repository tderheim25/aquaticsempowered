import { Container, Typography } from "@mui/material";

import { PricingTeaser } from "@/components/marketing/PricingTeaser";

export const metadata = {
  title: "Pricing | Aquatics Empowered",
};

export default function PricingPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Pricing
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Four membership levels from free community access to enterprise monitoring and advisory. Founder pricing
        available for early facilities.
      </Typography>
      <PricingTeaser />
    </Container>
  );
}
