import { z } from "zod";

export const ENERGY_AUDIT_STATUSES = ["draft", "submitted", "completed"] as const;

export const energyAuditIdSchema = z.object({
  id: z.string().uuid(),
});

export const energyAuditCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  pool_id: z.string().uuid().optional().nullable(),
  facility_summary: z.string().trim().max(8000).optional(),
  pump_notes: z.string().trim().max(8000).optional(),
  heater_notes: z.string().trim().max(8000).optional(),
  schedule_notes: z.string().trim().max(8000).optional(),
  findings: z.string().trim().max(8000).optional(),
  recommendations: z.string().trim().max(8000).optional(),
  estimated_savings_notes: z.string().trim().max(4000).optional(),
  status: z.enum(ENERGY_AUDIT_STATUSES).optional(),
});

export const energyAuditUpdateSchema = energyAuditCreateSchema.extend({
  id: z.string().uuid(),
});
