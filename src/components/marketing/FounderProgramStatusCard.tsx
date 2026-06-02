import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import type { FounderProgramBlocked } from "@/lib/founders/founderProgramGate";

export function FounderProgramStatusCard({ status }: { status: FounderProgramBlocked }) {
  return (
    <Stack spacing={3} sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: "success.main",
            color: "success.contrastText",
            boxShadow: "0 8px 20px rgba(46,165,160,0.35)",
          }}
        >
          <CheckCircleRoundedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {status.title}
          </Typography>
          {status.orgName ? (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {status.orgName}
            </Typography>
          ) : null}
          {status.subscriptionLine ? (
            <Chip
              label={status.subscriptionLine}
              size="small"
              color="success"
              variant="outlined"
              sx={{ mb: 1.5, fontWeight: 600 }}
            />
          ) : null}
          <Typography variant="body1" color="text.secondary">
            {status.message}
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button component={Link} href={status.dashboardHref} variant="contained" size="large">
          Go to Dashboard
        </Button>
        {status.billingHref ? (
          <Button component={Link} href={status.billingHref} variant="outlined" size="large">
            Manage subscription
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
