"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import Link from "next/link";

import { ESSENTIAL_MONTHLY_USD, PRO_MONTHLY_USD } from "@/lib/marketing/publicPricing";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 16px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const tiers: {
  name: string;
  price: string;
  unit?: string;
  blurb: string;
  highlights: string[];
  cta: string;
  href: string;
  featured?: boolean;
}[] = [
  {
    name: "Community",
    price: "$0",
    blurb: "For aquatic professionals who want a seat at the table.",
    highlights: ["Member forum", "Public SOP library", "Vendor directory"],
    cta: "Join free",
    href: "/community",
  },
  {
    name: "Essential",
    price: `$${ESSENTIAL_MONTHLY_USD}`,
    unit: "/mo",
    blurb: "Run daily ops with chemistry, maintenance, and audit-ready logs.",
    highlights: ["Daily chemistry logs", "Maintenance templates", "Support portal", "Up to 2 pools"],
    cta: "Start with Essential",
    href: "/pricing",
  },
  {
    name: "Professional",
    price: `$${PRO_MONTHLY_USD}`,
    unit: "/mo",
    blurb: "Everything in Essential plus vendor & procurement intelligence.",
    highlights: [
      "Everything in Essential",
      "Procurement & rebates",
      "Quarterly facility audit",
      "Priority vendor matching",
      "Unlimited pools",
    ],
    cta: "Start with Professional",
    href: "/pricing",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "From $1,500",
    unit: "/mo",
    blurb: "Multi-facility command center with real-time monitoring & advisory.",
    highlights: ["Real-time sensor monitoring", "Dedicated advisor", "Capital planning", "SSO + roles"],
    cta: "Talk to sales",
    href: "/pricing",
  },
];

export function PricingTeaser() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.18em" }}>
            Membership tiers
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Simple, honest pricing for every facility
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            Start free, upgrade when you&apos;re ready. Founder facilities lock in preferred pricing for life.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "stretch",
          }}
        >
          {tiers.map((t, idx) => {
            const featured = !!t.featured;
            return (
              <Box
                key={t.name}
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 3, md: 3.5 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: featured ? "transparent" : "divider",
                  bgcolor: featured ? "transparent" : "background.paper",
                  background: featured
                    ? "linear-gradient(160deg, #003B6F 0%, #074a86 55%, #0E7A75 100%)"
                    : undefined,
                  color: featured ? "common.white" : "text.primary",
                  boxShadow: featured
                    ? "0 30px 60px -24px rgba(0,59,111,0.55), 0 12px 30px -12px rgba(46,165,160,0.35)"
                    : "0 1px 2px rgba(15,23,42,0.04)",
                  transform: featured ? { md: "translateY(-12px) scale(1.02)" } : "none",
                  opacity: 0,
                  animation: `${fadeUp} 700ms ease-out ${100 + idx * 90}ms forwards`,
                  transition: "transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
                  "&:hover": {
                    transform: featured
                      ? { md: "translateY(-16px) scale(1.025)" }
                      : "translateY(-4px)",
                    borderColor: featured ? "transparent" : (theme) => alpha(theme.palette.primary.main, 0.3),
                    boxShadow: featured
                      ? "0 36px 72px -24px rgba(0,59,111,0.6), 0 14px 36px -10px rgba(46,165,160,0.45)"
                      : "0 18px 40px -16px rgba(15,23,42,0.18)",
                  },
                }}
              >
                {featured ? (
                  <Chip
                    label="Most popular"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "#FFD66B",
                      color: "#1a1a1a",
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      px: 1,
                      boxShadow: "0 10px 24px -10px rgba(255,214,107,0.6)",
                    }}
                  />
                ) : null}

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: featured ? "rgba(255,255,255,0.85)" : "text.secondary",
                    }}
                  >
                    {t.name}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "2rem", md: "2.4rem" },
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {t.price}
                    </Typography>
                    {t.unit ? (
                      <Typography
                        sx={{
                          fontWeight: 600,
                          opacity: featured ? 0.85 : 0.7,
                          fontSize: "1rem",
                        }}
                      >
                        {t.unit}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: featured ? "rgba(255,255,255,0.85)" : "text.secondary",
                      lineHeight: 1.55,
                      minHeight: { md: 48 },
                    }}
                  >
                    {t.blurb}
                  </Typography>
                </Stack>

                <Stack spacing={1.25} sx={{ flexGrow: 1, mb: 3 }}>
                  {t.highlights.map((h) => (
                    <Stack direction="row" spacing={1} alignItems="flex-start" key={h}>
                      <CheckCircleRoundedIcon
                        sx={{
                          fontSize: 18,
                          mt: "2px",
                          color: featured ? "#6ee7e3" : "secondary.main",
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: featured ? "rgba(255,255,255,0.92)" : "text.primary" }}>
                        {h}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  component={Link}
                  href={t.href}
                  endIcon={<ArrowForwardRoundedIcon />}
                  variant={featured ? "contained" : "outlined"}
                  fullWidth
                  sx={
                    featured
                      ? {
                          py: 1.25,
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #FFD66B 0%, #FFB547 100%)",
                          color: "#1a1a1a",
                          boxShadow: "0 12px 30px -10px rgba(255,181,71,0.55)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #FFDF85 0%, #FFC369 100%)",
                          },
                        }
                      : {
                          py: 1.25,
                          fontWeight: 700,
                          borderColor: "divider",
                          color: "text.primary",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          },
                        }
                  }
                >
                  {t.cta}
                </Button>
              </Box>
            );
          })}
        </Box>

        <Typography
          variant="body2"
          align="center"
          sx={{ color: "text.secondary", mt: { xs: 4, md: 5 } }}
        >
          All plans include unlimited team members, secure logs, and access to the founder community.
        </Typography>
      </Container>
    </Box>
  );
}
