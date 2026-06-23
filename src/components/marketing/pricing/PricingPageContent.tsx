"use client";

import { Box } from "@mui/material";
import { useState } from "react";

import { FounderCTA } from "@/components/marketing/FounderCTA";

import type { SitePromoConfig } from "@/lib/marketing/promo";

import { PricingCompare } from "./PricingCompare";
import { PricingFAQ } from "./PricingFAQ";
import { PricingHero } from "./PricingHero";
import { PricingTiers } from "./PricingTiers";
import type { BillingCadence } from "./pricingData";

export function PricingPageContent({ sitePromo }: { sitePromo: SitePromoConfig }) {
  const [cadence, setCadence] = useState<BillingCadence>("monthly");

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <PricingHero cadence={cadence} onCadenceChange={setCadence} sitePromo={sitePromo} />
      <PricingTiers cadence={cadence} sitePromo={sitePromo} />
      <PricingCompare />
      <PricingFAQ />
      <FounderCTA />
    </Box>
  );
}
