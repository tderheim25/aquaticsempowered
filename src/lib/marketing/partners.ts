/** Public marketing partners — replace with CMS or env-driven data when ready. */
export type MarketingPartner = {
  id: string;
  name: string;
  websiteUrl: string;
  /** Short label shown inside the logo tile until real assets are wired. */
  logoLabel: string;
};

export const MARKETING_PARTNERS: MarketingPartner[] = [
  {
    id: "placeholder-a",
    name: "Water Safety Partners",
    websiteUrl: "https://example.com/partner-a",
    logoLabel: "WSP",
  },
  {
    id: "placeholder-b",
    name: "Aquatic Supplies Co.",
    websiteUrl: "https://example.com/partner-b",
    logoLabel: "ASC",
  },
  {
    id: "placeholder-c",
    name: "Regional Pool Council",
    websiteUrl: "https://example.com/partner-c",
    logoLabel: "RPC",
  },
];
