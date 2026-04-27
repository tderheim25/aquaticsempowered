import { z } from "zod";

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

export const founderSchema = z.object({
  facility_name: z.string().min(2, "Facility name is required"),
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
  contact_name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  num_pools: z.number().int().min(0).max(999).optional(),
  current_pain: z.string().max(2000).optional(),
});

export type FounderFormValues = z.infer<typeof founderSchema>;
