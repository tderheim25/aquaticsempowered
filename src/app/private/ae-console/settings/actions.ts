"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  consoleSectionUrl,
  getSuperAdminPortalPath,
  requireSuperAdminConsole,
} from "@/lib/auth/superAdminPortal";
import { generateFounderPromoCodeString } from "@/lib/marketing/sitePromo";
import { getStripePromoCouponId } from "@/lib/stripe/prices";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateDemoRequestEmailAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();

  const raw = String(formData.get("demo_request_email") ?? "").trim();
  if (raw && !isValidEmail(raw)) {
    redirect(consoleSectionUrl("settings", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .upsert(
      {
        key: "demo_request_email",
        value: { email: raw },
        description: "Inbox that receives founder demo-request notifications.",
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      },
      { onConflict: "key" },
    );

  if (error) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("settings", { status: "settings_saved" }));
}

export async function updateSitePromoAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();
  const active = formData.get("site_promo_active") === "on";

  const admin = createAdminClient();
  const { error } = await admin.from("platform_settings").upsert(
    {
      key: "site_promo",
      value: { active },
      description:
        "Site-wide 50% founder/pricing promo toggle (new signups only; existing subscribers grandfathered).",
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    },
    { onConflict: "key" },
  );

  if (error) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("settings", { status: "settings_saved" }));
}

export async function generateFounderPromoCodeAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();

  if (!isStripeConfigured()) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  const couponId = getStripePromoCouponId();
  if (!couponId) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  const note = String(formData.get("promo_note") ?? "").trim() || null;
  const maxRaw = String(formData.get("promo_max_redemptions") ?? "").trim();
  const maxRedemptions = maxRaw ? Number.parseInt(maxRaw, 10) : null;
  const expiresRaw = String(formData.get("promo_expires_at") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  if (maxRedemptions != null && (!Number.isFinite(maxRedemptions) || maxRedemptions < 1)) {
    redirect(consoleSectionUrl("settings", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const stripe = getStripe();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateFounderPromoCodeString();
    try {
      const promotionCode = await stripe.promotionCodes.create({
        code,
        promotion: {
          type: "coupon",
          coupon: couponId,
        },
        ...(maxRedemptions != null ? { max_redemptions: maxRedemptions } : {}),
        ...(expiresAt ? { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) } : {}),
        metadata: { ae_source: "ae_console" },
      });

      const { error } = await admin.from("founder_promo_codes").insert({
        code,
        stripe_promotion_code_id: promotionCode.id,
        stripe_coupon_id: couponId,
        percent_off: 50,
        max_redemptions: maxRedemptions,
        expires_at: expiresAt,
        note,
        created_by: profile.id,
      });

      if (error) {
        if (error.code === "23505") continue;
        captureException(error, { step: "founder_promo_code_insert" });
        redirect(consoleSectionUrl("settings", { status: "error" }));
      }

      revalidatePath(getSuperAdminPortalPath());
      redirect(consoleSectionUrl("settings", { status: "promo_code_created", code }));
    } catch (err) {
      const stripeErr = err as { code?: string };
      if (stripeErr.code === "resource_already_exists") continue;
      captureException(err, { step: "founder_promo_code_stripe" });
      redirect(consoleSectionUrl("settings", { status: "error" }));
    }
  }

  redirect(consoleSectionUrl("settings", { status: "error" }));
}

export async function revokeFounderPromoCodeAction(formData: FormData) {
  await requireSuperAdminConsole();

  const id = String(formData.get("promo_code_id") ?? "").trim();
  if (!id) {
    redirect(consoleSectionUrl("settings", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("founder_promo_codes")
    .select("id, stripe_promotion_code_id, active")
    .eq("id", id)
    .maybeSingle();

  if (!row?.active) {
    redirect(consoleSectionUrl("settings", { status: "invalid" }));
  }

  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      await stripe.promotionCodes.update(row.stripe_promotion_code_id, { active: false });
    } catch (err) {
      captureException(err, { step: "founder_promo_code_revoke_stripe" });
    }
  }

  const { error } = await admin.from("founder_promo_codes").update({ active: false }).eq("id", id);
  if (error) {
    redirect(consoleSectionUrl("settings", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("settings", { status: "promo_code_revoked" }));
}
