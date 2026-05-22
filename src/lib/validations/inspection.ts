import { z } from "zod";

export const inspectionLogSchema = z.object({
  pool_id: z.string().uuid(),
  inspected_at: z.string().min(1),
  template_key: z.string().min(1).max(64),
  checklist: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      passed: z.boolean().nullable(),
    })
  ),
  passed: z.boolean().nullable(),
  notes: z.string().max(5000).nullable().optional(),
  operator_initials: z.string().max(8).nullable().optional(),
});

export const inspectionLogIdSchema = z.object({
  id: z.string().uuid(),
});

export type InspectionLogFormValues = z.infer<typeof inspectionLogSchema>;
