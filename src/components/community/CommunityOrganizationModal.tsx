"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import type { CommunityOrganizationSpotlight } from "@/lib/community/organizationSpotlight";
import { normalizeOrganizationUrl } from "@/lib/community/organizationSpotlight";

import { communityContainedButtonSx } from "./communityUi";

function planLabel(code: string | null) {
  if (!code) return null;
  return code.replace(/_/g, " ");
}

function tierLabel(tier: string | null) {
  if (!tier) return null;
  return tier.replace(/_/g, " ");
}

export function CommunityOrganizationModal({
  organization,
  open,
  onClose,
}: {
  organization: CommunityOrganizationSpotlight | null;
  open: boolean;
  onClose: () => void;
}) {
  const website = organization?.website_url
    ? normalizeOrganizationUrl(organization.website_url)
    : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        {organization?.name ?? "Organization"}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Organization profile
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
          aria-label="Close"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      {organization ? (
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                {organization.name.slice(0, 2).toUpperCase()}
              </Box>
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {organization.tier ? (
                    <Chip size="small" label={tierLabel(organization.tier)} variant="outlined" />
                  ) : null}
                  {organization.plan_code ? (
                    <Chip size="small" label={planLabel(organization.plan_code)} color="primary" variant="outlined" />
                  ) : null}
                  {organization.founder ? <Chip size="small" label="Founder" color="secondary" /> : null}
                  {organization.isDemo ? (
                    <Chip size="small" label="Sample listing" variant="outlined" />
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {organization.description}
            </Typography>

            {organization.phone ? (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>
                  Phone
                </Typography>
                <Typography variant="body2">
                  <Link href={`tel:${organization.phone.replace(/\s/g, "")}`}>{organization.phone}</Link>
                </Typography>
              </Box>
            ) : null}

            {website ? (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>
                  Website
                </Typography>
                <Typography variant="body2">
                  <Link href={website} target="_blank" rel="noopener noreferrer">
                    {website}
                  </Link>
                </Typography>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {organization ? (
          <Button
            variant="contained"
            component="a"
            href={organization.visitHref}
            target={organization.visitExternal ? "_blank" : undefined}
            rel={organization.visitExternal ? "noopener noreferrer" : undefined}
            endIcon={organization.visitExternal ? <OpenInNewRoundedIcon /> : undefined}
            onClick={onClose}
            sx={communityContainedButtonSx()}
          >
            Visit organization
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
