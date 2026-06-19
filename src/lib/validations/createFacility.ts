import { z } from "zod";

import { resolveUsState } from "@/lib/geo/resolveUsState";
import { ORG_TIERS } from "@/lib/validations/founderOnboarding";
import type { OrgTier } from "@/types/database";

const facilityTierEnum = z.enum(ORG_TIERS as [OrgTier, ...OrgTier[]]);

export const createFacilitySchema = z.object({
  facility_name: z.string().trim().min(2, "Facility name is required"),
  facility_tier: facilityTierEnum,
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
});

export type CreateFacilityValues = z.infer<typeof createFacilitySchema>;
