"use client";

import { keyframes } from "@emotion/react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { PricingCheckoutButton } from "./PricingCheckoutButton";
import type { BillingCadence, Tier } from "./pricingData";
import { tiers } from "./pricingData";
import { tierIdToPlanCode } from "@/lib/stripe/prices";
import { applyPromoDiscount, PROMO, promoAppliesToTier } from "@/lib/marketing/promo";
import { useReveal } from "./useReveal";

const priceSwap = keyframes`
  from { opacity: 0; transform: translate3d(0, 8px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const haloPulse = keyframes`
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.04); }
`;

function formatPrice(tier: Tier, cadence: BillingCadence) {
  const value = cadence === "monthly" ? tier.monthly : tier.annual;
  if (value === null) return "Custom";
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

type Props = {
  cadence: BillingCadence;
};

export function PricingTiers({ cadence }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Container
      maxWidth="lg"
      sx={{
        position: "relative",
        zIndex: 2,
        mt: { xs: -8, md: -12 },
        pb: { xs: 4, md: 8 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2.5, md: 3 }}
        alignItems="stretch"
        useFlexGap
      >
        {tiers.map((tier, i) => (
          <TierCard
            key={tier.id}
            tier={tier}
            cadence={cadence}
            index={i}
            reduceMotion={reduceMotion}
          />
        ))}
      </Stack>
    </Container>
  );
}

function TierCard({
  tier,
  cadence,
  index,
  reduceMotion,
}: {
  tier: Tier;
  cadence: BillingCadence;
  index: number;
  reduceMotion: boolean;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Icon = tier.icon;
  const rawValue = cadence === "monthly" ? tier.monthly : tier.annual;
  const showPromo = promoAppliesToTier(tier.id) && typeof rawValue === "number" && rawValue > 0;
  const promoValue = showPromo ? applyPromoDiscount(rawValue as number) : null;
  const price = showPromo ? `$${(promoValue as number).toLocaleString()}` : formatPrice(tier, cadence);
  const originalPrice = showPromo ? formatPrice(tier, cadence) : null;
  const note =
    cadence === "annual" && tier.annualNote ? tier.annualNote : tier.priceNote;
  const show = visible || reduceMotion;
  const planCode = tierIdToPlanCode(tier.id);

  return (
    <Box
      ref={ref}
      sx={{
        flex: 1,
        minWidth: 0,
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translate3d(0, 28px, 0)",
        transition: `opacity 650ms ease ${index * 90}ms, transform 650ms ease ${index * 90}ms`,
      }}
    >
      <Box sx={{ position: "relative", height: "100%" }}>
        {tier.featured ? (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: -12,
              borderRadius: 6,
              background:
                "linear-gradient(135deg, rgba(46,165,160,0.55), rgba(0,59,111,0.45))",
              filter: "blur(20px)",
              opacity: 0.7,
              animation: reduceMotion ? "none" : `${haloPulse} 4.5s ease-in-out infinite`,
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        ) : null}

        <Card
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            border: "1px solid",
            borderColor: tier.featured ? "transparent" : "divider",
            background: tier.featured
              ? "linear-gradient(180deg, #ffffff 0%, #f4fafa 100%)"
              : "#ffffff",
            boxShadow: tier.featured
              ? "0 28px 60px rgba(15,23,42,0.16)"
              : "0 1px 3px rgba(15,23,42,0.08)",
            transition:
              "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 320ms ease, border-color 320ms ease",
            "&:hover": {
              transform: reduceMotion ? "none" : "translateY(-6px)",
              boxShadow: "0 32px 60px rgba(15,23,42,0.18)",
              borderColor: tier.featured ? "transparent" : "rgba(46,165,160,0.4)",
            },
            "&:hover .tier-icon": {
              transform: reduceMotion ? "none" : "scale(1.06) rotate(-3deg)",
            },
          }}
        >
          <CardContent
            sx={{
              p: { xs: 3, md: 3.5 },
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box
                className="tier-icon"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  background: tier.featured
                    ? "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)"
                    : "rgba(0,59,111,0.08)",
                  color: tier.featured ? "common.white" : "primary.main",
                  boxShadow: tier.featured
                    ? "0 10px 24px rgba(0,59,111,0.28)"
                    : "none",
                  transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                  flexShrink: 0,
                }}
              >
                <Icon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                  {tier.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tier.tagline}
                </Typography>
              </Box>
              {tier.badge ? (
                <Chip
                  label={tier.badge}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: "secondary.main",
                    color: "common.white",
                    letterSpacing: "0.04em",
                    boxShadow: "0 6px 16px rgba(46,165,160,0.4)",
                  }}
                />
              ) : null}
            </Stack>

            {showPromo ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.5, mb: 0.5 }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textDecoration: "line-through" }}
                >
                  {originalPrice}
                </Typography>
                <Chip
                  label={PROMO.badge}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    bgcolor: "secondary.main",
                    color: "common.white",
                    boxShadow: "0 6px 16px rgba(46,165,160,0.4)",
                  }}
                />
              </Stack>
            ) : null}

            <Stack
              direction="row"
              alignItems="baseline"
              spacing={0.75}
              sx={{ mt: showPromo ? 0 : 2.5 }}
            >
              <Typography
                key={`${tier.id}-${cadence}`}
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  background: tier.featured
                    ? "linear-gradient(135deg, #003B6F, #2EA5A0)"
                    : "none",
                  backgroundClip: tier.featured ? "text" : "border-box",
                  WebkitBackgroundClip: tier.featured ? "text" : "border-box",
                  color: tier.featured ? "transparent" : "text.primary",
                  animation: reduceMotion ? "none" : `${priceSwap} 380ms ease both`,
                }}
              >
                {price}
              </Typography>
              {tier.priceSuffix ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {tier.priceSuffix}
                </Typography>
              ) : null}
            </Stack>
            {note ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {note}
              </Typography>
            ) : null}

            <Box
              sx={{
                height: 1,
                my: 2.5,
                background: tier.featured
                  ? "linear-gradient(90deg, transparent, rgba(46,165,160,0.35), transparent)"
                  : "rgba(15,23,42,0.08)",
              }}
            />

            <Stack spacing={1.25} sx={{ flex: 1 }}>
              {tier.highlights.map((h) => (
                <Stack key={h} direction="row" spacing={1.25} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      mt: "2px",
                      background: tier.featured
                        ? "linear-gradient(135deg, #2EA5A0, #003B6F)"
                        : "rgba(46,165,160,0.16)",
                      color: tier.featured ? "common.white" : "secondary.main",
                      boxShadow: tier.featured
                        ? "0 4px 10px rgba(46,165,160,0.35)"
                        : "none",
                    }}
                  >
                    <CheckRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.5 }}>
                    {h}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <PricingCheckoutButton
              tierId={tier.id}
              planCode={planCode}
              cadence={cadence}
              ctaHref={tier.ctaHref}
              eventName={tier.ctaEventName}
              variant={tier.featured ? "contained" : "outlined"}
              color={tier.featured ? "secondary" : "primary"}
              fullWidth
              size="large"
              sx={{
                mt: 3,
                fontWeight: 700,
                py: 1.25,
                transition:
                  "transform 220ms ease, box-shadow 220ms ease, background 220ms ease",
                boxShadow: tier.featured
                  ? "0 12px 28px rgba(46,165,160,0.42)"
                  : "none",
                "&:hover": {
                  transform: reduceMotion ? "none" : "translateY(-2px)",
                  boxShadow: tier.featured
                    ? "0 18px 36px rgba(46,165,160,0.5)"
                    : "0 10px 24px rgba(0,59,111,0.18)",
                },
              }}
            >
              {tier.ctaLabel}
            </PricingCheckoutButton>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
