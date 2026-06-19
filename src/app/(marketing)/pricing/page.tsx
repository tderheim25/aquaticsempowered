import { PricingPageContent } from "@/components/marketing/pricing/PricingPageContent";
import { getSitePromoConfig } from "@/lib/marketing/sitePromo";

export const metadata = {
  title: "Pricing | Aquatics Empowered",
  description:
    "Four membership tiers — free community, Essential, Professional, and Enterprise. Switch anytime, with founder pricing available for early facilities.",
};

export default async function PricingPage() {
  const sitePromo = await getSitePromoConfig();
  return <PricingPageContent sitePromo={sitePromo} />;
}
