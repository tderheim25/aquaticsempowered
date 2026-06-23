"use server";

import { revalidatePath } from "next/cache";

import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { syncOwnerAppRoleForOrg } from "@/lib/auth/planOwnerRoles";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { createFacilitySchema } from "@/lib/validations/createFacility";
import { resolveUsState } from "@/lib/geo/resolveUsState";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateFacilityResult =
  | { ok: true; orgId: string }
  | { ok: false; error: string };

export async function createFacilityAction(
  formData: FormData,
): Promise<CreateFacilityResult> {
  const profile = await requireProfileForApp();
  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    return { ok: false, error: "Only organization owners can add facilities." };
  }

  const orgCtx = await loadActiveOrgContext(profile);
  if (!orgCtx.canCreateFacility || !orgCtx.billingRootOrgId) {
    return { ok: false, error: "Your plan does not allow adding another facility." };
  }

  const parsed = createFacilitySchema.safeParse({
    facility_name: formData.get("facility_name"),
    facility_tier: formData.get("facility_tier"),
    address_line1: formData.get("address_line1"),
    address_line2: formData.get("address_line2") || undefined,
    city: formData.get("city"),
    region: formData.get("region"),
    postal_code: formData.get("postal_code"),
    country: formData.get("country") || "US",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid facility details.";
    return { ok: false, error: first };
  }

  const values = parsed.data;
  const stateCode = resolveUsState(values.region);
  if (!stateCode) {
    return { ok: false, error: "Select a valid US state." };
  }

  const admin = createAdminClient();
  const billingRootId = await resolveBillingRootOrgId(orgCtx.billingRootOrgId);

  const { data: rootOrg, error: rootError } = await admin
    .from("organizations")
    .select("plan_code, founder")
    .eq("id", billingRootId)
    .maybeSingle();

  if (rootError || !rootOrg) {
    return { ok: false, error: "Could not load billing account." };
  }

  const address = {
    line1: values.address_line1,
    line2: values.address_line2 || null,
    city: values.city,
    region: stateCode,
    postal_code: values.postal_code,
    country: values.country,
  };

  const { data: newOrg, error: insertError } = await admin
    .from("organizations")
    .insert({
      name: values.facility_name,
      tier: values.facility_tier,
      address,
      plan_code: rootOrg.plan_code,
      founder: rootOrg.founder,
      billing_org_id: billingRootId,
      created_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (insertError || !newOrg) {
    return { ok: false, error: insertError?.message ?? "Could not create facility." };
  }

  const { error: membershipError } = await admin.from("organization_memberships").insert({
    user_id: profile.id,
    org_id: newOrg.id,
    role: "org_admin",
    is_owner: true,
  });

  if (membershipError) {
    await admin.from("organizations").delete().eq("id", newOrg.id);
    return { ok: false, error: membershipError.message };
  }

  await admin.from("user_preferences").upsert({
    user_id: profile.id,
    active_org_id: newOrg.id,
    updated_at: new Date().toISOString(),
  });

  await syncOwnerAppRoleForOrg(billingRootId);

  revalidatePath("/app", "layout");
  return { ok: true, orgId: newOrg.id };
}
