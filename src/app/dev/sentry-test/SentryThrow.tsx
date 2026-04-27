"use client";

import { Button, Typography } from "@mui/material";
import { useState } from "react";

export function SentryThrow() {
  const [hit, setHit] = useState(false);
  if (hit) {
    throw new Error("Sentry test: intentional client error");
  }
  return (
    <>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Clicking the button throws an uncaught error in the browser (for pipeline verification).
      </Typography>
      <Button variant="outlined" color="error" onClick={() => setHit(true)}>
        Throw test error
      </Button>
    </>
  );
}
