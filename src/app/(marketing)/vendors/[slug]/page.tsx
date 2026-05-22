import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { notFound } from "next/navigation";

import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: vendor } = await supabase.from("vendors").select("name").eq("slug", slug).eq("listing_visible", true).maybeSingle();
  return { title: vendor ? `${vendor.name} | Vendors` : "Vendor" };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, slug, tagline, description, logo_url, website_url, category")
    .eq("slug", slug)
    .eq("listing_visible", true)
    .maybeSingle();

  if (!vendor) notFound();

  const logoUrl = resolveVendorImageUrl(vendor.logo_url);

  const { data: products } = await supabase
    .from("vendor_products")
    .select("id, name, description, image_url, product_url")
    .eq("vendor_id", vendor.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          {logoUrl ? (
            <Box sx={{ position: "relative", width: 120, height: 120, borderRadius: 2, overflow: "hidden" }}>
              <Image src={logoUrl} alt="" fill style={{ objectFit: "contain" }} />
            </Box>
          ) : null}
          <Stack spacing={1}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {vendor.name}
            </Typography>
            {vendor.tagline ? (
              <Typography variant="body1" color="text.secondary">
                {vendor.tagline}
              </Typography>
            ) : null}
            {vendor.website_url ? (
              <Button component="a" href={vendor.website_url} target="_blank" rel="noopener noreferrer" variant="outlined" size="small">
                Visit website
              </Button>
            ) : null}
          </Stack>
        </Stack>
        {vendor.description ? (
          <Typography variant="body1" color="text.secondary">
            {vendor.description}
          </Typography>
        ) : null}
        {(products ?? []).length > 0 ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Products & services
            </Typography>
            <Grid container spacing={2}>
              {(products ?? []).map((p) => (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack spacing={1} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2, height: "100%" }}>
                    {resolveVendorImageUrl(p.image_url) ? (
                      <Box sx={{ position: "relative", width: "100%", height: 140, borderRadius: 1, overflow: "hidden" }}>
                        <Image src={resolveVendorImageUrl(p.image_url)!} alt="" fill style={{ objectFit: "cover" }} />
                      </Box>
                    ) : null}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {p.name}
                    </Typography>
                    {p.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {p.description}
                      </Typography>
                    ) : null}
                    {p.product_url ? (
                      <Button component="a" href={p.product_url} target="_blank" rel="noopener noreferrer" size="small">
                        Learn more
                      </Button>
                    ) : null}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
