import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/usStates";
import type { TaskPriority, TicketStatus } from "@/types/database";

export const TICKET_STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];

export const TICKET_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

const zipRegex = /^\d{5}(-\d{4})?$/;

export const usaAddressSchema = z.object({
  address_line1: z.string().min(1, "Street address is required").max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state_code: z.enum(US_STATE_CODES as [string, ...string[]], {
    errorMap: () => ({ message: "Select a state" }),
  }),
  postal_code: z.string().regex(zipRegex, "Enter a valid US ZIP (12345 or 12345-6789)"),
  country: z.literal("US").default("US"),
});

export const portalContactSchema = z.object({
  requester_company_name: z.string().min(2, "Company name is required").max(200),
  contact_name: z.string().min(2, "Contact person is required").max(120),
  phone: z.string().min(7, "Phone is required").max(30),
});

export const portalTicketCreateSchema = portalContactSchema
  .merge(usaAddressSchema)
  .merge(
    z.object({
      subject: z.string().min(3, "Subject is required").max(200),
      body: z.string().min(10, "Describe the issue (at least 10 characters)").max(10000),
      priority: z.enum(["low", "medium", "high", "urgent"]),
    })
  );

export const ticketCreateSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(200),
  body: z.string().max(10000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const ticketUpdateSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(200),
  body: z.string().max(10000).optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const portalTicketUpdateSchema = portalTicketCreateSchema.partial().extend({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
});

export const ticketIdSchema = z.object({
  id: z.string().uuid(),
});

export const supportProviderSchema = z.object({
  name: z.string().min(2, "Company name is required").max(200),
  contact_name: z.string().min(2, "Contact person is required").max(120),
  phone: z.string().min(7, "Phone is required").max(30),
  address_line1: z.string().min(1, "Street address is required").max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state_code: z.enum(US_STATE_CODES as [string, ...string[]], {
    errorMap: () => ({ message: "Select a state" }),
  }),
  postal_code: z.string().regex(zipRegex, "Enter a valid US ZIP (12345 or 12345-6789)"),
  country: z.literal("US"),
  is_active: z.boolean().optional(),
});

export type TicketCreateValues = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateValues = z.infer<typeof ticketUpdateSchema>;
export type PortalTicketCreateValues = z.infer<typeof portalTicketCreateSchema>;
export type UsaAddressValues = z.infer<typeof usaAddressSchema>;
export type SupportProviderValues = z.infer<typeof supportProviderSchema>;
