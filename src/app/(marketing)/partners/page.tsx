import { Avatar, Card, CardActionArea, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { AdBanner } from "@/components/marketing/AdBanner";
import { MARKETING_PARTNERS } from "@/lib/marketing/partners";

export const metadata = {
  title: "Partners | Aquatics Empowered",
  description: "Organizations that support safer, more sustainable aquatic operations.",
};

export default function PartnersPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <div>
          <Typography variant="overline" color="primary">
            Partners
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            Our partners
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
            Each tile links to that organization&apos;s website. Swap the placeholder partner list for your live roster and
            artwork when ready.
          </Typography>
        </div>

        <AdBanner variant="inline" />

        <Grid container spacing={2}>
          {MARKETING_PARTNERS.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardActionArea component={Link} href={p.websiteUrl} target="_blank" rel="noopener noreferrer" sx={{ height: "100%", p: 1 }}>
                  <CardContent>
                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 88,
                          height: 88,
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                        }}
                      >
                        {p.logoLabel}
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visit website
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
