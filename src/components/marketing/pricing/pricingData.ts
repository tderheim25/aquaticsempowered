import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import type { ElementType } from "react";

import {
  ESSENTIAL_ANNUAL_PER_MONTH_USD,
  ESSENTIAL_MONTHLY_USD,
  POOL_ADDON_MONTHLY_USD,
  PRO_ANNUAL_PER_MONTH_USD,
  PRO_MONTHLY_USD,
  TIER_MONTHLY_USD,
} from "@/lib/marketing/publicPricing";

export type BillingCadence = "monthly" | "annual";

export type Tier = {
  id: string;
  name: string;
  tagline: string;
  icon: ElementType;
  monthly: number | null;
  annual: number | null;
  priceSuffix: string;
  priceNote?: string;
  annualNote?: string;
  ctaLabel: string;
  ctaHref: string;
  ctaEventName: string;
  highlights: string[];
  featured?: boolean;
  badge?: string;
};

export const POOL_BILLING_PRICING_NOTE =
  "All paid plans include one body of water at no additional charge. Additional pools and water features are billed at $29/month each.";

export const tiers: Tier[] = [
  {
    id: "community",
    name: "Free Community",
    tagline: "Join the conversation",
    icon: ForumRoundedIcon,
    monthly: TIER_MONTHLY_USD.community,
    annual: 0,
    priceSuffix: "forever",
    priceNote: "No credit card required",
    ctaLabel: "Join free",
    ctaHref: "/signup",
    ctaEventName: "cta_click_pricing_community",
    highlights: [
      "Public operator forum",
      "Curated resource library",
      "Newsletter & advisories",
      "Vendor directory access",
    ],
  },
  {
    id: "essential",
    name: "Essential",
    tagline: "Run your facility operations",
    icon: StarRoundedIcon,
    monthly: ESSENTIAL_MONTHLY_USD,
    annual: ESSENTIAL_ANNUAL_PER_MONTH_USD,
    priceSuffix: "/mo",
    priceNote: "Billed monthly",
    annualNote: "Billed annually",
    ctaLabel: "Start Essential",
    ctaHref: "/founders",
    ctaEventName: "cta_click_pricing_essential",
    highlights: [
      "1 pool included",
      `Additional pools: $${POOL_ADDON_MONTHLY_USD}/mo each`,
      "Chemical logs & alerts",
      "SOP library & checklists",
      "Member support portal",
      "Compliance-ready reports",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Advanced ops for growing aquatics teams",
    icon: RocketLaunchRoundedIcon,
    monthly: PRO_MONTHLY_USD,
    annual: PRO_ANNUAL_PER_MONTH_USD,
    priceSuffix: "/mo",
    priceNote: "Billed monthly",
    annualNote: "Billed annually",
    ctaLabel: "Go Professional",
    ctaHref: "/founders",
    ctaEventName: "cta_click_pricing_professional",
    featured: true,
    badge: "Most popular",
    highlights: [
      "1 pool included",
      `Additional pools: $${POOL_ADDON_MONTHLY_USD}/mo each`,
      "Everything in Essential",
      "Audits & procurement tools",
      "Vendor pricing guidance",
      "Advanced reporting & insights",
      "Priority operator support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Networks & municipalities",
    icon: BusinessRoundedIcon,
    monthly: null,
    annual: null,
    priceSuffix: "",
    priceNote: "From $1,500 / mo",
    ctaLabel: "Talk to sales",
    ctaHref: "/founders",
    ctaEventName: "cta_click_pricing_enterprise",
    highlights: [
      "Everything in Professional",
      "Real-time monitoring",
      "Advisory hours & capital planning",
      "Dedicated success manager",
      "Custom integrations & SLAs",
    ],
  },
];

export type CompareValue = boolean | string;

export type CompareRow = {
  label: string;
  values: [CompareValue, CompareValue, CompareValue, CompareValue];
};

export type CompareGroup = {
  group: string;
  rows: CompareRow[];
};

export const compareGroups: CompareGroup[] = [
  {
    group: "Community & content",
    rows: [
      { label: "Public operator forum", values: [true, true, true, true] },
      { label: "Resource library", values: [true, true, true, true] },
      { label: "Newsletter & advisories", values: [true, true, true, true] },
    ],
  },
  {
    group: "Operations",
    rows: [
      { label: "Chemical logs & alerts", values: [false, true, true, true] },
      { label: "SOP library & checklists", values: [false, true, true, true] },
      { label: "Compliance reports", values: [false, true, true, true] },
      { label: "Pools included", values: ["—", "1", "1", "1"] },
      { label: "Additional pools", values: ["—", `$${POOL_ADDON_MONTHLY_USD}/mo`, `$${POOL_ADDON_MONTHLY_USD}/mo`, "Custom"] },
    ],
  },
  {
    group: "Procurement & advisory",
    rows: [
      { label: "Vendor directory", values: [true, true, true, true] },
      { label: "Procurement tools", values: [false, false, true, true] },
      { label: "Vendor pricing guidance", values: [false, false, true, true] },
      { label: "Advisory hours", values: ["—", "—", "—", "Included"] },
    ],
  },
  {
    group: "Monitoring & support",
    rows: [
      { label: "Member support portal", values: [false, true, true, true] },
      { label: "Priority support", values: [false, false, true, true] },
      { label: "Real-time monitoring", values: [false, false, false, true] },
      { label: "Dedicated success manager", values: [false, false, false, true] },
      { label: "Custom SLAs", values: [false, false, false, true] },
    ],
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade anytime — we prorate the difference and your team keeps every log, SOP, and report.",
  },
  {
    q: "Do you offer founder pricing?",
    a: "The first 50 founder organizations receive 50% off base subscription fees on Essential or Professional monthly billing for 3 years. Pool add-ons remain $29/month each and are not discounted.",
  },
  {
    q: "Is there a long-term contract?",
    a: "Monthly plans are month-to-month with no commitment. Annual plans save roughly 17% and unlock priority onboarding.",
  },
  {
    q: "How does Enterprise pricing work?",
    a: "Enterprise scales with your facility count, monitoring footprint, and advisory needs. Most networks land between $1,500 and $6,000 per month.",
  },
  {
    q: "How does pool billing work?",
    a: `A facility is your organization site (team, address, and data). A pool is a body of water you manage within a facility. Every paid account includes one active pool at no extra charge across all your facilities. Each additional active pool is $${POOL_ADDON_MONTHLY_USD}/month. Example: Professional founder ($350/mo) with 4 pools across two facilities pays $350 + (3 × $${POOL_ADDON_MONTHLY_USD}) = $437/month.`,
  },
];
