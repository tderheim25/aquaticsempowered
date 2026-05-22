"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";

import BlobCursor from "@/components/marketing/BlobCursor/BlobCursor";
import { TrackedButton } from "@/components/marketing/TrackedButton";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 24px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const float = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(0, -8px, 0); }
`;

const shine = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseDot = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.55); }
  50%      { box-shadow: 0 0 0 8px rgba(46, 213, 115, 0); }
`;

function FloatingCard({
  icon,
  label,
  value,
  trend,
  sx,
  delay = 0,
  floatDelay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { color: string; text: string };
  sx?: object;
  delay?: number;
  floatDelay?: number;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        px: 1.75,
        py: 1.25,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 50px -12px rgba(2, 23, 50, 0.45), 0 0 0 1px rgba(255,255,255,0.4)",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        minWidth: 168,
        opacity: 0,
        animation: `${fadeUp} 700ms ease-out ${delay}ms forwards, ${float} 6s ease-in-out ${floatDelay}s infinite`,
        animationFillMode: "forwards, none",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
          color: "common.white",
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.1} sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, lineHeight: 1.1 }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="baseline">
          <Typography sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.1, fontSize: "1.05rem" }}>
            {value}
          </Typography>
          {trend ? (
            <Typography
              variant="caption"
              sx={{ color: trend.color, fontWeight: 700, letterSpacing: 0.2 }}
            >
              {trend.text}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

export function Hero() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        color: "common.white",
        background:
          "radial-gradient(1200px 600px at 85% -10%, rgba(46,165,160,0.35) 0%, rgba(46,165,160,0) 60%)," +
          "radial-gradient(900px 500px at -10% 110%, rgba(86,189,255,0.28) 0%, rgba(86,189,255,0) 60%)," +
          "linear-gradient(140deg, #021a36 0%, #003B6F 45%, #084e80 100%)",
        py: { xs: 8, md: 12 },
      }}
    >
      {/* Decorative grid */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* BlobCursor ambient layer */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: { xs: 0, md: 0.85 },
          mixBlendMode: "screen",
        }}
      >
        <BlobCursor
          blobType="circle"
          fillColor="#2EA5A0"
          innerColor="rgba(255,255,255,0.9)"
          trailCount={3}
          sizes={[80, 140, 90]}
          innerSizes={[18, 28, 20]}
          opacities={[0.55, 0.45, 0.5]}
          shadowColor="rgba(2,23,50,0.6)"
          shadowBlur={8}
          shadowOffsetX={0}
          shadowOffsetY={0}
          filterId="hero-blob"
          filterStdDeviation={28}
          useFilter
          fastDuration={0.12}
          slowDuration={0.55}
          zIndex={0}
          trackWindow
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
            alignItems: "center",
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Left: copy */}
          <Stack spacing={3} sx={{ maxWidth: 640 }}>
            <Chip
              icon={<BoltRoundedIcon sx={{ color: "#FFD66B !important" }} />}
              label="Founder program now open — 50 facilities only"
              sx={{
                alignSelf: "flex-start",
                bgcolor: "rgba(255,255,255,0.08)",
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                fontWeight: 600,
                letterSpacing: 0.2,
                pl: 0.5,
                opacity: 0,
                animation: `${fadeUp} 600ms ease-out 50ms forwards`,
              }}
            />

            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                fontSize: { xs: "2.4rem", sm: "3.1rem", md: "3.55rem" },
                letterSpacing: "-0.03em",
                opacity: 0,
                animation: `${fadeUp} 700ms ease-out 120ms forwards`,
              }}
            >
              The operating system{" "}
              <Box
                component="span"
                sx={{
                  background:
                    "linear-gradient(90deg, #6ee7e3 0%, #B7F0EE 35%, #FFD66B 70%, #B7F0EE 100%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: `${shine} 8s linear infinite`,
                  display: "inline-block",
                }}
              >
                for aquatic facilities
              </Box>
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: "1.05rem", md: "1.18rem" },
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.86)",
                maxWidth: 560,
                opacity: 0,
                animation: `${fadeUp} 700ms ease-out 220ms forwards`,
              }}
            >
              Replace clipboards and spreadsheets with one place for chemistry, maintenance, vendors, and
              compliance — so your team protects swimmers, controls costs, and keeps the water open.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              pt={0.5}
              sx={{ opacity: 0, animation: `${fadeUp} 700ms ease-out 320ms forwards` }}
            >
              <TrackedButton
                component={Link}
                href="/founders"
                variant="contained"
                size="large"
                eventName="cta_click_founders"
                eventProps={{ location: "hero_primary" }}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  px: 3.5,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #FFD66B 0%, #FFB547 100%)",
                  color: "#1a1a1a",
                  boxShadow: "0 12px 30px -8px rgba(255, 181, 71, 0.55)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #FFDF85 0%, #FFC369 100%)",
                    boxShadow: "0 16px 40px -8px rgba(255, 181, 71, 0.7)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 200ms ease",
                }}
              >
                Join the Founder Program
              </TrackedButton>
              <TrackedButton
                component={Link}
                href="/pricing"
                variant="outlined"
                size="large"
                eventName="cta_click_pricing"
                eventProps={{ location: "hero_secondary" }}
                sx={{
                  px: 3.5,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.4)",
                  backdropFilter: "blur(8px)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                See pricing
              </TrackedButton>
            </Stack>

            {/* Trust strip */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1.25, sm: 3 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              sx={{
                mt: 2.5,
                pt: 2.5,
                borderTop: "1px solid rgba(255,255,255,0.12)",
                opacity: 0,
                animation: `${fadeUp} 700ms ease-out 420ms forwards`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#6ee7e3" }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                  CPO &amp; AFO aligned
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#6ee7e3" }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                  Audit-ready logs
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#6ee7e3" }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                  Vendor-vetted
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Right: hero visual */}
          <Box
            sx={{
              position: "relative",
              display: { xs: "none", md: "block" },
              aspectRatio: "4 / 3",
              borderRadius: 3,
              opacity: 0,
              animation: `${fadeUp} 900ms ease-out 250ms forwards`,
            }}
          >
            {/* Outer glow halo */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: -32,
                borderRadius: 4,
                background:
                  "radial-gradient(closest-side, rgba(46,165,160,0.45), rgba(46,165,160,0) 70%)",
                filter: "blur(40px)",
                zIndex: 0,
              }}
            />

            {/* Image frame */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow:
                  "0 50px 100px -20px rgba(2,23,50,0.6), 0 30px 60px -30px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)",
                transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
                transformStyle: "preserve-3d",
                transition: "transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                "&:hover": {
                  transform: "perspective(1200px) rotateY(-1deg) rotateX(1deg) translateY(-4px)",
                },
              }}
            >
              <Image
                src="/images/hero-pool.jpg"
                alt="Premium pool facility at dusk"
                fill
                priority
                sizes="(max-width: 900px) 0px, 50vw"
                style={{ objectFit: "cover" }}
              />
              {/* Image overlay for legibility of floating chips */}
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(2,23,50,0.0) 40%, rgba(2,23,50,0.35) 100%)",
                }}
              />
            </Box>

            {/* Floating UI cards */}
            <FloatingCard
              icon={<ScienceRoundedIcon fontSize="small" />}
              label="Free chlorine"
              value="2.4 ppm"
              trend={{ color: "#0E9F6E", text: "in range" }}
              delay={500}
              floatDelay={0}
              sx={{ top: "8%", left: "-6%" }}
            />
            <FloatingCard
              icon={<ShieldRoundedIcon fontSize="small" />}
              label="Daily log"
              value="Submitted"
              trend={{ color: "#0E9F6E", text: "✓ 8:14 AM" }}
              delay={700}
              floatDelay={1.5}
              sx={{ bottom: "10%", right: "-8%" }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "46%",
                right: "-4%",
                px: 1.5,
                py: 1,
                borderRadius: 999,
                bgcolor: "rgba(15, 159, 110, 0.95)",
                color: "common.white",
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: 0.3,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                boxShadow: "0 16px 32px -12px rgba(15,159,110,0.55)",
                opacity: 0,
                animation: `${fadeUp} 700ms ease-out 850ms forwards, ${float} 6s ease-in-out 0.7s infinite`,
                animationFillMode: "forwards, none",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "#a7f3d0",
                  animation: `${pulseDot} 2s ease-in-out infinite`,
                }}
              />
              All systems normal
            </Box>
          </Box>
        </Box>

        {/* Logos / stats sub-strip */}
        <Box
          sx={{
            mt: { xs: 6, md: 10 },
            pt: 4,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            gap: { xs: 2.5, sm: 4 },
            opacity: 0,
            animation: `${fadeUp} 700ms ease-out 600ms forwards`,
          }}
        >
          {[
            { value: "50+", label: "Founding facilities" },
            { value: "12", label: "States represented" },
            { value: "98%", label: "Compliance on first audit" },
            { value: "24/7", label: "Expert support" },
          ].map((s) => (
            <Stack key={s.label} spacing={0.25}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  letterSpacing: "-0.02em",
                  color: "common.white",
                }}
              >
                {s.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Container>

      {/* Bottom wave divider */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: -1,
          left: 0,
          right: 0,
          lineHeight: 0,
          zIndex: 1,
          pointerEvents: "none",
          color: (t) => t.palette.background.default,
        }}
      >
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
          <path
            d="M0,40 C240,90 480,0 720,30 C960,60 1200,100 1440,50 L1440,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>
      </Box>
    </Box>
  );
}
