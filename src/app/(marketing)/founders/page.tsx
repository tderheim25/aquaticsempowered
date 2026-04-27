import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

import { FounderForm } from "@/components/marketing/FounderForm";

export const metadata = {
  title: "Founder Program | Aquatics Empowered",
};

const perks = [
  "Preferred founder pricing & contract terms",
  "Concierge onboarding with our founding team",
  "Early access to chemical logs, maintenance, and support workflows",
  "Seat at the table for roadmap prioritization for your facility type",
];

export default function FoundersPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        Founder Program
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
        We&apos;re onboarding the first 50 aquatic facilities with white-glove support. Tell us about your operation —
        we&apos;ll follow up with founder benefits and next steps.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">
        <Box sx={{ flex: 2, minWidth: 0, width: "100%" }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Apply in two minutes
              </Typography>
              <FounderForm />
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, minWidth: { md: 280 }, width: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            What founders get
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {perks.map((p) => (
              <Typography key={p} component="li" variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {p}
              </Typography>
            ))}
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
