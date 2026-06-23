import { FOUNDER_DISCOUNT_TERM } from "@/lib/founders/founderProgram";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripePromoCouponId } from "@/lib/stripe/prices";
import type { CheckoutFlow } from "@/lib/stripe/prices";
import type { PlanCode } from "@/types/database";

export type SitePromoConfig = {
  active: boolean;
  percentOff: number;
  badge: string;
  headline: string;
  description: string;
  tierIds: string[];
  planCodes: PlanCode[];
};

export const DEFAULT_SITE_PROMO: SitePromoConfig = {
  active: true,
  percentOff: 50,
  badge: "50% OFF",
  headline: "Founder Launch — 50% off",
    description:
    `Lock in 50% off Essential or Professional base subscription — ${FOUNDER_DISCOUNT_TERM}. Discount applies to subscription fees only; pool add-ons remain $29/month each.`,
  tierIds: ["essential", "professional"],
  planCodes: ["essential", "pro"],
};

export type CheckoutDiscountSource = "site" | "code" | "none";

export type CheckoutDiscount =
  | { type: "coupon"; couponId: string; source: CheckoutDiscountSource }
  | { type: "promotion_code"; promotionCodeId: string; source: "code" }
  | null;

export type ResolvedCheckoutDiscount = {
  applyDiscount: boolean;
  stripeDiscount: CheckoutDiscount;
  source: CheckoutDiscountSource;
};

function eligiblePlanCodes(): PlanCode[] {
  return ["essential", "pro"];
}

export function applyPromoDiscount(amount: number, config: SitePromoConfig = DEFAULT_SITE_PROMO): number {
  return Math.round(amount * (1 - config.percentOff / 100));
}

export function promoAppliesToTier(tierId: string, config: SitePromoConfig = DEFAULT_SITE_PROMO): boolean {
  return config.active && config.tierIds.includes(tierId);
}

export function promoAppliesToPlan(planCode: string, config: SitePromoConfig = DEFAULT_SITE_PROMO): boolean {
  return config.active && config.planCodes.includes(planCode as PlanCode);
}

export async function getSitePromoConfig(): Promise<SitePromoConfig> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "site_promo")
      .maybeSingle();

    const value = (data?.value ?? {}) as { active?: boolean };
    return {
      ...DEFAULT_SITE_PROMO,
      active: typeof value.active === "boolean" ? value.active : DEFAULT_SITE_PROMO.active,
    };
  } catch {
    return DEFAULT_SITE_PROMO;
  }
}

export function normalizePromoCodeInput(code: string | null | undefined): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

export async function lookupFounderPromoCode(code: string) {
  const normalized = normalizePromoCodeInput(code);
  if (!normalized) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("founder_promo_codes")
    .select("*")
    .eq("code", normalized)
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.max_redemptions != null && data.times_redeemed >= data.max_redemptions) return null;

  return data;
}

export async function resolveCheckoutDiscount(params: {
  planCode: PlanCode;
  flow: CheckoutFlow;
  promoCode?: string | null;
  sitePromo?: SitePromoConfig;
}): Promise<ResolvedCheckoutDiscount> {
  const { planCode, promoCode } = params;
  void params.flow;
  const sitePromo = params.sitePromo ?? (await getSitePromoConfig());
  const couponId = getStripePromoCouponId();
  const eligible = eligiblePlanCodes();

  if (!eligible.includes(planCode)) {
    return { applyDiscount: false, stripeDiscount: null, source: "none" };
  }

  if (sitePromo.active && couponId && sitePromo.planCodes.includes(planCode)) {
    return {
      applyDiscount: true,
      stripeDiscount: { type: "coupon", couponId, source: "site" },
      source: "site",
    };
  }

  const normalizedCode = normalizePromoCodeInput(promoCode);
  if (normalizedCode) {
    const row = await lookupFounderPromoCode(normalizedCode);
    if (row) {
      return {
        applyDiscount: true,
        stripeDiscount: {
          type: "promotion_code",
          promotionCodeId: row.stripe_promotion_code_id,
          source: "code",
        },
        source: "code",
      };
    }
  }

  return { applyDiscount: false, stripeDiscount: null, source: "none" };
}

export async function incrementFounderPromoRedemption(promotionCodeId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("founder_promo_codes")
    .select("id, times_redeemed")
    .eq("stripe_promotion_code_id", promotionCodeId)
    .maybeSingle();

  if (!row) return;

  await admin
    .from("founder_promo_codes")
    .update({ times_redeemed: (row.times_redeemed ?? 0) + 1 })
    .eq("id", row.id);
}

export function generateFounderPromoCodeString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (length: number) => {
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };
  return `AE-${part(4)}-${part(4)}`;
}
