"use client";

import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outlined"
      color="primary"
      size="large"
      onClick={openPortal}
      disabled={loading}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : "Manage billing"}
    </Button>
  );
}
