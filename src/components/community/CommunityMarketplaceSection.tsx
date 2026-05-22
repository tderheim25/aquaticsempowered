"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import type { LoadedCommunityMarketplace } from "@/lib/community/loadCommunityMarketplaceData";
import type { MarketplaceProduct, MarketplaceVendorGroup } from "@/lib/vendors/loadVendorMarketplace";
import { vendorPublicProfilePath } from "@/lib/vendors/paths";

import { VendorMarketplace } from "@/components/marketing/VendorMarketplace";

import {
  BRAND_NAVY_TINT_02,
  COMMUNITY_BRAND_GRADIENT,
  communityContainedButtonSx,
  communitySectionTitleSx,
  communitySurfacePaperSx,
} from "./communityUi";

export type CommunityMarketplaceSectionProps = {
  variant: "full" | "preview";
  marketplace: LoadedCommunityMarketplace;
  previewVendorLimit?: number;
  previewProductsPerVendor?: number;
  signedIn?: boolean;
};

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function VendorLogo({ vendor }: { vendor: MarketplaceVendorGroup }) {
  if (vendor.logo_url) {
    return (
      <Box
        sx={{
          position: "relative",
          width: 48,
          height: 48,
          borderRadius: 1.5,
          overflow: "hidden",
          flexShrink: 0,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Image src={vendor.logo_url} alt="" fill sizes="48px" style={{ objectFit: "contain" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 1.5,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: COMMUNITY_BRAND_GRADIENT,
        color: "common.white",
        fontWeight: 800,
        fontSize: "1.1rem",
      }}
    >
      {vendor.name.charAt(0).toUpperCase()}
    </Box>
  );
}

function ProductRow({ product }: { product: MarketplaceProduct }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ sm: "center" }}
      sx={{
        py: 1.25,
        borderTop: 1,
        borderColor: "divider",
        "&:first-of-type": { borderTop: 0, pt: 0 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 72,
          height: 72,
          borderRadius: 1.5,
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: BRAND_NAVY_TINT_02,
        }}
      >
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="72px" style={{ objectFit: "cover" }} />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <StorefrontOutlinedIcon color="disabled" />
          </Stack>
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {product.name}
        </Typography>
        {product.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {truncate(product.description, 160)}
          </Typography>
        ) : null}
      </Box>
      {product.product_url ? (
        <Button
          component="a"
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          variant="outlined"
          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          View product
        </Button>
      ) : null}
    </Stack>
  );
}

function VendorCard({ vendor }: { vendor: MarketplaceVendorGroup }) {
  const profileHref = vendor.slug ? vendorPublicProfilePath(vendor.slug) : null;

  return (
    <Paper variant="outlined" sx={communitySurfacePaperSx()}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
        <VendorLogo vendor={vendor} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h6" sx={{ ...communitySectionTitleSx, fontSize: "1.125rem" }}>
              {vendor.name}
            </Typography>
            {vendor.category ? <Chip label={vendor.category} size="small" variant="outlined" /> : null}
          </Stack>
          {vendor.tagline ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {vendor.tagline}
            </Typography>
          ) : null}
          {vendor.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {truncate(vendor.description, 220)}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            {profileHref ? (
              <Button
                component={Link}
                href={profileHref}
                size="small"
                variant="contained"
                endIcon={<ChevronRightIcon />}
                sx={communityContainedButtonSx()}
              >
                Vendor profile
              </Button>
            ) : null}
            {vendor.website_url ? (
              <Button
                component="a"
                href={vendor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                variant="text"
              >
                Website
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {vendor.products.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No products listed yet for this vendor.
        </Typography>
      ) : (
        <Stack spacing={0}>
          {vendor.products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export function CommunityMarketplaceSection({
  variant,
  marketplace,
  previewVendorLimit = 3,
  previewProductsPerVendor = 4,
  signedIn = false,
}: CommunityMarketplaceSectionProps) {
  const { marketplaceError, vendors, productCount, vendorCount } = marketplace;

  const displayVendors =
    variant === "preview"
      ? vendors.slice(0, previewVendorLimit).map((v) => ({
          ...v,
          products: v.products.slice(0, previewProductsPerVendor),
        }))
      : vendors;

  const flatProducts = displayVendors.flatMap((v) => v.products);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Browse certified aquatics vendors and their product listings — chemicals, equipment, services, and more.
      </Typography>

      {marketplaceError ? <Alert severity="error">Could not load the marketplace.</Alert> : null}

      {!marketplaceError && vendorCount === 0 ? (
        <Paper variant="outlined" sx={communitySurfacePaperSx()}>
          <Typography variant="h6" sx={{ ...communitySectionTitleSx, mb: 1 }}>
            Marketplace coming soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approved vendor partners and products will appear here once published by the Aquatics Empowered team.
          </Typography>
          <Button component={Link} href="/vendors#vendor-apply" variant="contained" sx={communityContainedButtonSx()}>
            Apply to become a vendor
          </Button>
        </Paper>
      ) : null}

      {!marketplaceError && vendorCount > 0 ? (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip
              icon={<StorefrontOutlinedIcon />}
              label={`${vendorCount} vendor${vendorCount === 1 ? "" : "s"}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${productCount} product${productCount === 1 ? "" : "s"}`}
              size="small"
              variant="outlined"
            />
            <Button component={Link} href="/vendors" size="small" sx={{ ml: { sm: "auto" } }}>
              Full vendor directory
            </Button>
          </Stack>

          <Typography variant="h6" sx={communitySectionTitleSx}>
            {variant === "preview" ? "Featured partners" : "Vendors & products"}
          </Typography>

          <Stack spacing={2}>
            {displayVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </Stack>

          {variant === "full" && flatProducts.length > 0 ? (
            <>
              <Divider />
              <Typography variant="h6" sx={communitySectionTitleSx}>
                Browse all products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tap a product for details and links to the vendor.
              </Typography>
              <VendorMarketplace products={flatProducts} signedIn={signedIn} />
            </>
          ) : null}

          {variant === "preview" ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                See the full marketplace
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Sign in to browse every vendor and product, open vendor profiles, and explore the full catalog.
              </Typography>
              <Button component={Link} href="/login?next=%2Fcommunity%3Ftab%3Dmarketplace" variant="contained" sx={communityContainedButtonSx()}>
                Sign in to browse
              </Button>
            </Paper>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
