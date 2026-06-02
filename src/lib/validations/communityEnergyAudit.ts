import { z } from "zod";

export const communityEnergyAuditRequestSchema = z.object({
  facilityName: z.string().trim().min(1, "Facility or pool name is required").max(200),
  facilityType: z.string().trim().max(120).optional(),
  bodyOfWater: z.string().trim().max(120).optional(),
  sizeNotes: z.string().trim().max(500).optional(),
  equipmentNotes: z.string().trim().max(4000).optional(),
  scheduleNotes: z.string().trim().max(2000).optional(),
});

export const energyAuditPdfExportSchema = z.object({
  title: z.string().trim().min(1).max(200),
  report: z.string().trim().min(10).max(50_000),
  generatedAt: z.string().datetime().optional(),
});
