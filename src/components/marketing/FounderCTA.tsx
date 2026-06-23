"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Box, Container, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import Link from "next/link";

import { FOUNDER_DISCOUNT_TERM } from "@/lib/founders/founderProgram";
import { TrackedButton } from "@/components/marketing/TrackedButton";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 16px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const drift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(20px, -16px, 0) scale(1.06); }
`;

const perks: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <LockRoundedIcon />,
    title: "Locked pricing",
    body: `Founder pricing ${FOUNDER_DISCOUNT_TERM}, even as plans change.`,
  },
  {
    icon: <SupportAgentRoundedIcon />,
    title: "Concierge onboarding",
    body: "We set up your facility with you, on a call.",
  },
  {
    icon: <EmojiEventsRoundedIcon />,
    title: "A voice in the roadmap",
    body: "Direct line to the founders shaping the product.",
  },
];

export function FounderCTA() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        py: { xs: 8, md: 12 },
        color: "common.white",
        background:
          "radial-gradient(900px 500px at 100% 0%, rgba(255,214,107,0.18) 0%, rgba(255,214,107,0) 60%)," +
          "radial-gradient(1200px 600px at 0% 100%, rgba(46,165,160,0.28) 0%, rgba(46,165,160,0) 60%)," +
          "linear-gradient(140deg, #021a36 0%, #003B6F 55%, #0E7A75 100%)",
      }}
    >
      {/* Drifting orbs */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(46,165,160,0.45), rgba(46,165,160,0) 70%)",
          filter: "blur(20px)",
          animation: `${drift} 14s ease-in-out infinite`,
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(255,214,107,0.30), rgba(255,214,107,0) 70%)",
          filter: "blur(28px)",
          animation: `${drift} 18s ease-in-out infinite reverse`,
          zIndex: 0,
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.2)",
              bgcolor: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              fontWeight: 600,
              fontSize: "0.78rem",
              letterSpacing: 0.4,
              textTransform: "uppercase",
              opacity: 0,
              animation: `${fadeUp} 600ms ease-out 60ms forwards`,
            }}
          >
            <EmojiEventsRoundedIcon sx={{ fontSize: 16, color: "#FFD66B" }} />
            Limited to 50 facilities
          </Box>

          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2rem", md: "2.6rem" },
              maxWidth: 720,
              opacity: 0,
              animation: `${fadeUp} 700ms ease-out 140ms forwards`,
            }}
          >
            Be one of the founding 50 facilities — and help shape what aquatic operations becomes.
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              fontSize: { xs: "1rem", md: "1.1rem" },
              maxWidth: 620,
              opacity: 0,
              animation: `${fadeUp} 700ms ease-out 240ms forwards`,
            }}
          >
            Founder facilities get preferred pricing {FOUNDER_DISCOUNT_TERM}, hands-on onboarding, and a direct line to our
            team. We build with you — not at you.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: { xs: 2, sm: 3 },
              width: "100%",
              maxWidth: 720,
              mt: 1,
              opacity: 0,
              animation: `${fadeUp} 700ms ease-out 340ms forwards`,
            }}
          >
            {perks.map((p) => (
              <Stack
                key={p.title}
                spacing={1}
                alignItems="center"
                sx={{
                  textAlign: "center",
                  px: 2,
                  py: 2.5,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                  transition: "transform 240ms ease, background 240ms ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    color: "#FFD66B",
                    bgcolor: "rgba(255,214,107,0.12)",
                    "& svg": { fontSize: 22 },
                  }}
                >
                  {p.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.98rem" }}>{p.title}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
                  {p.body}
                </Typography>
              </Stack>
            ))}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 2, opacity: 0, animation: `${fadeUp} 700ms ease-out 440ms forwards` }}
          >
            <TrackedButton
              component={Link}
              href="/founders"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              eventName="cta_click_founders"
              eventProps={{ location: "founder_banner" }}
              sx={{
                px: 3.5,
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                background: "linear-gradient(135deg, #FFD66B 0%, #FFB547 100%)",
                color: "#1a1a1a",
                boxShadow: "0 12px 30px -8px rgba(255,181,71,0.55)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FFDF85 0%, #FFC369 100%)",
                  boxShadow: "0 16px 40px -8px rgba(255,181,71,0.7)",
                  transform: "translateY(-1px)",
                },
                transition: "all 200ms ease",
              }}
            >
              Apply for founder access
            </TrackedButton>
            <TrackedButton
              component={Link}
              href="/pricing"
              variant="outlined"
              size="large"
              eventName="cta_click_pricing"
              eventProps={{ location: "founder_banner_secondary" }}
              sx={{
                px: 3.5,
                py: 1.5,
                fontWeight: 600,
                fontSize: "1rem",
                color: "common.white",
                borderColor: "rgba(255,255,255,0.4)",
                bgcolor: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
                "&:hover": {
                  borderColor: "common.white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Compare plans
            </TrackedButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
