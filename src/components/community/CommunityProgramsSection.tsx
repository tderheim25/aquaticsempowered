import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import type { PlanCode } from "@/types/database";

import { COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT } from "@/lib/energy-audit/communityAuditLimits.shared";

import { CommunityEnergyAuditWizard } from "./CommunityEnergyAuditWizard";
import {
  communityContainedButtonSx,
  communitySectionTitleSx,
  communitySurfacePaperSx,
} from "./communityUi";

const PROGRAMS_LOGIN_NEXT = encodeURIComponent("/community?tab=programs");

const BOARD_ITEMS = [
  "Chemical logs and daily readings",
  "Maintenance history and work orders",
  "Vendor directory and procurement records",
  "Support tickets and facility notes",
  "Board handoff export pack (coming soon on Professional)",
];

export type CommunityProgramsSectionProps = {
  variant: "full" | "preview";
  canInteract: boolean;
  planCode: PlanCode;
  hasActiveOrg: boolean;
  orgName?: string | null;
};

export function CommunityProgramsSection({
  variant,
  canInteract,
  planCode: _planCode,
  hasActiveOrg,
  orgName,
}: CommunityProgramsSectionProps) {
  const showPilotBanner = variant === "full" && canInteract;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Programs for boards and facilities — continuity when leadership changes, and energy audits for any pool or
        facility.
      </Typography>

      {showPilotBanner ? (
        <Alert severity="info">
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Pilot program
          </Typography>
          Explore Updates, Jobs, Marketplace, and Programs here. Share feedback with your Aquatics Empowered contact.
        </Alert>
      ) : null}

      <Paper id="board-continuity" variant="outlined" sx={communitySurfacePaperSx()}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <AccountBalanceOutlinedIcon color="primary" sx={{ mt: 0.25 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={communitySectionTitleSx}>
              Board continuity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {hasActiveOrg && orgName
                ? `Keep ${orgName}'s operational memory in one place when boards change.`
                : "Keep your facility's operational memory in one place when boards change."}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
          Stop re-teaching your pool every time the board changes. Aquatics Empowered helps the current board manage the
          facility in one system and prepares the incoming board with organized past information—not scattered emails
          and spreadsheets.
        </Typography>

        <List dense disablePadding sx={{ mb: 2 }}>
          {BOARD_ITEMS.map((item) => (
            <ListItem key={item} disableGutters sx={{ py: 0.35 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircleOutlineRoundedIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} primaryTypographyProps={{ variant: "body2" }} />
            </ListItem>
          ))}
        </List>

        {canInteract ? (
          <Button
            component={Link}
            href="/app"
            variant="outlined"
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            Open your portal
          </Button>
        ) : (
          <Button
            component={Link}
            href={`/login?next=${PROGRAMS_LOGIN_NEXT}`}
            variant="outlined"
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            Sign in to your portal
          </Button>
        )}
      </Paper>

      <Paper id="energy-audits" variant="outlined" sx={communitySurfacePaperSx()}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <BoltOutlinedIcon color="primary" sx={{ mt: 0.25 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={communitySectionTitleSx}>
                Energy audits
              </Typography>
              <Chip size="small" label="Beta" color="primary" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Enjoy up to {COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} energy audits per day. No organization required.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Button
            component="a"
            href="#community-energy-audit"
            variant="contained"
            sx={{ minHeight: 44, ...communityContainedButtonSx() }}
          >
            Start energy audit
          </Button>
          <Button component={Link} href="/founders" variant="outlined" sx={{ minHeight: 44 }}>
            Talk to us about Professional
          </Button>
          <Button component={Link} href="/app/support" variant="outlined" sx={{ minHeight: 44 }}>
            Contact support
          </Button>
        </Stack>
      </Paper>

      <CommunityEnergyAuditWizard canInteract={canInteract} />
    </Stack>
  );
}
