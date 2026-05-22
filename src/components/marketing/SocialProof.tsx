"use client";

import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 16px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const testimonials: {
  quote: string;
  name: string;
  role: string;
  facility: string;
  initials: string;
  accent: string;
}[] = [
  {
    quote:
      "We replaced three notebooks, two spreadsheets, and a group text. Compliance went from anxiety-inducing to a one-click export.",
    name: "Marisa Holloway",
    role: "Aquatics Director",
    facility: "Lakeshore Community Y",
    initials: "MH",
    accent: "#003B6F",
  },
  {
    quote:
      "Pump failures used to mean a closed pool. Now we get alerts a week before, schedule the fix, and stay open.",
    name: "Devon Carter",
    role: "Facilities Manager",
    facility: "Eastside Recreation Center",
    initials: "DC",
    accent: "#2EA5A0",
  },
  {
    quote:
      "Our chemical bill dropped 18% the first quarter — without changing brands. The procurement guidance alone pays for the platform.",
    name: "Priya Reddy",
    role: "Director of Operations",
    facility: "Cascade Aquatic Center",
    initials: "PR",
    accent: "#7C3AED",
  },
];

export function SocialProof() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        py: { xs: 8, md: 12 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 7 } }}>
          <Stack direction="row" spacing={0.25} justifyContent="center">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarRoundedIcon key={i} sx={{ color: "#F59E0B", fontSize: 24 }} />
            ))}
          </Stack>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Trusted by the operators who run the deck
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            Real teams, real facilities — the same people who feel the pressure of a busy summer weekend.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {testimonials.map((t, idx) => (
            <Box
              key={t.name}
              sx={{
                position: "relative",
                p: 3.5,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                opacity: 0,
                animation: `${fadeUp} 700ms ease-out ${100 + idx * 100}ms forwards`,
                transition: "transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  borderColor: alpha(t.accent, 0.35),
                  boxShadow: `0 18px 40px -16px ${alpha(t.accent, 0.32)}`,
                },
              }}
            >
              <FormatQuoteRoundedIcon
                aria-hidden
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  fontSize: 56,
                  color: alpha(t.accent, 0.12),
                  transform: "rotate(180deg)",
                }}
              />
              <Stack spacing={3} sx={{ position: "relative" }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontSize: "1.02rem",
                    lineHeight: 1.65,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      background: `linear-gradient(135deg, ${t.accent} 0%, ${alpha(t.accent, 0.7)} 100%)`,
                      color: "common.white",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                    }}
                  >
                    {t.initials}
                  </Avatar>
                  <Stack spacing={0}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t.role} · {t.facility}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
