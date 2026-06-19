"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import { FOUNDER_DISCOUNT_TERM, FOUNDER_FACILITY_LIMIT, FOUNDER_PERKS } from "@/lib/founders/founderProgram";
import { applyPromoDiscount } from "@/lib/marketing/promo";
import {
  ESSENTIAL_MONTHLY_USD,
  PRO_MONTHLY_USD,
  formatUsd,
} from "@/lib/marketing/publicPricing";
import type { SitePromoConfig } from "@/lib/marketing/promo";

type Props = {
  sitePromo: SitePromoConfig;
};

export function FounderValueBento({ sitePromo }: Props) {
  const theme = useTheme();
  const showPromo = sitePromo.active;

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 5, md: 7 },
        background:
          "linear-gradient(180deg, rgba(245,247,250,0) 0%, rgba(0,59,111,0.03) 50%, rgba(245,247,250,1) 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1} sx={{ maxWidth: 640 }}>
            <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.16em" }}>
              Why join now
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.dark" }}>
              Be among the first {FOUNDER_FACILITY_LIMIT} — 50% off {FOUNDER_DISCOUNT_TERM}.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Founders get preferred pricing on their base subscription {FOUNDER_DISCOUNT_TERM}, hands-on onboarding, and a
              direct voice in what we build next.
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {FOUNDER_PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <Grid key={perk.title} size={{ xs: 12, sm: 6 }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "transform 220ms ease, box-shadow 220ms ease",
                      cursor: "default",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {perk.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {perk.body}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(
                theme.palette.secondary.main,
                0.08,
              )} 100%)`,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.dark" }}>
                    Founder pricing snapshot
                  </Typography>
                  {showPromo ? (
                    <Chip
                      label={sitePromo.badge}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: "secondary.main", color: "common.white" }}
                    />
                  ) : null}
                </Stack>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <PricingSnapshotRow
                      name="Essential"
                      listUsd={ESSENTIAL_MONTHLY_USD}
                      sitePromo={sitePromo}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <PricingSnapshotRow name="Professional" listUsd={PRO_MONTHLY_USD} sitePromo={sitePromo} featured />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">
                  Monthly billing shown. Pool add-ons ($29/mo each beyond the first active pool) are not discounted.
                  Founder discount applies to base subscription only.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

function PricingSnapshotRow({
  name,
  listUsd,
  sitePromo,
  featured,
}: {
  name: string;
  listUsd: number;
  sitePromo: SitePromoConfig;
  featured?: boolean;
}) {
  const showPromo = sitePromo.active;
  const founderUsd = showPromo ? applyPromoDiscount(listUsd, sitePromo) : listUsd;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: featured ? "primary.main" : "divider",
        position: "relative",
      }}
    >
      {featured ? (
        <Chip
          label="Most popular"
          size="small"
          sx={{
            position: "absolute",
            top: -10,
            right: 12,
            fontWeight: 700,
            bgcolor: "primary.main",
            color: "common.white",
          }}
        />
      ) : null}
      <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700 }}>
        {name}
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mt: 0.5 }}>
        {showPromo ? (
          <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.dark" }}>
              ${formatUsd(founderUsd)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / mo founder
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "line-through", ml: "auto" }}
            >
              ${formatUsd(listUsd)}/mo
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.dark" }}>
              ${formatUsd(listUsd)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / mo
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}
