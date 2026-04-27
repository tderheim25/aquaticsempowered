import { FounderCTA } from "@/components/marketing/FounderCTA";
import { Hero } from "@/components/marketing/Hero";
import { PricingTeaser } from "@/components/marketing/PricingTeaser";
import { ValueProps } from "@/components/marketing/ValueProps";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <PricingTeaser />
      <FounderCTA />
    </>
  );
}
