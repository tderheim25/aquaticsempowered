"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { useBreadcrumbLastLabel } from "./BreadcrumbLabelContext";

/** Maps path segments under `/app` to human-readable labels (last segment wins). */
const SEGMENT_LABELS: Record<string, string> = {
  app: "Dashboard",
  maintenance: "Maintenance",
  admin: "Admin",
  users: "User management",
  permissions: "Permissions",
  "chemical-logs": "Chemical Logs",
  forbidden: "Access denied",
  "needs-profile": "Account setup",
  support: "Support Center",
  community: "Community",
  profile: "Profile",
  vendors: "Vendor Directory",
  procurement: "Procurement",
  "training-cpo": "Training / CPO",
  monitoring: "Monitoring",
  "no-organization": "Organization required",
};

function normalizePath(path: string) {
  const p = path.replace(/\/$/, "") || "/";
  return p === "" ? "/" : p;
}

function isUuidSegment(seg: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg);
}

function buildCrumbs(pathname: string, lastLabelOverride: string | null): { label: string; href: string }[] {
  const path = normalizePath(pathname);
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0 || segments[0] !== "app") {
    return [{ label: "Dashboard", href: "/app" }];
  }

  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const seg = segments[i];
    const prev = segments[i - 1];
    const isProfileUserId = isUuidSegment(seg) && prev === "profile";
    const label = isProfileUserId
      ? lastLabelOverride?.trim() || "Profile"
      : SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: acc });
  }

  return crumbs;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const lastLabelOverride = useBreadcrumbLastLabel();
  const crumbs = buildCrumbs(pathname ?? "", lastLabelOverride);

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" sx={{ opacity: 0.6 }} />}
      sx={{ mb: 2 }}
      aria-label="breadcrumb"
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        if (last) {
          return (
            <Typography key={c.href} color="text.primary" variant="body2" sx={{ fontWeight: 600 }}>
              {c.label}
            </Typography>
          );
        }
        return (
          <MuiLink
            key={c.href}
            component={NextLink}
            href={c.href}
            underline="hover"
            color="inherit"
            variant="body2"
          >
            {c.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}
