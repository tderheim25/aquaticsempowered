import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json, PlanCode } from "@/types/database";

export const metadata = {
  title: "Vendor Directory | Aquatics Empowered",
};

type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];

function contactString(contact: Json | null, key: "website" | "email" | "phone"): string | null {
  if (!contact || typeof contact !== "object" || Array.isArray(contact)) return null;
  const v = (contact as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalize(s: string | undefined) {
  return (s ?? "").trim().toLowerCase();
}

export default async function VendorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; region?: string }>;
}) {
  await requireViewAccess("vendor_directory");
  const { q, category, region } = await searchParams;

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
      .select("id, name, tier, category, region, certified_at, contact, listing_visible")
      .eq("listing_visible", true)
      .order("name", { ascending: true })
      .limit(500);

    if (error) {
      loadError = error.message;
    } else {
      vendors = (data ?? []) as VendorRow[];
    }
  }

  const qn = normalize(q);
  const catFilter = (category ?? "").trim();
  const regionFilter = (region ?? "").trim();

  let filtered = vendors;
  if (qn) {
    filtered = filtered.filter((v) => {
      const hay = [v.name, v.category, v.region, v.tier].map((x) => normalize(x ?? "")).join(" ");
      return hay.includes(qn);
    });
  }
  if (catFilter) {
    filtered = filtered.filter((v) => (v.category ?? "").trim() === catFilter);
  }
  if (regionFilter) {
    filtered = filtered.filter((v) => (v.region ?? "").trim() === regionFilter);
  }

  const categories = [...new Set(vendors.map((v) => v.category?.trim()).filter((c): c is string => Boolean(c)))].sort();
  const regions = [...new Set(vendors.map((v) => v.region?.trim()).filter((r): r is string => Boolean(r)))].sort();

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Vendor Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Certified partners and suppliers. Filter by category or region, then visit a vendor&apos;s site from their
            card.
          </Typography>
        </div>

        {!vendorFeatureEnabled ? (
          <Alert severity="info">
            Your current plan does not include the vendor directory. Upgrade to unlock partner search and listings.{" "}
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
          <>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack component="form" method="get" action="/app/vendors" direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
                <TextField name="q" label="Search" size="small" placeholder="Name, category, region…" defaultValue={q ?? ""} sx={{ minWidth: 220, flex: 1 }} />
                <TextField name="category" label="Category" size="small" select defaultValue={catFilter} sx={{ minWidth: 180 }}>
                  <MenuItem value="">All categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField name="region" label="Region" size="small" select defaultValue={regionFilter} sx={{ minWidth: 180 }}>
                  <MenuItem value="">All regions</MenuItem>
                  {regions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="outlined">
                  Apply
                </Button>
                <Button component={Link} href="/app/vendors" variant="text">
                  Clear
                </Button>
              </Stack>
            </Paper>

            {filtered.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  {vendors.length === 0
                    ? "No vendors are listed yet. Ask your administrator to add rows to the vendors table in Supabase."
                    : "No vendors match your filters. Try clearing search or broadening category / region."}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={1.5}>
                {filtered.map((v) => {
                  const website = contactString(v.contact, "website");
                  const email = contactString(v.contact, "email");
                  const phone = contactString(v.contact, "phone");
                  let certifiedLabel: string | null = null;
                  if (v.certified_at) {
                    try {
                      certifiedLabel = new Date(v.certified_at).toLocaleDateString(undefined, { dateStyle: "medium" });
                    } catch {
                      certifiedLabel = v.certified_at;
                    }
                  }

                  return (
                    <Grid key={v.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {v.name}
                          </Typography>
                          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap>
                            {v.category ? <Chip label={v.category} size="small" variant="outlined" /> : null}
                            {v.region ? <Chip label={v.region} size="small" variant="outlined" color="primary" /> : null}
                            {v.tier ? <Chip label={v.tier} size="small" variant="outlined" /> : null}
                          </Stack>
                          {certifiedLabel ? (
                            <Typography variant="caption" color="text.secondary">
                              Certified {certifiedLabel}
                            </Typography>
                          ) : null}
                          {email ? (
                            <Typography variant="body2">
                              <MuiLink href={`mailto:${email}`} underline="hover">
                                {email}
                              </MuiLink>
                            </Typography>
                          ) : null}
                          {phone ? (
                            <Typography variant="body2" color="text.secondary">
                              {phone}
                            </Typography>
                          ) : null}
                          <Box sx={{ flex: 1 }} />
                          {website ? (
                            <Button
                              component={MuiLink}
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="contained"
                              size="small"
                              endIcon={<OpenInNewIcon />}
                              sx={{ alignSelf: "flex-start", mt: 0.5 }}
                            >
                              Website
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No website on file
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
