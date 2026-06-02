import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { AdBanner } from "@/components/marketing/AdBanner";

export function SiteFooter() {
  return (
    <Box component="footer" sx={{ mt: 8 }}>
      <Container maxWidth="lg" sx={{ pb: 2 }}>
        <AdBanner variant="inline" />
      </Container>
      <Box sx={{ py: 6, bgcolor: "primary.main", color: "primary.contrastText" }}>
        <Container maxWidth="lg">
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            © {new Date().getFullYear()} Aquatics Empowered™. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={2}>
            <MuiLink component={Link} href="/pricing" color="inherit" underline="hover">
              Pricing
            </MuiLink>
            <MuiLink component={Link} href="/vendors" color="inherit" underline="hover">
              Vendors
            </MuiLink>
            <MuiLink component={Link} href="/founders" color="inherit" underline="hover">
              Founders
            </MuiLink>
            <MuiLink component={Link} href="/terms" color="inherit" underline="hover">
              Terms
            </MuiLink>
            <MuiLink component={Link} href="/privacy" color="inherit" underline="hover">
              Privacy
            </MuiLink>
            <MuiLink href="mailto:hello@aquaticsempowered.com" color="inherit" underline="hover">
              Contact
            </MuiLink>
          </Stack>
        </Stack>
        </Container>
      </Box>
    </Box>
  );
}
