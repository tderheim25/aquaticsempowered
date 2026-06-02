import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { getUsersRowWithAdminFallback, requireAuth } from "@/lib/auth/rbac";
import { getVendorForUser } from "@/lib/auth/vendorPortal";
import { loadOrgSubscriptionSummary } from "@/lib/billing/loadOrgSubscriptionSummary";
import { planLabelFromCode } from "@/lib/billing/subscriptionSummary";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import { accountSettingsPath, communityProfilePath } from "@/lib/profile/paths";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getUsersRowWithAdminFallback(user!.id);
  const orgCtx = await loadActiveOrgContext(profile);

  let displayOrgName: string | null = orgCtx.activeOrgName;
  let planCode: PlanCode = orgCtx.planCode;

  if (profile?.role === "vendor") {
    const vendor = await getVendorForUser(profile.id);
    displayOrgName = vendor?.name ?? "Vendor partner";
    planCode = "essential";
  } else if (profile?.org_id) {
    const { data: memberOrg } = await supabase
      .from("organizations")
      .select("name, plan_code")
      .eq("id", profile.org_id)
      .maybeSingle();
    displayOrgName = memberOrg?.name ?? null;
    planCode = (memberOrg?.plan_code as PlanCode) ?? "free";
  }

  const displayName = profile
    ? buildDisplayName({
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
        email: profile.email,
      })
    : user?.email || "Operator";
  const avatarUrl = profile ? await signAvatarPath(supabase, profile.avatar_path) : null;
  const allowedViews = await getAllowedViewsForProfile(
    profile ? { role: profile.role, app_role_id: profile.app_role_id } : null
  );

  const canViewOrgBilling =
    Boolean(orgCtx.activeOrgId) &&
    profile?.role !== "vendor" &&
    (profile?.role === "org_admin" || profile?.role === "super_admin");

  const subscriptionSummary =
    canViewOrgBilling && orgCtx.activeOrgId
      ? await loadOrgSubscriptionSummary(
          supabase,
          orgCtx.activeOrgId,
          planCode,
          profile?.role === "org_admin" || profile?.role === "super_admin",
        )
      : null;

  return (
    <DashboardShell
      displayName={displayName}
      avatarUrl={avatarUrl}
      accountSettingsHref={profile ? accountSettingsPath() : null}
      communityProfileHref={
        profile && allowedViews.includes("community") ? communityProfilePath(profile.id) : null
      }
      orgName={displayOrgName}
      planLabel={planLabelFromCode(planCode)}
      subscriptionSummary={subscriptionSummary}
      userRole={profile?.role ?? null}
      allowedViews={allowedViews}
      hasOrg={orgCtx.hasActiveOrg}
      superAdminOrgOptions={orgCtx.showOrgSwitcher ? orgCtx.orgOptions : undefined}
      superAdminActiveOrgId={orgCtx.showOrgSwitcher ? orgCtx.activeOrgId : undefined}
    >
      {children}
    </DashboardShell>
  );
}
