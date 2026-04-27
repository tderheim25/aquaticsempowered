"use server";

import { createClient } from "@/lib/supabase/server";
import { sendFounderWelcome } from "@/lib/resend";
import { captureException } from "@/lib/sentry";
import { founderSchema } from "@/lib/validations/founder";

export type SubmitFounderResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitFounderLead(input: unknown): Promise<SubmitFounderResult> {
  const parsed = founderSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(" ");
    return { ok: false, error: msg || "Invalid form data" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      facility_name: parsed.data.facility_name,
      facility_tier: parsed.data.facility_tier,
      contact_name: parsed.data.contact_name,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      num_pools: parsed.data.num_pools ?? null,
      current_pain: parsed.data.current_pain?.trim() || null,
      source: "founder_form",
    });

    if (error) {
      captureException(error, { step: "leads_insert" });
      return { ok: false, error: error.message };
    }

    if (process.env.RESEND_API_KEY) {
      try {
        await sendFounderWelcome(parsed.data.email, {
          contactName: parsed.data.contact_name,
          facilityName: parsed.data.facility_name,
        });
      } catch (e) {
        captureException(e, { step: "founder_welcome_email" });
        // Lead saved — still success for UX
      }
    }

    return { ok: true };
  } catch (e) {
    captureException(e, { step: "submitFounderLead" });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
