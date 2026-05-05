import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const metadata = {
  title: "Thank you | Aquatics Empowered",
};

export default function FoundersThanksPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        You&apos;re in. Watch your inbox.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        We saved your founder application and sent a welcome note. A member of our team will reach out within two
        business days with founder pricing and onboarding options.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
        <Button component={Link} href="/" variant="outlined" color="primary">
          Back to home
        </Button>
        <Button component={Link} href="/login" variant="contained" color="primary">
          Sign in
        </Button>
      </Stack>
    </Container>
  );
}
