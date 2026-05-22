import { z } from "zod";

export const POOL_TYPES = ["chlorine", "saltwater", "bromine"] as const;
export const POOL_STATUSES = ["active", "seasonal", "inactive"] as const;

export const poolSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
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
