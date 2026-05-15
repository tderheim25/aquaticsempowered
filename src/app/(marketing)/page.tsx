import { AdBanner } from "@/components/marketing/AdBanner";
import { FounderCTA } from "@/components/marketing/FounderCTA";
import { Hero } from "@/components/marketing/Hero";
import { PricingTeaser } from "@/components/marketing/PricingTeaser";
import { ValueProps } from "@/components/marketing/ValueProps";
import { Container } from "@mui/material";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <AdBanner variant="inline" />
      </Container>
      <ValueProps />
      <PricingTeaser />
      <FounderCTA />
    </>
  );
}
