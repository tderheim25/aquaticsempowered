import { z } from "zod";

export const cleaningLogSchema = z.object({
  pool_id: z.string().uuid(),
  cleaned_at: z.string().min(1),
  brush: z.boolean(),
  net: z.boolean(),
  vacuum: z.boolean(),
  skimmer_basket: z.boolean(),
  pump_basket: z.boolean(),
  pump_filter: z.boolean(),
  deck: z.boolean(),
  notes: z.string().max(5000).nullable().optional(),
});

export const cleaningLogIdSchema = z.object({
  id: z.string().uuid(),
});

export type CleaningLogFormValues = z.infer<typeof cleaningLogSchema>;
