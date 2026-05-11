"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgTier, PlanCode } from "@/types/database";

const PLAN_CODES: readonly PlanCode[] = ["free", "essential", "pro", "enterprise"];

const ORG_TIERS: readonly OrgTier[] = [
  "rural",
  "municipal",
  "hotel",
  "school",
  "hospital",
  "hoa",
  "splash_pad",
  "wellness",
  "commercial",
  "therapy",
];

function parseTier(raw: string): OrgTier | null {
  const s = raw.trim();
  if (!s || s === "__none__") return null;
  return ORG_TIERS.includes(s as OrgTier) ? (s as OrgTier) : null;
}

function parsePlan(raw: string): PlanCode | null {
  const s = raw.trim() as PlanCode;
  return PLAN_CODES.includes(s) ? s : null;
}

export async function createOrganizationAction(formData: FormData) {
  await requireViewAccess("admin_portal");
  await requireRole("super_admin");

  const name = String(formData.get("name") ?? "").trim();
  const tierRaw = String(formData.get("tier") ?? "");
  const planRaw = String(formData.get("plan_code") ?? "free");

  if (!name) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const tier = parseTier(tierRaw);
  const plan_code = parsePlan(planRaw);
  if (tierRaw && tierRaw !== "__none__" && tier === null) {
    redirect("/app/admin?section=organizations&status=invalid");
  }
  if (!plan_code) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("organizations").insert({ name, tier, plan_code });

  if (error) {
    redirect("/app/admin?section=organizations&status=error");
  }

  revalidatePath("/app");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/users");
  redirect("/app/admin?section=organizations&status=created");
}

export async function updateOrganizationAction(formData: FormData) {
  await requireViewAccess("admin_portal");
  await requireRole("super_admin");

  const id = String(formData.get("orgId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const tierRaw = String(formData.get("tier") ?? "");
  const planRaw = String(formData.get("plan_code") ?? "");
  const founder = formData.get("founder") === "on";

  if (!id || !name) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const tier = parseTier(tierRaw);
  if (tierRaw && tierRaw !== "__none__" && tier === null) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const plan_code = parsePlan(planRaw);
  if (!plan_code) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update({ name, tier, plan_code, founder }).eq("id", id);

  if (error) {
    redirect("/app/admin?section=organizations&status=error");
  }

  revalidatePath("/app");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/users");
  redirect("/app/admin?section=organizations&status=updated");
}

export async function updateUserOrgAssignmentAction(formData: FormData) {
  await requireViewAccess("admin_portal");
  await requireRole("super_admin");

  const userId = String(formData.get("userId") ?? "").trim();
  const orgIdRaw = String(formData.get("orgId") ?? "").trim();

  if (!userId) {
    redirect("/app/admin?section=organizations&status=invalid");
  }

  const org_id = !orgIdRaw || orgIdRaw === "__unassigned__" ? null : orgIdRaw;

  const admin = createAdminClient();

  if (org_id) {
    const { data: org, error: orgErr } = await admin.from("organizations").select("id").eq("id", org_id).maybeSingle();
    if (orgErr || !org) {
      redirect("/app/admin?section=organizations&status=invalid");
    }
  }

  const { error } = await admin.from("users").update({ org_id }).eq("id", userId);

  if (error) {
    redirect("/app/admin?section=organizations&status=error");
  }

  revalidatePath("/app");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/users");
  redirect("/app/admin?section=organizations&status=assigned");
}
