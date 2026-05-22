import { Container } from "@mui/material";

import { AdBanner } from "@/components/marketing/AdBanner";
import { FounderCTA } from "@/components/marketing/FounderCTA";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PricingTeaser } from "@/components/marketing/PricingTeaser";
import { SocialProof } from "@/components/marketing/SocialProof";
import { ValueProps } from "@/components/marketing/ValueProps";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <AdBanner variant="inline" />
      </Container>
      <SocialProof />
      <PricingTeaser />
      <FounderCTA />
    </>
  );
}
