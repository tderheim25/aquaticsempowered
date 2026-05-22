import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { Suspense } from "react";

import { VendorDashboardTabs } from "@/components/vendor/VendorDashboardTabs";
import { VendorInquiriesInbox } from "@/components/vendor/VendorInquiriesInbox";
import { VendorProductsManager, type VendorProductItem } from "@/components/vendor/VendorProductsManager";
import { requireVendorForApp } from "@/lib/auth/vendorPortal";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { vendorPublicProfilePath } from "@/lib/vendors/paths";

export const metadata = {
  title: "Vendor dashboard | Aquatics Empowered",
};

export default async function VendorDashboardPage() {
  await requireViewAccess("vendor_portal");
  const { vendor, vendorId } = await requireVendorForApp();
  const supabase = await createClient();

  const { data: productRows } = await supabase
    .from("vendor_products")
    .select("id, name, description, image_url, product_url, is_visible, sort_order, created_at")
    .eq("vendor_id", vendorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const products = (productRows ?? []) as VendorProductItem[];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              Vendor portal
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              {vendor.name}
            </Typography>
            {vendor.tagline ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {vendor.tagline}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              {vendor.category ? <Chip size="small" label={vendor.category} variant="outlined" /> : null}
              <Chip
                size="small"
                label={vendor.listing_visible ? "Listed on marketplace" : "Listing hidden"}
                color={vendor.listing_visible ? "success" : "default"}
                variant="outlined"
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {vendor.slug ? (
              <Button component={Link} href={vendorPublicProfilePath(vendor.slug)} variant="outlined" size="small">
                View public profile
              </Button>
            ) : null}
            {vendor.website_url ? (
              <Button
                component="a"
                href={vendor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                size="small"
              >
                Your website
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Suspense fallback={null}>
          <VendorDashboardTabs
            inquiries={<VendorInquiriesInbox vendorId={vendorId} />}
            products={<VendorProductsManager products={products} />}
          />
        </Suspense>
      </Stack>
    </Box>
  );
}
