"use client";

import { Badge, Box, Tab, Tabs } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getSuperAdminPortalPath } from "@/lib/auth/superAdminPortalConstants";

export type VendorConsoleTab = "requests" | "directory" | "products";

function parseVendorTab(raw: string | null): VendorConsoleTab {
  if (raw === "directory") return "directory";
  if (raw === "products") return "products";
  return "requests";
}

export function VendorConsoleTabs({ pendingCount }: { pendingCount: number }) {
  const searchParams = useSearchParams();
  const tab = parseVendorTab(searchParams.get("tab"));
  const base = getSuperAdminPortalPath();

  const href = (t: VendorConsoleTab) => `${base}?section=vendors&tab=${t}`;

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 1,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Tabs
        value={tab}
        sx={{
          minHeight: 48,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            minHeight: 48,
            fontWeight: 600,
            textTransform: "none",
            transition: (theme) => theme.transitions.create(["color", "opacity"]),
            "&:hover": { opacity: 0.85 },
          },
          "& .Mui-selected": {
            color: "primary.main",
          },
        }}
      >
        <Tab
          component={Link}
          href={href("requests")}
          value="requests"
          label={
            pendingCount > 0 ? (
              <Badge badgeContent={pendingCount} color="warning" sx={{ pr: 1.5 }}>
                Requests
              </Badge>
            ) : (
              "Requests"
            )}
          sx={{
            "&.Mui-selected": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              borderRadius: 1.5,
            },
          }}
        />
        <Tab
          component={Link}
          href={href("directory")}
          value="directory"
          label="Directory"
          sx={{
            "&.Mui-selected": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              borderRadius: 1.5,
            },
          }}
        />
        <Tab
          component={Link}
          href={href("products")}
          value="products"
          label="Products"
          sx={{
            "&.Mui-selected": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              borderRadius: 1.5,
            },
          }}
        />
      </Tabs>
    </Box>
  );
}
