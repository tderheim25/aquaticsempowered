import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { SoftStatCard } from "@/components/ui/SoftStatCard";
import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { hrefWithOrg } from "@/lib/auth/activeOrgShared";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile, requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { softUiTokens } from "@/theme/softUiTokens";

export const metadata = {
  title: "Dashboard | Aquatics Empowered",
};

function toFirstName(fullName: string | null | undefined, email: string | null | undefined) {
  const fromFullName = fullName?.trim().split(/\s+/)[0];
  const raw = fromFullName || email?.split("@")[0] || "Operator";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default async function DashboardHomePage() {
  await requireViewAccess("dashboard_home");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUsersRowWithAdminFallback(user.id) : null;
  const allowedViews = await getAllowedViewsForProfile(
    profile ? { role: profile.role, app_role_id: profile.app_role_id } : null
  );
  const isOrgAdmin = profile?.role === "org_admin";
  const firstName = toFirstName(profile?.full_name, user?.email);

  const orgId = profile ? await resolveActiveOrgId(profile) : null;
  const hasOrg = Boolean(orgId);
  const superAdminOrgLink =
    profile?.role === "super_admin" && !profile.org_id && orgId ? orgId : null;

  // Lightweight KPI counts scoped to the user's organization.
  // Errors are silently treated as zero so a missing table or permission
  // never breaks the dashboard home.
  const [poolsCountRes, logsCountRes, openTicketsRes] = orgId
    ? await Promise.all([
        supabase.from("pools").select("id", { count: "exact", head: true }).eq("org_id", orgId),
        supabase
          .from("chemical_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .in("status", ["open", "pending"]),
      ])
    : [
        { count: 0 as number | null },
        { count: 0 as number | null },
        { count: 0 as number | null },
      ];

  const poolsCount = poolsCountRes.count ?? 0;
  const recentLogsCount = logsCountRes.count ?? 0;
  const openTicketsCount = openTicketsRes.count ?? 0;

  const workspaceTools: {
    title: string;
    href: string;
    description: string;
    viewKey:
      | "pools"
      | "maintenance"
      | "chemical_logs"
      | "support_center"
      | "community"
      | "vendor_directory"
      | "procurement"
      | "training_cpo"
      | "monitoring";
    /** When true (default), users without an organization are sent to the org setup gate. */
    requiresOrg?: boolean;
  }[] = [
    {
      title: "Pools",
      href: "/app/pools",
      description: "Register pools and spas for chemistry, maintenance, and monitoring.",
      viewKey: "pools",
      requiresOrg: true,
    },
    {
      title: "Maintenance",
      href: "/app/maintenance",
      description: "Schedule and track facility maintenance tasks.",
      viewKey: "maintenance",
      requiresOrg: true,
    },
    {
      title: "Chemical Logs",
      href: "/app/chemical-logs",
      description: "Record water chemistry, history, and Langelier Saturation Index.",
      viewKey: "chemical_logs",
      requiresOrg: false,
    },
    {
      title: "Vendor Directory",
      href: "/app/vendors",
      description: "Browse certified partners, suppliers, and service providers.",
      viewKey: "vendor_directory",
      requiresOrg: false,
    },
    {
      title: "Procurement",
      href: "/app/procurement",
      description: "Log supply needs, preferred vendors, and requisition status for your facility.",
      viewKey: "procurement",
      requiresOrg: true,
    },
    {
      title: "Training / CPO",
      href: "/app/training-cpo",
      description: "Study outline, trusted references, and context for operator certification.",
      viewKey: "training_cpo",
      requiresOrg: false,
    },
    {
      title: "Monitoring",
      href: "/app/monitoring",
      description: "Water-quality attention summary from chemical logs.",
      viewKey: "monitoring",
      requiresOrg: false,
    },
    {
      title: "Support Center",
      href: "/app/support",
      description: "Get help, browse resources, and manage support tickets.",
      viewKey: "support_center",
      requiresOrg: false,
    },
    {
      title: "Trouble ticket",
      href: "/app/support?new=1",
      description: "Open the ticket form directly for a facility or water-quality issue.",
      viewKey: "support_center",
      requiresOrg: false,
    },
    {
      title: "Community",
      href: "/community",
      description: "Connect with teammates: posts, likes, photos, and profiles.",
      viewKey: "community",
      requiresOrg: false,
    },
  ];

  const visibleWorkspaceTools = workspaceTools
    .filter((t) => allowedViews.includes(t.viewKey))
    .map((t) => {
      const needsOrg = t.requiresOrg !== false;
      let href = t.href;
      if (needsOrg && !hasOrg) href = "/app/no-organization";
      else if (needsOrg && superAdminOrgLink) href = hrefWithOrg(href, superAdminOrgLink);
      return { ...t, href };
    });

  const comingSoonAreas: string[] = [];

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100%",
        py: { xs: 3, md: 4 },
        backgroundImage: `${softUiTokens.background.gradient}, radial-gradient(ellipse 60% 40% at 100% -10%, ${softUiTokens.accent.coral.bg}, transparent 60%), radial-gradient(ellipse 50% 35% at 0% 10%, ${softUiTokens.accent.aqua.bg}, transparent 55%)`,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          {/* Welcome hero --- soft pastel gradient, large display type */}
          <Box
            sx={{
              borderRadius: `${softUiTokens.radius.card}px`,
              p: { xs: 3, md: 4 },
              background: `linear-gradient(135deg, ${softUiTokens.accent.aqua.soft} 0%, #FFFFFF 55%, ${softUiTokens.accent.coral.soft} 130%)`,
              boxShadow: softUiTokens.shadow.card,
              border: "1px solid rgba(15, 35, 54, 0.05)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: softUiTokens.text.muted,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                  }}
                >
                  Operator Dashboard
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: softUiTokens.text.primary,
                    mt: 0.5,
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                  }}
                >
                  Hello {firstName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, maxWidth: 520, color: softUiTokens.text.secondary }}
                >
                  Monitor pool chemistry, maintenance, and operations — all in one calm
                  command center.
                </Typography>
              </Box>
              <Box
                sx={{
                  textAlign: { xs: "left", md: "right" },
                  bgcolor: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 3,
                  px: 2,
                  py: 1.25,
                  border: "1px solid rgba(15,35,54,0.06)",
                }}
              >
                <Typography variant="caption" sx={{ color: softUiTokens.text.muted, fontWeight: 600 }}>
                  Signed in as
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: softUiTokens.text.primary, wordBreak: "break-all" }}
                >
                  {user?.email}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* KPI strip --- soft stat cards with radial indicators */}
          {hasOrg ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              <SoftStatCard
                label="Pools"
                value={poolsCount}
                hint={poolsCount === 1 ? "Active facility pool" : "Active facility pools"}
                accent="aqua"
                progress={Math.min(100, poolsCount * 18)}
                trend="up"
                href="/app/pools"
              />
              <SoftStatCard
                label="Logs (7d)"
                value={recentLogsCount}
                hint="Chemical readings this week"
                accent="sky"
                progress={Math.min(100, recentLogsCount * 6)}
                trend={recentLogsCount > 0 ? "up" : "down"}
                href="/app/chemical-logs"
              />
              <SoftStatCard
                label="Open tickets"
                value={openTicketsCount}
                hint={openTicketsCount ? "Awaiting your response" : "Inbox is clear"}
                accent={openTicketsCount ? "amber" : "mint"}
                progress={openTicketsCount ? Math.min(100, openTicketsCount * 20) : 100}
                trend={openTicketsCount ? "down" : "up"}
                href="/app/support"
              />
              <SoftStatCard
                label="Workspace"
                value={visibleWorkspaceTools.length}
                hint="Tools available to you"
                accent="violet"
                progress={Math.min(
                  100,
                  Math.round((visibleWorkspaceTools.length / Math.max(workspaceTools.length, 1)) * 100),
                )}
                trend="up"
              />
            </Box>
          ) : null}

          {isOrgAdmin && hasOrg ? (
            <Card
              elevation={0}
              sx={{
                borderRadius: `${softUiTokens.radius.card}px`,
                boxShadow: softUiTokens.shadow.card,
                border: "1px solid rgba(15, 35, 54, 0.05)",
                bgcolor: softUiTokens.background.card,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 0.5, color: softUiTokens.text.primary }}
                >
                  Facility team
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: softUiTokens.text.secondary }}
                >
                  Invite teammates and manage roles for your organization.
                </Typography>
                <Button
                  component={Link}
                  href="/app/team"
                  variant="contained"
                  sx={{ borderRadius: 999, px: 2.5 }}
                >
                  Open team management
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {visibleWorkspaceTools.length > 0 ? (
            <Box>
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                sx={{ mb: 1.5, px: 0.5 }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: softUiTokens.text.primary, letterSpacing: "-0.015em" }}
                >
                  Workspace
                </Typography>
                <Typography variant="caption" sx={{ color: softUiTokens.text.muted, fontWeight: 600 }}>
                  {visibleWorkspaceTools.length} tools
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {visibleWorkspaceTools.map((area, idx) => {
                  const accents = ["aqua", "coral", "amber", "violet", "mint", "sky", "navy"] as const;
                  const accent = softUiTokens.accent[accents[idx % accents.length]];
                  return (
                    <Grid key={area.title} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Card
                        elevation={0}
                        sx={{
                          height: "100%",
                          borderRadius: `${softUiTokens.radius.card}px`,
                          bgcolor: softUiTokens.background.card,
                          boxShadow: softUiTokens.shadow.card,
                          border: "1px solid rgba(15, 35, 54, 0.05)",
                          overflow: "hidden",
                          transition:
                            "transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: softUiTokens.shadow.cardHover,
                          },
                        }}
                      >
                        <CardActionArea component={Link} href={area.href} sx={{ height: "100%", p: 0 }}>
                          <Box
                            sx={{
                              height: 4,
                              background: `linear-gradient(90deg, ${accent.ring} 0%, ${accent.soft} 100%)`,
                            }}
                          />
                          <CardContent sx={{ p: 2.5 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: accent.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mb: 1.5,
                                color: accent.ring,
                                fontFamily: "var(--font-jakarta), sans-serif",
                                fontWeight: 800,
                                fontSize: "1rem",
                              }}
                            >
                              {area.title.charAt(0)}
                            </Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                mb: 0.5,
                                color: softUiTokens.text.primary,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {area.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: softUiTokens.text.secondary, lineHeight: 1.5 }}
                            >
                              {area.description}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ) : null}

          {comingSoonAreas.length > 0 ? (
            <Card
              elevation={0}
              sx={{
                borderRadius: `${softUiTokens.radius.card}px`,
                bgcolor: softUiTokens.background.card,
                boxShadow: softUiTokens.shadow.card,
                border: "1px solid rgba(15, 35, 54, 0.05)",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 1.5, color: softUiTokens.text.primary }}
                >
                  Upcoming Tools
                </Typography>
                <Grid container spacing={1.25}>
                  {comingSoonAreas.map((area) => (
                    <Grid key={area} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          border: "1px solid rgba(15, 35, 54, 0.06)",
                          borderRadius: 2,
                          px: 1.5,
                          py: 1.25,
                          bgcolor: "rgba(255,255,255,0.5)",
                        }}
                      >
                        <Typography variant="body2" sx={{ color: softUiTokens.text.primary }}>
                          {area}
                        </Typography>
                        <Chip label="Soon" size="small" />
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
