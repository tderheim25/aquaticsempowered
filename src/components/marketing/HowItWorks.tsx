"use client";

import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Box, Container, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 16px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const steps = [
  {
    n: "01",
    icon: <AssignmentTurnedInRoundedIcon />,
    title: "Onboard your facility in a day",
    body: "Walk through a 30-minute kickoff with our team. We import your facility, configure tests and SOPs, and your staff is logging by tomorrow morning.",
  },
  {
    n: "02",
    icon: <AutoGraphRoundedIcon />,
    title: "Run operations from one place",
    body: "Chemistry, maintenance, vendors, incidents, audits — all in a single, mobile-first portal your team actually uses on deck.",
  },
  {
    n: "03",
    icon: <RocketLaunchRoundedIcon />,
    title: "Compound the gains",
    body: "Trends, alerts, and procurement insights translate into real savings, fewer shutdowns, and a stronger facility story to your board.",
  },
];

export function HowItWorks() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        py: { xs: 8, md: 12 },
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(46,165,160,0.06) 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: { xs: 5, md: 8 } }}>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.18em" }}>
            How it works
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            From clipboards to compound gains
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            A founder onboarding designed by aquatic operators — not a generic SaaS playbook.
          </Typography>
        </Stack>

        <Box sx={{ position: "relative" }}>
          {/* Connecting line (desktop) */}
          <Box
            aria-hidden
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 44,
              left: "8%",
              right: "8%",
              height: 2,
              background:
                "repeating-linear-gradient(90deg, rgba(46,165,160,0.45) 0 8px, rgba(46,165,160,0) 8px 16px)",
              zIndex: 0,
            }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: { xs: 3, md: 4 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {steps.map((s, idx) => (
              <Box
                key={s.n}
                sx={{
                  textAlign: { xs: "left", md: "center" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: { xs: "flex-start", md: "center" },
                  gap: 2,
                  opacity: 0,
                  animation: `${fadeUp} 700ms ease-out ${120 + idx * 120}ms forwards`,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: (t) => alpha(t.palette.primary.main, 0.18),
                    boxShadow: (t) => `0 12px 30px -16px ${alpha(t.palette.primary.main, 0.4)}`,
                    "& svg": { fontSize: 36 },
                  }}
                >
                  {s.icon}
                  <Box
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      letterSpacing: "0.04em",
                      boxShadow: "0 6px 14px -4px rgba(46,165,160,0.5)",
                    }}
                  >
                    {s.n}
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.65, maxWidth: 320 }}>
                  {s.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
