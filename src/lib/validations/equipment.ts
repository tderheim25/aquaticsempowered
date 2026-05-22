import { z } from "zod";

export const EQUIPMENT_KINDS = ["pump", "heater", "filter", "timer", "other"] as const;

export const poolEquipmentSchema = z.object({
  pool_id: z.string().uuid(),
  kind: z.enum(EQUIPMENT_KINDS),
  model: z.string().max(200).nullable().optional(),
  installed_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const poolEquipmentIdSchema = z.object({
  id: z.string().uuid(),
});

export type PoolEquipmentFormValues = z.infer<typeof poolEquipmentSchema>;
