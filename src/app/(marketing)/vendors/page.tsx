import { Alert, Box, Button, Card, Container, Stack, TextField, Typography } from "@mui/material";
import { submitVendorApplicationAction } from "@/app/(marketing)/vendors/actions";
import { VendorLogoLoop } from "@/components/marketing/VendorLogoLoop";
import { VendorMarketplace } from "@/components/marketing/VendorMarketplace";
import { loadVendorMarketplace } from "@/lib/vendors/loadVendorMarketplace";

export const metadata = {
  title: "Vendor partners | Aquatics Empowered",
  description:
    "Browse aquatics vendor products and apply to join our certified partner network for pools, saunas, and spas.",
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ apply?: string }>;
}) {
  const { apply } = await searchParams;
  const { products, loopVendors } = await loadVendorMarketplace();

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 4, md: 5 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              Vendor marketplace
            </Typography>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Products from certified partners
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Browse equipment, chemicals, and services from approved aquatics vendors — curated for facility operators.
            </Typography>
          </Stack>

          <VendorMarketplace products={products} />

          <Card
            id="vendor-apply"
            variant="outlined"
            sx={{
              p: { xs: 2.5, md: 3 },
              borderWidth: 2,
              borderColor: "primary.main",
              scrollMarginTop: 96,
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 0.5 }}>
              Become a vendor partner
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 640 }}>
              Submit your company for review. Approved partners are listed by Aquatics Empowered staff and can showcase
              products on this marketplace.
            </Typography>

            {apply === "submitted" ? (
              <Alert severity="success" sx={{ mb: 2, maxWidth: 560 }}>
                Thank you — your application was received. We will review your inquiry and follow up by email.
              </Alert>
            ) : null}
            {apply === "error" || apply === "invalid" ? (
              <Alert severity="error" sx={{ mb: 2, maxWidth: 560 }}>
                Could not submit your application. Please complete required fields below and try again.
              </Alert>
            ) : null}

            <Stack component="form" action={submitVendorApplicationAction} spacing={2} sx={{ maxWidth: 560 }}>
              <TextField name="company_name" label="Company name" required fullWidth />
              <TextField name="contact_name" label="Contact name" required fullWidth />
              <TextField name="email" label="Business email" type="email" required fullWidth />
              <TextField name="phone" label="Phone" type="tel" fullWidth />
              <TextField
                name="category"
                label="Category"
                placeholder="e.g. chemicals, pumps, saunas, services"
                fullWidth
              />
              <TextField
                name="website_url"
                label="Company website"
                type="url"
                placeholder="https://yourcompany.com"
                fullWidth
              />
              <TextField
                name="message"
                label="Your inquiry"
                required
                multiline
                rows={5}
                fullWidth
                placeholder="Describe your products, certifications, territories, and what you hope to promote on the platform."
              />
              <Button type="submit" variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>
                Submit application
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>

      <Box sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, sm: 3, md: 4 } }}>
          <VendorLogoLoop vendors={loopVendors} />
        </Container>
      </Box>
    </Box>
  );
}
