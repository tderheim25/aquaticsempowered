"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

export type CommunityVendorSpotlight = {
  id: string;
  name: string;
  tier: string | null;
  category: string | null;
  region: string | null;
};

const DEMO_VENDORS: CommunityVendorSpotlight[] = [
  {
    id: "demo-vendor-1",
    name: "AquaClear Distributors",
    tier: "Gold",
    category: "Equipment & covers",
    region: "Midwest",
  },
  {
    id: "demo-vendor-2",
    name: "BlueGuard Safety",
    tier: "Silver",
    category: "Signage & rescue",
    region: "National",
  },
  {
    id: "demo-vendor-3",
    name: "FlowRight Pumps",
    tier: "Partner",
    category: "Mechanical",
    region: "Southeast",
  },
];

const DEMO_SUPPLIERS: CommunityVendorSpotlight[] = [
  {
    id: "demo-supplier-1",
    name: "ChemPro Supply Co.",
    tier: "Gold",
    category: "Chemicals & balancers",
    region: "National",
  },
  {
    id: "demo-supplier-2",
    name: "SaltWorks Wholesale",
    tier: "Silver",
    category: "Salt & generators",
    region: "West",
  },
];

const GROUP_SPOTLIGHTS = [
  {
    id: "group-1",
    title: "Regional operators circle",
    blurb: "Swap inspection notes and seasonal opening checklists with nearby facilities.",
  },
  {
    id: "group-2",
    title: "CPO study lab",
    blurb: "Short prompts, code references, and CE prep with peers and trainers.",
  },
  {
    id: "group-3",
    title: "Procurement roundtable",
    blurb: "Compare bids, vendor SLAs, and bulk buys without leaving the app (soon).",
  },
];

function isSupplierLike(v: CommunityVendorSpotlight) {
  const c = (v.category ?? "").toLowerCase();
  return /chem|chlor|acid|alkali|salt|sanit|water treat|reagent|bulk|supply/.test(c);
}

function AdSpotCard({
  title,
  subtitle,
  meta,
  href,
  badge,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  href: string;
  badge?: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 2,
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.primary.main}12 0%, ${t.palette.primary.light}08 40%, ${t.palette.background.paper} 100%)`,
        borderColor: "divider",
      }}
    >
      <CardActionArea component={Link} href={href} sx={{ alignItems: "stretch", textAlign: "left" }}>
        <Box
          sx={{
            height: 4,
            background: (t) => `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
          }}
        />
        <CardContent sx={{ pt: 1.5, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
              {title}
            </Typography>
            {badge ? (
              <Chip label={badge} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0, height: 22 }} />
            ) : null}
          </Stack>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              {subtitle}
            </Typography>
          ) : null}
          {meta ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
              {meta}
            </Typography>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
              Learn more
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 14, color: "primary.main" }} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 0.08, color: "text.secondary" }}>
      {children}
    </Typography>
  );
}

export function CommunitySpotlightRail({ vendors }: { vendors: CommunityVendorSpotlight[] }) {
  const supplierLike = vendors.filter(isSupplierLike);
  const vendorLike = vendors.filter((v) => !isSupplierLike(v));

  const vendorSlots =
    vendorLike.length > 0 ? vendorLike.slice(0, 4) : DEMO_VENDORS.slice(0, Math.min(3, DEMO_VENDORS.length));
  const supplierSlots =
    supplierLike.length > 0 ? supplierLike.slice(0, 4) : DEMO_SUPPLIERS.slice(0, Math.min(2, DEMO_SUPPLIERS.length));

  const showDemoHint = vendors.length === 0;

  return (
    <Box
      component="aside"
      aria-label="Partners and groups"
      sx={{
        position: { lg: "sticky" },
        top: { lg: 80 },
        alignSelf: { lg: "flex-start" },
        width: "100%",
        maxHeight: { lg: "calc(100vh - 96px)" },
        overflowY: { lg: "auto" },
        overflowX: "hidden",
        pr: { lg: 0.5 },
        pb: { xs: 0, lg: 1 },
      }}
    >
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
            Network spotlight
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Vendors, suppliers, and groups curated for operators. Links open the public directory where available.
          </Typography>
        </Box>

        {showDemoHint ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 0.25 }}>
            Showing sample listings until your directory is populated in Supabase{" "}
            <Box component="code" sx={{ fontSize: "0.7rem" }}>
              vendors
            </Box>
            .
          </Typography>
        ) : null}

        <Stack spacing={1.25}>
          <SectionTitle>Featured vendors</SectionTitle>
          <Stack spacing={1.25}>
            {vendorSlots.map((v) => (
              <AdSpotCard
                key={v.id}
                title={v.name}
                subtitle={v.category}
                meta={[v.tier, v.region].filter(Boolean).join(" · ") || null}
                href="/vendors"
                badge={v.tier ?? "Partner"}
              />
            ))}
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <SectionTitle>Supplier spotlight</SectionTitle>
          <Stack spacing={1.25}>
            {supplierSlots.map((v) => (
              <AdSpotCard
                key={v.id}
                title={v.name}
                subtitle={v.category}
                meta={[v.tier, v.region].filter(Boolean).join(" · ") || null}
                href="/vendors"
                badge="Supply"
              />
            ))}
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.25}>
          <SectionTitle>Groups</SectionTitle>
          <Stack spacing={1.25}>
            {GROUP_SPOTLIGHTS.map((g) => (
              <Card key={g.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: "action.hover" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {g.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                    {g.blurb}
                  </Typography>
                  <Button size="small" sx={{ mt: 1, px: 0 }} disabled>
                    Join (soon)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
