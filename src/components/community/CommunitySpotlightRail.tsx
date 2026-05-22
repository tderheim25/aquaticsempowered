"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import {
  DEMO_ORGANIZATION_SPOTLIGHTS,
  type CommunityOrganizationSpotlight,
} from "@/lib/community/organizationSpotlight";

import { CommunityOrganizationModal } from "./CommunityOrganizationModal";
import { CommunitySupportForm } from "./CommunitySupportForm";
import { COMMUNITY_ACCENT_BAR_GRADIENT, communityEyebrowSx, communitySectionTitleSx } from "./communityUi";

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
        <Box sx={{ height: 4, background: COMMUNITY_ACCENT_BAR_GRADIENT }} />
        <CardContent sx={{ pt: 1.5, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="subtitle2" sx={{ ...communitySectionTitleSx, fontSize: "0.875rem", lineHeight: 1.25 }}>
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

function OrganizationSpotlightCard({
  organization,
  onSelect,
}: {
  organization: CommunityOrganizationSpotlight;
  onSelect: (org: CommunityOrganizationSpotlight) => void;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "action.hover", overflow: "hidden" }}>
      <CardActionArea onClick={() => onSelect(organization)} sx={{ textAlign: "left" }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {organization.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mt: 0.75,
            }}
          >
            {organization.description}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
              View details
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
    <Typography component="span" sx={communityEyebrowSx({ mb: 0 })}>
      {children}
    </Typography>
  );
}

export function CommunitySpotlightRail({
  vendors,
  organizations,
  showSupportForm = false,
}: {
  vendors: CommunityVendorSpotlight[];
  organizations?: CommunityOrganizationSpotlight[];
  showSupportForm?: boolean;
}) {
  const orgList = organizations ?? DEMO_ORGANIZATION_SPOTLIGHTS;
  const [selectedOrg, setSelectedOrg] = useState<CommunityOrganizationSpotlight | null>(null);

  const supplierLike = vendors.filter(isSupplierLike);
  const vendorLike = vendors.filter((v) => !isSupplierLike(v));

  const vendorSlots =
    vendorLike.length > 0 ? vendorLike.slice(0, 4) : DEMO_VENDORS.slice(0, Math.min(3, DEMO_VENDORS.length));
  const supplierSlots =
    supplierLike.length > 0 ? supplierLike.slice(0, 4) : DEMO_SUPPLIERS.slice(0, Math.min(2, DEMO_SUPPLIERS.length));

  const orgSlots = orgList.slice(0, 6);
  const showDemoHint = vendors.length === 0;
  const showOrgDemoHint = orgList.some((o) => o.isDemo);

  return (
    <Box component="aside" aria-label="Partners and organizations" sx={{ width: "100%" }}>
      <Stack spacing={2.25}>
        <Box>
          <Typography variant="subtitle1" sx={{ ...communitySectionTitleSx, mb: 0.5 }}>
            Network spotlight
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Vendors, suppliers, and organizations curated for operators. Open a card for details.
          </Typography>
        </Box>

        {showDemoHint ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 0.25 }}>
            Showing sample vendor listings until your directory is populated in Supabase{" "}
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
          <SectionTitle>Organizations</SectionTitle>
          {showOrgDemoHint ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 0.25 }}>
              Sample organizations shown until facilities are listed in{" "}
              <Box component="code" sx={{ fontSize: "0.7rem" }}>
                organizations
              </Box>
              .
            </Typography>
          ) : null}
          <Stack spacing={1.25}>
            {orgSlots.map((org) => (
              <OrganizationSpotlightCard key={org.id} organization={org} onSelect={setSelectedOrg} />
            ))}
          </Stack>
        </Stack>

        {showSupportForm ? (
          <>
            <Divider />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.paper" }}>
              <CommunitySupportForm />
            </Paper>
          </>
        ) : null}
      </Stack>

      <CommunityOrganizationModal
        organization={selectedOrg}
        open={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
      />
    </Box>
  );
}
