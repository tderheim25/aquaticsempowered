import { Box, Button, Card, Container, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";

export const metadata = {
  title: "Vendor partners | Aquatics Empowered",
  description:
    "List aquatics, sauna, and hot tub products with Aquatics Empowered. Apply to join our certified vendor network.",
};

const APPLY_MAILTO =
  "mailto:hello@aquaticsempowered.com?subject=" +
  encodeURIComponent("Vendor application — Aquatics Empowered");

const SAMPLE_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    alt: "Resort swimming pool with clear blue water",
    caption: "Pools & aquatics",
  },
  {
    src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
    alt: "Wooden sauna interior with warm lighting",
    caption: "Saunas & steam",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    alt: "Luxury outdoor patio with pool and spa seating",
    caption: "Hot tubs & spas",
  },
] as const;

export default function VendorsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={{ xs: 4, md: 5 }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Typography variant="overline" color="primary">
                For suppliers & manufacturers
              </Typography>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
                Certified vendor network
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
                Promote aquatics, sauna, and hot tub products to operators who care about safety, compliance, and
                water quality. When our directory goes live, verified vendors will be able to showcase equipment,
                chemicals, services, and regional coverage—reach facilities that are already engaged on the platform.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
                <Button variant="contained" size="large" href={APPLY_MAILTO} component="a">
                  Apply as vendor
                </Button>
                <Button variant="outlined" size="large" href="mailto:hello@aquaticsempowered.com" component="a">
                  Ask a question
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                We&apos;ll follow up by email with listing options and verification steps.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 1.5,
                minHeight: { xs: 280, sm: 340 },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  gridColumn: "1 / -1",
                  minHeight: { xs: 160, sm: 200 },
                  boxShadow: 2,
                }}
              >
                <Image
                  src={SAMPLE_IMAGES[0].src}
                  alt={SAMPLE_IMAGES[0].alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </Box>
              <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", minHeight: 120, boxShadow: 2 }}>
                <Image
                  src={SAMPLE_IMAGES[1].src}
                  alt={SAMPLE_IMAGES[1].alt}
                  fill
                  sizes="(max-width: 900px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", minHeight: 120, boxShadow: 2 }}>
                <Image
                  src={SAMPLE_IMAGES[2].src}
                  alt={SAMPLE_IMAGES[2].alt}
                  fill
                  sizes="(max-width: 900px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {[
            {
              title: "Product-ready placements",
              body: "Highlight pools, spas, saunas, chemicals, and equipment with imagery, specs, and contact paths buyers expect.",
            },
            {
              title: "Operators first",
              body: "Your audience is facility teams focused on compliance and water quality—not generic consumer traffic.",
            },
            {
              title: "Verified listings",
              body: "Certified Partner profiles will surface credentials and regions so procurement teams can compare with confidence.",
            },
          ].map((block) => (
            <Grid key={block.title} size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%", p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>
                  {block.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {block.body}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Certified Partner™ directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The Aquatics Empowered Certified Partner™ program is coming soon. Equipment manufacturers, service providers,
            chemical suppliers, and safety partners will be listed here with verified credentials and regional coverage.
            Apply now to get early access and help shape vendor tooling on the platform.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
