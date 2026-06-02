"use client";

import { Button, type ButtonProps, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { captureEvent } from "@/lib/posthog";
import type { PlanCode } from "@/types/database";

import type { BillingCadence } from "./pricingData";

type Props = Omit<ButtonProps, "onClick"> & {
  tierId: string;
  planCode: PlanCode | null;
  cadence: BillingCadence;
  ctaHref: string;
  eventName: string;
  children: React.ReactNode;
};

export function PricingCheckoutButton({
  tierId,
  planCode,
  cadence,
  ctaHref,
  eventName,
  children,
  ...buttonProps
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!planCode) {
    return (
      <Button component={Link} href={ctaHref} {...buttonProps}>
        {children}
      </Button>
    );
  }

  async function handleCheckout() {
    captureEvent(eventName, { location: "pricing_tier_card", cadence, tier: tierId });
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode,
          cadence,
          flow: "self_serve",
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/pricing")}`;
        return;
      }

      const data = (await res.json()) as { url?: string; error?: string };

      if (res.status === 503) {
        window.location.href = ctaHref;
        return;
      }

      if (!res.ok || !data.url) {
        console.error("[PricingCheckoutButton]", data.error ?? "Checkout failed");
        window.location.href = ctaHref;
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("[PricingCheckoutButton]", error);
      window.location.href = ctaHref;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button {...buttonProps} onClick={handleCheckout} disabled={loading || buttonProps.disabled}>
      {loading ? <CircularProgress size={22} color="inherit" /> : children}
    </Button>
  );
}
