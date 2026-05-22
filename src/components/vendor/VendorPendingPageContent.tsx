"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export function VendorPendingPageContent({
  application,
}: {
  application: {
    status: string;
    company_name: string;
    review_note: string | null;
  } | null;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        Vendor account setup
      </Typography>

      {application?.status === "pending" ? (
        <Alert severity="info">
          Your partner application for <strong>{application.company_name}</strong> is under review. You will be
          redirected to the vendor dashboard once approved and linked to your login.
        </Alert>
      ) : application?.status === "rejected" ? (
        <Alert severity="warning">
          Your application was not approved
          {application.review_note ? `: ${application.review_note}` : "."} You can submit a new application from the
          public vendors page.
        </Alert>
      ) : (
        <Alert severity="info">
          Your account has the vendor role but is not linked to an approved vendor listing yet. Apply on the marketplace
          partners page or contact support if you were already approved.
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button component={Link} href="/vendors#vendor-apply" variant="contained">
          Partner application
        </Button>
        <Button component={Link} href="/app/support" variant="outlined">
          Contact support
        </Button>
      </Stack>
    </Stack>
  );
}
