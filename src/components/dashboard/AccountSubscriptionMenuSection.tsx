"use client";

import { Chip, Divider, MenuItem, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import type { OrgSubscriptionSummary } from "@/lib/billing/subscriptionSummary";

export function AccountSubscriptionMenuSection({
  summary,
  onNavigate,
}: {
  summary: OrgSubscriptionSummary;
  onNavigate?: () => void;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const awaitingPayment =
    summary.status === "incomplete" ||
    summary.status === "founder_pending" ||
    summary.status === "incomplete_expired";

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        onNavigate?.();
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <>
      <MenuItem
        component={Link}
        href="/app/billing"
        onClick={onNavigate}
        sx={{
          flexDirection: "column",
          alignItems: "flex-start",
          py: 1.25,
          whiteSpace: "normal",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.12em", lineHeight: 1.4 }}
        >
          Subscription
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 0.75, width: "100%" }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {summary.planLabel}
          </Typography>
          <Chip label={summary.statusLabel} size="small" color={summary.statusColor} variant="outlined" />
        </Stack>
        {summary.periodLine ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, lineHeight: 1.45 }}>
            {summary.periodLine}
          </Typography>
        ) : null}
        <Typography variant="caption" color="primary.main" sx={{ mt: 0.75, fontWeight: 600 }}>
          Manage plan →
        </Typography>
      </MenuItem>
      {awaitingPayment ? (
        <MenuItem component={Link} href="/app/billing" onClick={onNavigate}>
          Complete checkout
        </MenuItem>
      ) : null}
      {summary.canManageBilling ? (
        <MenuItem disabled={portalLoading} onClick={() => void openBillingPortal()}>
          {portalLoading ? "Opening billing…" : "Payment methods in Stripe"}
        </MenuItem>
      ) : null}
      <Divider />
    </>
  );
}
