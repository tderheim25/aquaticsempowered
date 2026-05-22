"use client";

import { keyframes } from "@emotion/react";
import {
  Box,
  Chip,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";

import type { BillingCadence } from "./pricingData";

const float = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -14px, 0) scale(1.04); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, 12px, 0) scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 18px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

type Props = {
  cadence: BillingCadence;
  onCadenceChange: (next: BillingCadence) => void;
};

export function PricingHero({ cadence, onCadenceChange }: Props) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        pt: { xs: 8, md: 12 },
        pb: { xs: 12, md: 18 },
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
          animation: reduceMotion ? "none" : `${float} 9s ease-in-out infinite`,
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
          animation: reduceMotion ? "none" : `${floatReverse} 11s ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent 75%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Stack spacing={3} alignItems="center" textAlign="center" sx={{ maxWidth: 780, mx: "auto" }}>
          <Chip
            label="Pricing built for operators"
            size="small"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "common.white",
              bgcolor: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.32)",
              backdropFilter: "blur(6px)",
              animation: reduceMotion ? "none" : `${fadeUp} 600ms ease both`,
            }}
          />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.05,
              backgroundImage:
                "linear-gradient(90deg, #ffffff 0%, #cdeeec 40%, #ffffff 60%, #cdeeec 80%, #ffffff 100%)",
              backgroundSize: "200% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              animation: reduceMotion
                ? "none"
                : `${shimmer} 9s linear infinite, ${fadeUp} 700ms ease 80ms both`,
            }}
          >
            Pricing that scales with your facility.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              opacity: 0.92,
              maxWidth: 640,
              animation: reduceMotion ? "none" : `${fadeUp} 700ms ease 160ms both`,
            }}
          >
            From free community access to enterprise-grade monitoring and advisory.
            Switch tiers anytime — founders lock in preferred pricing for life.
          </Typography>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              pt: 2,
              animation: reduceMotion ? "none" : `${fadeUp} 700ms ease 240ms both`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                opacity: cadence === "monthly" ? 1 : 0.65,
                transition: "opacity 220ms ease",
              }}
            >
              Monthly
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={cadence}
              onChange={(_, value: BillingCadence | null) => {
                if (value) onCadenceChange(value);
              }}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                p: 0.5,
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)",
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: 999,
                  px: 2.25,
                  py: 0.5,
                  color: "rgba(255,255,255,0.85)",
                  textTransform: "none",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  transition: "all 240ms ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "common.white" },
                  "&.Mui-selected, &.Mui-selected:hover": {
                    bgcolor: "common.white",
                    color: "primary.main",
                    boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
                  },
                },
              }}
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="annual">Annual</ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  opacity: cadence === "annual" ? 1 : 0.65,
                  transition: "opacity 220ms ease",
                }}
              >
                Annual
              </Typography>
              <Chip
                label="Save 17%"
                size="small"
                sx={{
                  bgcolor: "secondary.main",
                  color: "common.white",
                  fontWeight: 700,
                  height: 22,
                  letterSpacing: "0.04em",
                  boxShadow: "0 6px 18px rgba(46,165,160,0.45)",
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
