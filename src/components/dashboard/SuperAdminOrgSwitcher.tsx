"use client";

import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { setSuperAdminOrgAction } from "@/app/(dashboard)/app/actions/superAdminOrg";
import type { OrgOption } from "@/lib/auth/activeOrgShared";

export function SuperAdminOrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgOption[];
  activeOrgId: string | null;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const onChange = (event: SelectChangeEvent<string>) => {
    const orgId = event.target.value;
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    if (orgId) params.set("org", orgId);
    else params.delete("org");
    const qs = params.toString();
    const redirectTo = `${pathname || "/app"}${qs ? `?${qs}` : ""}`;

    const formData = new FormData();
    formData.set("orgId", orgId);
    formData.set("redirectTo", redirectTo);
    startTransition(async () => {
      await setSuperAdminOrgAction(formData);
    });
  };

  return (
    <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <BusinessRoundedIcon fontSize="small" color="primary" />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.06em" }}>
          FACILITY CONTEXT
        </Typography>
      </Box>
      <FormControl fullWidth size="small" disabled={pending}>
        <InputLabel id="super-admin-org-label" shrink>
          Organization
        </InputLabel>
        <Select
          labelId="super-admin-org-label"
          label="Organization"
          value={activeOrgId ?? ""}
          onChange={onChange}
          renderValue={(selected) =>
            selected ? (orgs.find((o) => o.id === selected)?.name ?? "Organization") : ""
          }
        >
            <MenuItem value="">
              <em>None (platform only)</em>
            </MenuItem>
            {orgs.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.name}
              </MenuItem>
            ))}
          </Select>
      </FormControl>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.35 }}>
        Switch facilities to view pools, logs, and maintenance as that org. Your account stays super admin.
      </Typography>
    </Box>
  );
}
