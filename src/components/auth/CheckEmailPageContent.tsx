"use client";

import { Typography } from "@mui/material";
import Link from "next/link";

export function CheckEmailPageContent({ email }: { email?: string }) {
  return (
    <>
      {email ? (
        <Typography variant="body2" color="text.secondary">
          Sent to <strong>{email}</strong>
        </Typography>
      ) : null}
      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link href="/login" style={{ fontWeight: 600 }}>
          Use a different email
        </Link>
      </Typography>
    </>
  );
}
