"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  BRAND_NAVY,
  BRAND_NAVY_MID,
  BRAND_TEAL,
  COMMUNITY_BRAND_GRADIENT,
} from "@/components/community/communityUi";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInLeft = keyframes`
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slowZoom = keyframes`
  from { transform: scale(1.05); }
  to { transform: scale(1.12); }
`;

const floatBubble = keyframes`
  0%   { transform: translateY(0)   scale(1);   opacity: 0; }
  10%  { opacity: 0.55; }
  90%  { opacity: 0.35; }
  100% { transform: translateY(-120vh) scale(1.4); opacity: 0; }
`;

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

type Bubble = {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
};

const TRUST_POINTS = [
  "Built for rural pools, hotels, schools, and city aquatics",
  "SOC-minded auth, role-based access, audit-ready logs",
  "Operate, protect, and grow — all in one workspace",
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const next: Bubble[] = Array.from({ length: 14 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      size: 8 + Math.random() * 28,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 14,
    }));
    setBubbles(next);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        bgcolor: "#f4f6fb",
        overflow: "hidden",
      }}
    >
      {/* ---------- Left / brand pane ---------- */}
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          color: "common.white",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            animation: `${slowZoom} 18s ease-in-out infinite alternate`,
          }}
        >
          <Image
            src="/images/hero-pool.jpg"
            alt=""
            fill
            priority
            sizes="55vw"
            style={{ objectFit: "cover" }}
          />
        </Box>

        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${BRAND_NAVY}f2 0%, ${BRAND_NAVY_MID}d9 45%, ${BRAND_TEAL}b3 100%)`,
          }}
        />

        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.35,
            mixBlendMode: "screen",
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.25) 0px, transparent 35%), radial-gradient(circle at 80% 90%, rgba(46,165,160,0.45) 0px, transparent 40%)",
          }}
        />

        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {bubbles.map((b) => (
            <Box
              key={b.id}
              sx={{
                position: "absolute",
                bottom: -40,
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 70%)",
                border: "1px solid rgba(255,255,255,0.25)",
                animation: `${floatBubble} ${b.duration}s linear ${b.delay}s infinite`,
                filter: "blur(0.3px)",
              }}
            />
          ))}
        </Box>

        <Stack
          spacing={1.5}
          sx={{
            position: "relative",
            zIndex: 1,
            px: { md: 6, lg: 8 },
            pt: { md: 6, lg: 7 },
            animation: `${fadeInLeft} 700ms ease both`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35)",
              }}
            >
              <WavesRoundedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Stack spacing={0}>
              <Typography sx={{ fontWeight: 800, letterSpacing: "-0.01em", fontSize: "1.05rem" }}>
                Aquatics Empowered
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                Operate · Protect · Grow
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack
          spacing={3}
          sx={{
            position: "relative",
            zIndex: 1,
            px: { md: 6, lg: 8 },
            py: { md: 6, lg: 7 },
            maxWidth: 560,
            animation: `${fadeInUp} 800ms 120ms ease both`,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontSize: { md: "2.6rem", lg: "3.1rem" },
              textShadow: "0 2px 30px rgba(0,0,0,0.25)",
            }}
          >
            Peace of mind for every pool you run.
          </Typography>
          <Typography
            sx={{
              fontSize: "1.05rem",
              opacity: 0.92,
              maxWidth: 480,
              lineHeight: 1.55,
            }}
          >
            Rural pools, hotels, city &amp; county aquatics, schools, and therapy water — one workspace
            for inspections, chemistry, maintenance, and your team.
          </Typography>

          <Stack spacing={1.25} sx={{ pt: 1 }}>
            {TRUST_POINTS.map((point, i) => (
              <Stack
                key={point}
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                sx={{
                  animation: `${fadeInUp} 600ms ${300 + i * 90}ms ease both`,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    fontSize: 20,
                    mt: "2px",
                    color: "rgba(255,255,255,0.95)",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
                  }}
                />
                <Typography sx={{ fontSize: "0.95rem", opacity: 0.95 }}>{point}</Typography>
              </Stack>
            ))}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              mt: 2,
              px: 1.5,
              py: 1,
              borderRadius: 999,
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(8px)",
              animation: `${fadeInUp} 700ms 600ms ease both`,
            }}
          >
            <ShieldRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em" }}>
              Encrypted in transit · Role-based access
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* ---------- Right / form pane ---------- */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 4 },
          py: { xs: 5, sm: 6 },
          minHeight: "100vh",
          background:
            "radial-gradient(circle at 100% 0%, rgba(46,165,160,0.10) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(0,59,111,0.08) 0%, transparent 50%), #f6f8fc",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: COMMUNITY_BRAND_GRADIENT,
            opacity: 0.08,
            filter: "blur(40px)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${BRAND_TEAL}, ${BRAND_NAVY_MID})`,
            opacity: 0.07,
            filter: "blur(60px)",
          }}
        />

        {/* Mobile-only brand header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            display: { xs: "flex", md: "none" },
            color: BRAND_NAVY,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              color: "common.white",
              background: COMMUNITY_BRAND_GRADIENT,
              boxShadow: "0 6px 16px -6px rgba(0, 59, 111, 0.55)",
            }}
          >
            <WavesRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>Aquatics Empowered</Typography>
        </Stack>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 440,
            animation: `${fadeInUp} 700ms 120ms ease both`,
          }}
        >
          <Box
            sx={{
              position: "relative",
              borderRadius: 3,
              p: { xs: 3, sm: 4.5 },
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 30px 60px -30px rgba(0, 59, 111, 0.35), 0 18px 40px -22px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.6)",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background:
                  "linear-gradient(90deg, transparent, rgba(46,165,160,0.9), rgba(0,59,111,0.9), transparent)",
                backgroundSize: "200% 100%",
                animation: `${shimmer} 6s linear infinite`,
              },
            }}
          >
            <Stack spacing={0.75} sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: BRAND_NAVY,
                }}
              >
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>

            {children}

            <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
              <Typography
                component={Link}
                href="/"
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  transition: "color 200ms ease",
                  "&:hover": { color: BRAND_NAVY },
                }}
              >
                ← Back to home
              </Typography>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 2.5,
              color: "text.secondary",
              opacity: 0.85,
            }}
          >
            © {new Date().getFullYear()} Aquatics Empowered™
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
