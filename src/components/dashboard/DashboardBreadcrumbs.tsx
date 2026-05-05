"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

/** Maps path segments under `/app` to human-readable labels (last segment wins). */
const SEGMENT_LABELS: Record<string, string> = {
  app: "Dashboard",
  admin: "Admin",
  users: "User management",
  permissions: "Permissions",
  forbidden: "Access denied",
  "needs-profile": "Account setup",
};

function normalizePath(path: string) {
  const p = path.replace(/\/$/, "") || "/";
  return p === "" ? "/" : p;
}

function buildCrumbs(pathname: string): { label: string; href: string }[] {
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
    const label =
      SEGMENT_LABELS[seg] ??
      seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: acc });
  }

  return crumbs;
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname ?? "");

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
