"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setActiveOrgAction } from "@/app/(dashboard)/app/actions/superAdminOrg";
import { AddFacilityDialog } from "@/components/dashboard/AddFacilityDialog";
import type { OrgOption } from "@/lib/auth/activeOrgShared";
import { createClient } from "@/lib/supabase/client";

const ADD_FACILITY_VALUE = "__add_facility__";

function switchToOrg(
  orgId: string,
  pathname: string,
  startTransition: (fn: () => void | Promise<void>) => void,
  router: ReturnType<typeof useRouter>,
) {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  if (orgId) params.set("org", orgId);
  else params.delete("org");
  const qs = params.toString();
  const redirectTo = `${pathname || "/app"}${qs ? `?${qs}` : ""}`;

  const formData = new FormData();
  formData.set("orgId", orgId);
  formData.set("redirectTo", redirectTo);

  startTransition(async () => {
    const result = await setActiveOrgAction(formData);
    if (result.refreshSession) {
      const supabase = createClient();
      await supabase.auth.refreshSession();
    }
    router.push(result.redirectTo);
    router.refresh();
  });
}

export function FacilityOrgSwitcher({
  orgs,
  activeOrgId,
  allowNone = false,
  canCreateFacility = false,
  compact = false,
  collapsed = false,
  helperText,
  isFounder = false,
}: {
  orgs: OrgOption[];
  activeOrgId: string | null;
  allowNone?: boolean;
  canCreateFacility?: boolean;
  compact?: boolean;
  collapsed?: boolean;
  helperText?: string;
  isFounder?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const activeName = activeOrgId
    ? (orgs.find((o) => o.id === activeOrgId)?.name ?? "Facility")
    : allowNone
      ? "None (platform only)"
      : "Facility";

  const onChange = (event: SelectChangeEvent<string>) => {
    const orgId = event.target.value;
    if (orgId === ADD_FACILITY_VALUE) {
      setAddOpen(true);
      return;
    }
    switchToOrg(orgId, pathname, startTransition, router);
  };

  const onMenuPick = (orgId: string) => {
    setMenuAnchor(null);
    if (orgId === ADD_FACILITY_VALUE) {
      setAddOpen(true);
      return;
    }
    switchToOrg(orgId, pathname, startTransition, router);
  };

  const selectMenuItems = [
    ...(allowNone
      ? [<MenuItem key="none" value="">None (platform only)</MenuItem>]
      : []),
    ...orgs.map((o) => (
      <MenuItem key={o.id} value={o.id}>
        {o.name}
      </MenuItem>
    )),
    ...(canCreateFacility
      ? [
          <MenuItem
            key="add"
            value={ADD_FACILITY_VALUE}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AddRoundedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Add facility" />
          </MenuItem>,
        ]
      : []),
  ];

  const collapsedMenuItems = (
    <>
      {allowNone ? (
        <MenuItem selected={!activeOrgId} onClick={() => onMenuPick("")}>
          <em>None (platform only)</em>
        </MenuItem>
      ) : null}
      {orgs.map((o) => (
        <MenuItem key={o.id} selected={o.id === activeOrgId} onClick={() => onMenuPick(o.id)}>
          {o.name}
        </MenuItem>
      ))}
      {canCreateFacility ? (
        <>
          {orgs.length > 0 || allowNone ? <Divider sx={{ my: 0.5 }} /> : null}
          <MenuItem onClick={() => onMenuPick(ADD_FACILITY_VALUE)} sx={{ color: "primary.main", fontWeight: 600 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AddRoundedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Add facility" />
          </MenuItem>
        </>
      ) : null}
    </>
  );

  if (collapsed) {
    return (
      <>
        <Tooltip title={activeName} placement="right">
          <IconButton
            size="small"
            disabled={pending}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <BusinessRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {collapsedMenuItems}
        </Menu>
        <AddFacilityDialog open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    );
  }

  if (compact) {
    return (
      <>
        <FormControl fullWidth size="small" disabled={pending} sx={{ mt: 0.5 }}>
          <Select
            value={activeOrgId ?? ""}
            onChange={onChange}
            displayEmpty
            IconComponent={ExpandMoreRoundedIcon}
            renderValue={() => (
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, pr: 0.5 }}>
                {activeName}
              </Typography>
            )}
            sx={{
              bgcolor: "background.paper",
              "& .MuiSelect-select": { py: 0.75, display: "flex", alignItems: "center" },
            }}
          >
            {selectMenuItems}
          </Select>
        </FormControl>
        {isFounder ? (
          <Chip size="small" label="Founder" color="secondary" sx={{ mt: 0.75, height: 22 }} />
        ) : null}
        <AddFacilityDialog open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <BusinessRoundedIcon fontSize="small" color="primary" />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.06em" }}>
            FACILITY CONTEXT
          </Typography>
        </Box>
        <FormControl fullWidth size="small" disabled={pending}>
          <InputLabel id="facility-org-label" shrink>
            Organization
          </InputLabel>
          <Select
            labelId="facility-org-label"
            label="Organization"
            value={activeOrgId ?? ""}
            onChange={onChange}
            renderValue={(selected) =>
              selected ? (orgs.find((o) => o.id === selected)?.name ?? "Organization") : ""
            }
          >
            {selectMenuItems}
          </Select>
        </FormControl>
        {helperText ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.35 }}>
            {helperText}
          </Typography>
        ) : null}
      </Box>
      <AddFacilityDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

/** @deprecated Use FacilityOrgSwitcher */
export function SuperAdminOrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgOption[];
  activeOrgId: string | null;
}) {
  return (
    <FacilityOrgSwitcher
      orgs={orgs}
      activeOrgId={activeOrgId}
      allowNone
      helperText="Switch facilities to view pools, logs, and maintenance as that org. Your account stays super admin."
    />
  );
}
