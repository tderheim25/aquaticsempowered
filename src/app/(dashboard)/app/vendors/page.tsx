import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { vendorPublicProfilePath } from "@/lib/vendors/paths";
import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";
import { createClient } from "@/lib/supabase/server";
import type { Database, PlanCode } from "@/types/database";

export const metadata = {
  title: "Vendor Directory | Aquatics Empowered",
};

type VendorRow = Pick<
  Database["public"]["Tables"]["vendors"]["Row"],
  "id" | "name" | "slug" | "logo_url" | "listing_visible"
>;

function VendorLogoMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <Box
        sx={{
          position: "relative",
          width: 88,
          height: 88,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Image src={logoUrl} alt="" fill sizes="88px" style={{ objectFit: "contain", padding: 8 }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 88,
        height: 88,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontWeight: 800,
        fontSize: "1.75rem",
        flexShrink: 0,
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </Box>
  );
}

export default async function VendorDirectoryPage() {
  await requireViewAccess("vendor_directory");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUsersRowForAuthUser(user.id) : null;

  let planCode: PlanCode = "free";
  if (profile?.org_id) {
    const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", profile.org_id).maybeSingle();
    planCode = (org?.plan_code as PlanCode) ?? "free";
  }

  const vendorFeatureEnabled = hasFeature(planCode, "vendor_directory");

  let vendors: VendorRow[] = [];
  let loadError: string | null = null;

  if (vendorFeatureEnabled) {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, slug, logo_url, listing_visible")
      .eq("listing_visible", true)
      .order("name", { ascending: true })
      .limit(500);

    if (error) {
      loadError = error.message;
    } else {
      vendors = (data ?? []) as VendorRow[];
    }
  }

  const listedVendors = vendors.filter((v) => v.slug);

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.75 }}>
            Vendor Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Certified partners and suppliers. Select a vendor to view their profile.
          </Typography>
        </div>

        {!vendorFeatureEnabled ? (
          <Alert severity="info">
            Your current plan does not include the vendor directory. Upgrade to unlock partner listings.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        ) : null}

        {loadError ? (
          <Alert severity="error">
            Could not load vendors ({loadError}). Confirm the vendors table exists in Supabase and Row Level Security
            allows your role to read public listings.
          </Alert>
        ) : null}

        {vendorFeatureEnabled && !loadError ? (
          listedVendors.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No vendors are listed yet. Partners will appear here once approved and published.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {listedVendors.map((v) => {
                const profileHref = vendorPublicProfilePath(v.slug!);
                const logoUrl = resolveVendorImageUrl(v.logo_url);

                return (
                  <Grid key={v.id} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        transition: "border-color 150ms ease, box-shadow 150ms ease",
                        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                      }}
                    >
                      <CardActionArea
                        component={Link}
                        href={profileHref}
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          py: 3,
                          px: 2,
                          gap: 1.5,
                        }}
                      >
                        <VendorLogoMark name={v.name} logoUrl={logoUrl} />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            textAlign: "center",
                            lineHeight: 1.3,
                          }}
                        >
                          {v.name}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )
        ) : null}
      </Stack>
    </Container>
  );
}
