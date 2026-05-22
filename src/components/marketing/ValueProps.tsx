"use client";

import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PoolRoundedIcon from "@mui/icons-material/PoolRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Box, Container, Stack, Typography } from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";

const fadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 16px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const items: {
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    title: "Protect every swimmer",
    body: "Daily chemistry logs, SOPs, and incident workflows that keep your water safe and your team confident — every shift, every season.",
    icon: <ShieldRoundedIcon />,
    accent: "#003B6F",
  },
  {
    title: "Cut operating cost",
    body: "Pre-negotiated procurement, vendor accountability, and usage analytics that surface the real savings hiding in your budget.",
    icon: <SavingsRoundedIcon />,
    accent: "#2EA5A0",
  },
  {
    title: "Prevent shutdowns",
    body: "Preventive-maintenance templates and expert escalation catch failing pumps, heaters, and chemistry drift before they close the pool.",
    icon: <PoolRoundedIcon />,
    accent: "#0EA5E9",
  },
  {
    title: "Operate from one place",
    body: "Replace clipboards, spreadsheets, and chat threads with one source of truth that maintenance, ops, and leadership all share.",
    icon: <InsightsRoundedIcon />,
    accent: "#7C3AED",
  },
  {
    title: "Audit-ready records",
    body: "Health-department logs, CPO/AFO documentation, and corrective actions captured automatically — exportable in one click.",
    icon: <WorkspacePremiumRoundedIcon />,
    accent: "#F59E0B",
  },
  {
    title: "A network behind you",
    body: "Founders, advisors, and vetted vendors are one message away. You're not running your facility alone anymore.",
    icon: <HandshakeRoundedIcon />,
    accent: "#EC4899",
  },
];

export function ValueProps() {
  const theme = useTheme();

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
        <Stack spacing={2} sx={{ textAlign: "center", maxWidth: 760, mx: "auto", mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{
              color: "secondary.main",
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            What you get
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Built for the realities of running aquatics
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1.1rem", lineHeight: 1.6 }}>
            Aquatics Empowered turns the day-to-day grind into a system. Less firefighting, fewer surprises,
            measurable savings — and a team that finally has the tools they deserve.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {items.map((item, idx) => (
            <Box
              key={item.title}
              sx={{
                position: "relative",
                p: 3.5,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                overflow: "hidden",
                cursor: "default",
                opacity: 0,
                animation: `${fadeUp} 600ms ease-out ${80 + idx * 70}ms forwards`,
                transition: theme.transitions.create(
                  ["transform", "box-shadow", "border-color"],
                  { duration: 220 },
                ),
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  padding: "1px",
                  background: `linear-gradient(135deg, ${item.accent}, ${alpha(item.accent, 0)})`,
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  opacity: 0,
                  transition: "opacity 240ms ease",
                  pointerEvents: "none",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: `radial-gradient(closest-side, ${alpha(item.accent, 0.22)}, transparent 70%)`,
                  opacity: 0,
                  transition: "opacity 320ms ease",
                  pointerEvents: "none",
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 24px 50px -20px ${alpha(item.accent, 0.35)}, 0 8px 16px -8px rgba(15,23,42,0.08)`,
                  borderColor: alpha(item.accent, 0.3),
                  "&::before": { opacity: 1 },
                  "&::after": { opacity: 1 },
                  ".vp-icon": {
                    transform: "scale(1.08) rotate(-3deg)",
                    boxShadow: `0 14px 30px -8px ${alpha(item.accent, 0.55)}`,
                  },
                },
              }}
            >
              <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
                <Box
                  className="vp-icon"
                  sx={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2,
                    color: "common.white",
                    background: `linear-gradient(135deg, ${item.accent} 0%, ${alpha(item.accent, 0.75)} 100%)`,
                    transition: "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 260ms ease",
                    "& svg": { fontSize: 28 },
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.65 }}>
                  {item.body}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
