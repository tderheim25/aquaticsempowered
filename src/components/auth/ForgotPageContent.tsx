"use client";

import { Typography } from "@mui/material";
import Link from "next/link";

import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export function ForgotPageContent({ nextPath }: { nextPath: string }) {
  return (
    <>
      <MagicLinkForm mode="forgot" nextPath={nextPath} />
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        <Link href="/login" style={{ fontWeight: 600 }}>
          Back to sign in
        </Link>
      </Typography>
    </>
  );
}
