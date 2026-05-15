import { z } from "zod";

export const PROCUREMENT_CATEGORIES = ["chemicals", "equipment", "parts", "services", "other"] as const;

export const PROCUREMENT_STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "quoted",
  "approved",
  "ordered",
  "cancelled",
] as const;

export const procurementRequestIdSchema = z.object({
  id: z.string().uuid(),
});

const optionalVendorId = z
  .union([z.string().uuid(), z.literal(""), z.undefined()])
  .transform((v) => (v === undefined || v === "" ? null : v));

export const procurementRequestCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(10000).optional(),
  category: z.enum(PROCUREMENT_CATEGORIES),
  preferred_vendor_id: optionalVendorId,
});

export const procurementRequestUpdateSchema = procurementRequestCreateSchema.extend({
  status: z.enum(PROCUREMENT_STATUSES),
});
