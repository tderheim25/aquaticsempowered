"use client";

import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";

import {
  FOUNDER_ENCOURAGEMENT_LINE,
  FOUNDER_HERO_HEADLINE,
  FOUNDER_HERO_SUBHEAD,
  FOUNDER_SCARCITY_LABEL,
} from "@/lib/founders/founderProgram";
import type { SitePromoConfig } from "@/lib/marketing/promo";

import {
  founderFadeUp,
  founderFloat,
  founderFloatReverse,
  founderPulse,
  founderShimmer,
} from "./founderPageMotion";

type Props = {
  sitePromo: SitePromoConfig;
};

export function FounderHero({ sitePromo }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 7, md: 10 },
        pb: { xs: 8, md: 11 },
        background: "linear-gradient(135deg, #003B6F 0%, #0a4d8c 45%, #2EA5A0 100%)",
        color: "common.white",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -140,
          right: -120,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,165,160,0.55), transparent 70%)",
          filter: "blur(8px)",
          animation: reduceMotion ? "none" : `${founderFloat} 9s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: -180,
          left: -100,
          width: 440,
          height: 440,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)",
          filter: "blur(10px)",
          animation: reduceMotion ? "none" : `${founderFloatReverse} 11s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Stack spacing={3} alignItems="center" textAlign="center" sx={{ maxWidth: 820, mx: "auto" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
            <Chip
              label="Founder Program"
              size="small"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.32)",
                backdropFilter: "blur(6px)",
                animation: reduceMotion ? "none" : `${founderFadeUp} 600ms ease both`,
              }}
            />
            <Chip
              label={FOUNDER_SCARCITY_LABEL}
              size="small"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.28)",
                animation: reduceMotion ? "none" : `${founderFadeUp} 600ms ease 40ms both`,
              }}
            />
          </Stack>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.08,
              backgroundImage:
                "linear-gradient(90deg, #ffffff 0%, #cdeeec 40%, #ffffff 60%, #cdeeec 80%, #ffffff 100%)",
              backgroundSize: "200% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              animation: reduceMotion
                ? "none"
                : `${founderShimmer} 9s linear infinite, ${founderFadeUp} 700ms ease 80ms both`,
            }}
          >
            {FOUNDER_HERO_HEADLINE}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              opacity: 0.92,
              maxWidth: 680,
              animation: reduceMotion ? "none" : `${founderFadeUp} 700ms ease 160ms both`,
            }}
          >
            {FOUNDER_HERO_SUBHEAD}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              opacity: 0.85,
              maxWidth: 640,
              animation: reduceMotion ? "none" : `${founderFadeUp} 700ms ease 200ms both`,
            }}
          >
            {FOUNDER_ENCOURAGEMENT_LINE}
          </Typography>

          {sitePromo.active ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.3)",
                backdropFilter: "blur(6px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                animation: reduceMotion ? "none" : `${founderFadeUp} 700ms ease 240ms both`,
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: "secondary.main",
                  color: "common.white",
                  boxShadow: "0 8px 20px rgba(46,165,160,0.5)",
                  animation: reduceMotion ? "none" : `${founderPulse} 2.4s ease-in-out infinite`,
                }}
              >
                <LocalOfferRoundedIcon fontSize="small" />
              </Box>
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {sitePromo.headline}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {sitePromo.description}
                </Typography>
              </Box>
            </Stack>
          ) : null}

          <Button
            href="#founder-apply"
            variant="contained"
            size="large"
            endIcon={<ArrowDownwardRoundedIcon />}
            sx={{
              mt: 1,
              px: 4,
              py: 1.25,
              fontWeight: 700,
              bgcolor: "common.white",
              color: "primary.main",
              boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
              animation: reduceMotion ? "none" : `${founderFadeUp} 700ms ease 280ms both`,
              transition: "transform 220ms ease, box-shadow 220ms ease",
              "&:hover": {
                bgcolor: "grey.100",
                transform: "translateY(-2px)",
                boxShadow: "0 16px 36px rgba(0,0,0,0.28)",
              },
            }}
          >
            Claim your founder spot
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
