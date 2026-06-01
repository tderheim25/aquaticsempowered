import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import type { ElementType } from "react";

import {
  ESSENTIAL_ANNUAL_PER_MONTH_USD,
  ESSENTIAL_MONTHLY_USD,
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
    tagline: "Run a single facility",
    icon: StarRoundedIcon,
    monthly: ESSENTIAL_MONTHLY_USD,
    annual: ESSENTIAL_ANNUAL_PER_MONTH_USD,
    priceSuffix: "/mo",
    priceNote: "Per facility · billed monthly",
    annualNote: "Per facility · billed annually",
    ctaLabel: "Start Essential",
    ctaHref: "/founders",
    ctaEventName: "cta_click_pricing_essential",
    highlights: [
      "Chemical logs & alerts",
      "SOP library & checklists",
      "Member support portal",
      "Compliance-ready reports",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Multi-facility operations",
    icon: RocketLaunchRoundedIcon,
    monthly: PRO_MONTHLY_USD,
    annual: PRO_ANNUAL_PER_MONTH_USD,
    priceSuffix: "/mo",
    priceNote: "Up to 5 facilities · monthly",
    annualNote: "Up to 5 facilities · annual",
    ctaLabel: "Go Professional",
    ctaHref: "/founders",
    ctaEventName: "cta_click_pricing_professional",
    featured: true,
    badge: "Most popular",
    highlights: [
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
      { label: "Facilities supported", values: ["—", "1", "Up to 5", "Unlimited"] },
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
    a: "The first 50 founder facilities lock in preferred pricing and contract terms. Apply through the Founder Program to see your custom quote.",
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
    q: "Do you support multiple facilities on Essential?",
    a: "Essential is built for a single facility. Once you operate more than one site, Professional or Enterprise give you cross-facility reporting and procurement tools.",
  },
];
