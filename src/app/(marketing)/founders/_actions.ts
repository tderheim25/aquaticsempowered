"use server";

import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendFounderDemoRequest, sendFounderWelcome } from "@/lib/resend";
import { captureException } from "@/lib/sentry";
import {
  founderOnboardingPayloadSchema,
  ORG_TIER_LABELS,
  type FounderOnboardingPayload,
} from "@/lib/validations/founderOnboarding";
import { founderSchema as legacyFounderSchema } from "@/lib/validations/founder";
import {
  ownerAppRoleSlugForPlan,
  resolveAppRoleIdBySlug,
  syncOwnerAppRoleForOrg,
} from "@/lib/auth/planOwnerRoles";
import { getFounderWizardBlockReason, founderProgramBlockedError } from "@/lib/founders/founderProgramGate";
import { isStripeConfigured } from "@/lib/stripe/server";
import { createCheckoutSession } from "@/lib/stripe/createCheckoutSession";
import type { BillingCadence } from "@/lib/stripe/prices";
import type { Json, PlanCode } from "@/types/database";

export type SubmitFounderResult =
  | { ok: true }
  | { ok: false; error: string };

export type FounderWizardResult =
  | { ok: true; mode: "demo"; leadId: string }
  | {
      ok: true;
      mode: "account";
      orgId: string;
      userId: string;
      requiresEmailConfirm: boolean;
      planCode: PlanCode;
      billingCadence: BillingCadence;
      checkoutClientSecret?: string;
      checkoutError?: string;
    }
  | { ok: false; error: string; field?: string };

/** Legacy single-step submission kept for backwards compatibility. */
export async function submitFounderLead(input: unknown): Promise<SubmitFounderResult> {
  const parsed = legacyFounderSchema.safeParse(input);
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
      }
    }

    return { ok: true };
  } catch (e) {
    captureException(e, { step: "submitFounderLead" });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function buildAddressJson(org: FounderOnboardingPayload["organization"]): Record<string, string> {
  const addr: Record<string, string> = {};
  if (org.address_line1) addr.line1 = org.address_line1;
  if (org.address_line2) addr.line2 = org.address_line2;
  if (org.city) addr.city = org.city;
  if (org.region) addr.region = org.region;
  if (org.postal_code) addr.postal_code = org.postal_code;
  if (org.country) addr.country = org.country;
  return addr;
}

function formatAddress(address: Record<string, string>): string {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.region].filter(Boolean).join(", "),
    address.postal_code,
    address.country,
  ].filter(Boolean);
  return parts.join(" · ");
}

async function getDemoRequestEmail(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "demo_request_email")
    .maybeSingle();
  const value = (data?.value ?? {}) as { email?: string };
  const fromDb = value.email?.trim();
  if (fromDb) return fromDb;
  return process.env.DEMO_REQUEST_NOTIFY_EMAIL?.trim() || null;
}

/**
 * Handles both founder application paths from the multi-step wizard:
 *  - `demo` → saves a lead and notifies the assigned super-admin inbox.
 *  - `founder_account` → provisions auth user (if needed), founder organization, and links them.
 */
export async function submitFounderWizard(input: unknown): Promise<FounderWizardResult> {
  const parsed = founderOnboardingPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message || "Invalid form data",
      field: first?.path?.join("."),
    };
  }

  const supabase = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  if (sessionUser) {
    const blockReason = await getFounderWizardBlockReason(sessionUser.id);
    if (blockReason) {
      return { ok: false, error: blockReason };
    }
  }

  const { organization, choice } = parsed.data;
  const address = buildAddressJson(organization);
  const formattedAddress = formatAddress(address);

  if (choice.request_type === "demo") {
    return submitDemoPath(parsed.data, address, formattedAddress);
  }

  return submitAccountPath(parsed.data, address);
}

