"use client";

import { Button, type ButtonProps, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { getPlanDisplayName } from "@/lib/billing/planCatalog";
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  if (!planCode) {
    return (
      <Button component={Link} href={ctaHref} {...buttonProps}>
        {children}
      </Button>
    );
  }

  const planLabel = getPlanDisplayName(planCode);

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
          embedded: true,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/pricing")}`;
        return;
      }

      const data = (await res.json()) as { url?: string; clientSecret?: string; error?: string };

      if (res.status === 503) {
        window.location.href = ctaHref;
        return;
      }

      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCheckoutOpen(true);
        return;
      }

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      console.error("[PricingCheckoutButton]", data.error ?? "Checkout failed");
      window.location.href = ctaHref;
    } catch (error) {
      console.error("[PricingCheckoutButton]", error);
      window.location.href = ctaHref;
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button {...buttonProps} onClick={handleCheckout} disabled={loading || buttonProps.disabled}>
        {loading ? <CircularProgress size={22} color="inherit" /> : children}
      </Button>

      <EmbeddedCheckoutModal
        open={checkoutOpen && Boolean(clientSecret)}
        onClose={() => {
          setCheckoutOpen(false);
          setClientSecret(null);
        }}
        clientSecret={clientSecret}
        title={planLabel ? `Subscribe to ${planLabel}` : "Complete your subscription"}
        planLabel={planLabel}
        onComplete={() => {
          setCheckoutOpen(false);
          setClientSecret(null);
          router.push(`/app/billing/success?plan=${planCode}`);
        }}
      />
    </>
  );
}
