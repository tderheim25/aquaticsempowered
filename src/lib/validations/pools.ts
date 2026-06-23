import { z } from "zod";

export const POOL_TYPES = ["chlorine", "saltwater", "bromine"] as const;
export const WATER_BODY_TYPES = [
  "swimming_pool",
  "splash_pad",
  "aquatic_center",
  "therapy_pool",
  "competition_pool",
  "water_park_feature",
  "other",
] as const;
export const POOL_STATUSES = ["active", "seasonal", "inactive"] as const;

export const WATER_BODY_TYPE_LABELS: Record<(typeof WATER_BODY_TYPES)[number], string> = {
  swimming_pool: "Swimming Pool",
  splash_pad: "Splash Pad",
  aquatic_center: "Aquatic Center",
  therapy_pool: "Therapy Pool",
  competition_pool: "Competition Pool",
  water_park_feature: "Water Park Feature",
  other: "Other",
};

export const poolSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  water_body_type: z.enum(WATER_BODY_TYPES).default("swimming_pool"),
  pool_type: z.enum(POOL_TYPES),
  volume_gallons: z.coerce.number().positive().nullable().optional(),
  location_label: z.string().max(120).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(POOL_STATUSES),
});

export const poolIdSchema = z.object({
  id: z.string().uuid(),
});

export type PoolFormValues = z.infer<typeof poolSchema>;