async function submitDemoPath(
  payload: FounderOnboardingPayload,
  address: Record<string, string>,
  formattedAddress: string,
): Promise<FounderWizardResult> {
  const { organization, founder } = payload;
  try {
    const supabase = await createClient();
    const insertPayload = {
      facility_name: organization.facility_name,
      facility_tier: organization.facility_tier,
      contact_name: founder.contact_name,
      email: founder.email.trim().toLowerCase(),
      phone: founder.phone?.trim() || organization.phone?.trim() || null,
      num_pools: organization.num_pools ?? null,
      current_pain: founder.current_pain?.trim() || null,
      website_url: organization.website_url?.trim() || null,
      address: address as unknown as Json,
      source: "founder_wizard",
      request_type: "demo" as const,
    };

    const { data: lead, error } = await supabase.from("leads").insert(insertPayload).select("id").single();
    if (error || !lead) {
      captureException(error, { step: "leads_insert_demo" });
      return { ok: false, error: error?.message || "Could not save your request." };
    }

    if (process.env.RESEND_API_KEY) {
      const notifyEmail = await getDemoRequestEmail();
      if (notifyEmail) {
        try {
          await sendFounderDemoRequest(notifyEmail, {
            contactName: founder.contact_name,
            email: founder.email,
            facilityName: organization.facility_name,
            facilityTier: ORG_TIER_LABELS[organization.facility_tier],
            phone: founder.phone || organization.phone || null,
            websiteUrl: organization.website_url || null,
            address: formattedAddress || null,
            numPools: organization.num_pools ?? null,
            message: payload.choice.message || null,
            currentPain: founder.current_pain || null,
            submittedAt: new Date().toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" }),
          });
          const admin = createAdminClient();
          await admin.from("leads").update({ notified_at: new Date().toISOString() }).eq("id", lead.id);
        } catch (e) {
          captureException(e, { step: "founder_demo_email" });
        }
      }
    }

    return { ok: true, mode: "demo", leadId: lead.id };
  } catch (e) {
    captureException(e, { step: "submitDemoPath" });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

async function submitAccountPath(
  payload: FounderOnboardingPayload,
  address: Record<string, string>,
): Promise<FounderWizardResult> {
  const { organization, founder, choice } = payload;
  const planCode: PlanCode = choice.requested_plan_code ?? "pro";

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user: existingUser },
    } = await supabase.auth.getUser();

    let userId = existingUser?.id ?? null;
    let userEmail = existingUser?.email ?? founder.email.trim().toLowerCase();
    let requiresEmailConfirm = false;

    if (!existingUser) {
      if (!founder.password || founder.password.length < 8) {
        return {
          ok: false,
          error: "Password must be at least 8 characters.",
          field: "founder.password",
        };
      }

      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email: founder.email.trim().toLowerCase(),
        password: founder.password,
        options: {
          data: { full_name: founder.contact_name },
        },
      });

      if (signUpErr || !signUp.user) {
        captureException(signUpErr, { step: "founder_signup" });
        const msg = signUpErr?.message?.toLowerCase() || "";
        if (msg.includes("already registered") || msg.includes("already been registered")) {
          return {
            ok: false,
            error: "An account already exists for this email. Please sign in first.",
            field: "founder.email",
          };
        }
        return { ok: false, error: signUpErr?.message || "Could not create account." };
      }

      userId = signUp.user.id;
      userEmail = signUp.user.email ?? founder.email.trim().toLowerCase();
      requiresEmailConfirm = !signUp.session;
    }

    if (!userId) {
      return { ok: false, error: "Could not resolve a user account." };
    }

    const { data: existingProfile } = await admin
      .from("users")
      .select("org_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (existingProfile?.org_id) {
      const { data: existingOrg } = await admin
        .from("organizations")
        .select("name")
        .eq("id", existingProfile.org_id)
        .maybeSingle();
      return {
        ok: false,
        error: founderProgramBlockedError(existingProfile, existingOrg?.name ?? null),
      };
    }

    const orgId = randomUUID();

    const orgInsert = {
      id: orgId,
      name: organization.facility_name,
      tier: organization.facility_tier,
      plan_code: planCode,
      founder: true,
      billing_org_id: orgId,
      website_url: organization.website_url?.trim() || null,
      phone: organization.phone?.trim() || founder.phone?.trim() || null,
      address: address as unknown as Json,
    };

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert(orgInsert)
      .select("id")
      .single();

    if (orgErr || !org) {
      captureException(orgErr, { step: "founder_org_insert" });
      return { ok: false, error: orgErr?.message || "Could not create organization." };
    }

    const ownerSlug = ownerAppRoleSlugForPlan(planCode);
    const ownerAppRoleId = await resolveAppRoleIdBySlug(ownerSlug);
    const founderEnrolledAt = new Date().toISOString();

    const { error: userUpdateErr } = await admin
      .from("users")
      .upsert(
        {
          id: userId,
          email: userEmail,
          full_name: founder.contact_name,
          org_id: org.id,
          role: "org_admin",
          app_role_id: ownerAppRoleId,
          is_founder: true,
          founder_enrolled_at: founderEnrolledAt,
        },
        { onConflict: "id" },
      );

    if (userUpdateErr) {
      captureException(userUpdateErr, { step: "founder_user_upsert" });
    } else {
      await admin
        .from("organizations")
        .update({ created_by_user_id: userId })
        .eq("id", org.id);

      const { error: membershipErr } = await admin.from("organization_memberships").insert({
        user_id: userId,
        org_id: org.id,
        role: "org_admin",
        is_owner: true,
      });
      if (membershipErr) {
        captureException(membershipErr, { step: "founder_membership_insert" });
      }

      const { error: prefErr } = await admin.from("user_preferences").upsert({
        user_id: userId,
        active_org_id: org.id,
        updated_at: new Date().toISOString(),
      });
      if (prefErr) {
        captureException(prefErr, { step: "founder_user_preferences_upsert" });
      }

      await syncOwnerAppRoleForOrg(org.id);
    }

    if (!requiresEmailConfirm) {
      await supabase.auth.refreshSession();
    }

    const { error: subErr } = await admin.from("subscriptions").insert({
      org_id: org.id,
      plan_code: planCode,
      status: "incomplete",
    });
    if (subErr) {
      captureException(subErr, { step: "founder_subscription_insert" });
    }

    const { error: leadErr } = await admin.from("leads").insert({
      facility_name: organization.facility_name,
      facility_tier: organization.facility_tier,
      contact_name: founder.contact_name,
      email: userEmail,
      phone: founder.phone?.trim() || organization.phone?.trim() || null,
      num_pools: organization.num_pools ?? null,
      current_pain: founder.current_pain?.trim() || null,
      website_url: organization.website_url?.trim() || null,
      address: address as unknown as Json,
      source: "founder_wizard",
      request_type: "founder_account",
      requested_plan_code: planCode,
      org_id: org.id,
      user_id: userId,
    });
    if (leadErr) {
      captureException(leadErr, { step: "founder_lead_insert" });
    }

    if (process.env.RESEND_API_KEY) {
      try {
        await sendFounderWelcome(userEmail, {
          contactName: founder.contact_name,
          facilityName: organization.facility_name,
        });
      } catch (e) {
        captureException(e, { step: "founder_welcome_email" });
      }
    }

    const billingCadence: BillingCadence = choice.billing_cadence ?? "monthly";
    let checkoutClientSecret: string | undefined;
    let checkoutError: string | undefined;

    if (!requiresEmailConfirm && isStripeConfigured()) {
      const checkout = await createCheckoutSession({
        orgId: org.id,
        email: userEmail,
        planCode,
        cadence: billingCadence,
        flow: "founder",
        promoCode: choice.promo_code?.trim() || undefined,
        embedded: true,
      });
      if (checkout.ok && checkout.embedded) {
        checkoutClientSecret = checkout.clientSecret;
      } else if (!checkout.ok) {
        checkoutError = checkout.error;
      }
    }

    return {
      ok: true,
      mode: "account",
      orgId: org.id,
      userId,
      requiresEmailConfirm,
      planCode,
      billingCadence,
      checkoutClientSecret,
      checkoutError,
    };
  } catch (e) {
    captureException(e, { step: "submitAccountPath" });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
