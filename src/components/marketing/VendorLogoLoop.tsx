"use client";

import { Box, Typography } from "@mui/material";

import LogoLoop, { type LogoItem } from "@/components/marketing/LogoLoop/LogoLoop";
import type { MarketplaceVendor } from "@/lib/vendors/loadVendorMarketplace";

function VendorNameMark({ name }: { name: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 0.75,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        minWidth: 120,
        maxWidth: 200,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: 'var(--font-inter), "Segoe UI", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: "0.8rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "text.primary",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

export function VendorLogoLoop({ vendors }: { vendors: MarketplaceVendor[] }) {
  if (vendors.length === 0) return null;

  const logos: LogoItem[] = vendors.map((v) => {
    const href = v.slug ? `/vendors/${v.slug}` : undefined;
    if (v.logo_url) {
      return { src: v.logo_url, alt: v.name, title: v.name, href };
    }
    return {
      node: <VendorNameMark name={v.name} />,
      title: v.name,
      href,
    };
  });

  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mb: 2, fontWeight: 700, letterSpacing: "0.1em" }}
      >
        Certified partners
      </Typography>
      <Box sx={{ height: 72, position: "relative", overflow: "hidden" }}>
        <LogoLoop
          logos={logos}
          speed={90}
          direction="left"
          logoHeight={48}
          gap={48}
          hoverSpeed={20}
          scaleOnHover
          fadeOut
          fadeOutColor="#f5f7fa"
          ariaLabel="Vendor partners"
        />
      </Box>
    </Box>
  );
}
