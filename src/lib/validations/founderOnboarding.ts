import { z } from "zod";

import { resolveUsState } from "@/lib/geo/resolveUsState";
import {
  ESSENTIAL_ANNUAL_TOTAL_USD,
  formatUsd,
  PRO_ANNUAL_TOTAL_USD,
} from "@/lib/marketing/publicPricing";
import type { OrgTier } from "@/types/database";

export const ORG_TIERS: OrgTier[] = [
  "rural",
  "municipal",
  "hotel",
  "school",
  "hospital",
  "hoa",
  "splash_pad",
  "wellness",
  "commercial",
  "therapy",
];

export const ORG_TIER_LABELS: Record<OrgTier, string> = {
  rural: "Rural community pool",
  municipal: "City or county public pool",
  hotel: "Hotel / resort",
  school: "School / university",
  hospital: "Hospital / healthcare",
  hoa: "HOA / residential",
  splash_pad: "Splash pad",
  wellness: "Wellness / fitness",
  commercial: "Commercial aquatic",
  therapy: "Therapy / medical pool",
};

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const withScheme = /^https?:\/\//i.test(val) ? val : `https://${val}`;
        // URL constructor throws if invalid
        new URL(withScheme);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid website URL" },
  );

export const organizationStepSchema = z.object({
  facility_name: z.string().trim().min(2, "Facility name is required"),
  facility_tier: z.enum([
    "rural",
    "municipal",
    "hotel",
    "school",
    "hospital",
    "hoa",
    "splash_pad",
    "wellness",
    "commercial",
    "therapy",
  ]),
  website_url: optionalUrl,
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine((val) => !val || /[\d]{6,}/.test(val.replace(/[^\d]/g, "")), {
      message: "Enter a valid phone number",
    }),
  address_line1: z.string().trim().min(2, "Street address is required"),
  address_line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  region: z
    .string()
    .trim()
    .min(1, "State is required")
    .refine((val) => resolveUsState(val) !== null, {
      message: "Select a valid US state",
    }),
  postal_code: z.string().trim().min(2, "Postal code is required"),
  country: z.string().trim().min(2, "Country is required"),
  num_pools: z
    .number()
    .int()
    .min(0)
    .max(999)
    .optional()
    .or(z.literal(undefined)),
});
export type OrganizationStepValues = z.infer<typeof organizationStepSchema>;

export const founderStepSchema = z
  .object({
    contact_name: z.string().trim().min(2, "Your name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    current_pain: z.string().trim().max(2000).optional().or(z.literal("")),
    has_session: z.boolean(),
    password: z.string().optional().or(z.literal("")),
    confirm_password: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.has_session) return;
    if (!values.password || values.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password must be at least 8 characters",
      });
    }
    if (values.password !== values.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });
export type FounderStepValues = z.infer<typeof founderStepSchema>;

export type FounderPlanCode = "essential" | "pro" | "enterprise";

export const PLAN_CHOICES: {
  code: FounderPlanCode;
  name: string;
  tagline: string;
  price: string;
  /** Whole-dollar annual amount, or null for custom-priced plans. */
  annual: number | null;
  pricePeriod: string;
  features: string[];
}[] = [
  {
    code: "essential",
    name: "Essential",
    tagline: "For single facilities ready to digitize",
    price: `$${formatUsd(ESSENTIAL_ANNUAL_TOTAL_USD)} / yr`,
    annual: ESSENTIAL_ANNUAL_TOTAL_USD,
    pricePeriod: "/ yr",
    features: [
      "Chemical & cleaning logs",
      "Operator SOPs and templates",
      "Email + ticket support",
    ],
  },
  {
    code: "pro",
    name: "Professional",
    tagline: "Most popular for founder facilities",
    price: `$${formatUsd(PRO_ANNUAL_TOTAL_USD)} / yr`,
    annual: PRO_ANNUAL_TOTAL_USD,
    pricePeriod: "/ yr",
    features: [
      "Everything in Essential",
      "Audits & procurement",
      "Chemistry calculator + reports",
    ],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    tagline: "Multi-site monitoring and advisory",
    price: "Custom annual",
    annual: null,
    pricePeriod: "",
    features: [
      "Everything in Professional",
      "24/7 monitoring + sensors",
      "Dedicated advisory team",
    ],
  },
];

export const choiceStepSchema = z.object({
  request_type: z.enum(["founder_account", "demo"]),
  requested_plan_code: z.enum(["essential", "pro", "enterprise"]).optional(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ChoiceStepValues = z.infer<typeof choiceStepSchema>;

export const founderOnboardingPayloadSchema = z.object({
  organization: organizationStepSchema,
  founder: founderStepSchema,
  choice: choiceStepSchema,
});
export type FounderOnboardingPayload = z.infer<typeof founderOnboardingPayloadSchema>;
