import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { getUsersRowWithAdminFallback, requireAuth } from "@/lib/auth/rbac";
import { getVendorForUser } from "@/lib/auth/vendorPortal";
import { loadOrgSubscriptionSummary } from "@/lib/billing/loadOrgSubscriptionSummary";
import { isAwaitingPayment, planLabelFromCode } from "@/lib/billing/subscriptionSummary";
import { enforceExpiredPilotAccess } from "@/lib/pilot/pilotAccess";
import { captureException } from "@/lib/sentry";
import { syncOrgBillingFromStripe } from "@/lib/stripe/syncSubscription";
import { isStripeConfigured } from "@/lib/stripe/server";
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
  let pilotAccessStatus: Awaited<ReturnType<typeof enforceExpiredPilotAccess>> | null = null;

  if (orgCtx.billingRootOrgId && profile?.role !== "vendor") {
    pilotAccessStatus = await enforceExpiredPilotAccess(orgCtx.billingRootOrgId);
    if (pilotAccessStatus.expired) {
      planCode = "free";
    }
  }

  if (profile?.role === "vendor") {
    const vendor = await getVendorForUser(profile.id);
    displayOrgName = vendor?.name ?? "Vendor partner";
    planCode = "essential";
  } else if (profile?.org_id && !orgCtx.activeOrgName) {
    const { data: memberOrg } = await supabase
      .from("organizations")
      .select("name, plan_code")
      .eq("id", profile.org_id)
      .maybeSingle();
    displayOrgName = memberOrg?.name ?? null;
    planCode = (memberOrg?.plan_code as PlanCode) ?? planCode;
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
  const mustChangePassword = user?.user_metadata?.must_change_password === true;
  const allowedViews = await getAllowedViewsForProfile(
    profile ? { role: profile.role, app_role_id: profile.app_role_id } : null
  );

  const canManageOrgBilling =
    Boolean(orgCtx.activeOrgId) &&
    profile?.role !== "vendor" &&
    (profile?.role === "org_admin" || profile?.role === "super_admin");

  const canViewOrgSubscription =
    Boolean(orgCtx.activeOrgId) &&
    profile?.role !== "vendor" &&
    profile?.role !== "support_technician";

  const subscriptionSummary =
    canViewOrgSubscription && orgCtx.billingRootOrgId
      ? await loadOrgSubscriptionSummary(
          supabase,
          orgCtx.billingRootOrgId,
          planCode,
          canManageOrgBilling,
        )
      : null;

  if (
    isStripeConfigured() &&
    orgCtx.billingRootOrgId &&
    subscriptionSummary &&
    isAwaitingPayment(subscriptionSummary.status)
  ) {
    try {
      await syncOrgBillingFromStripe(orgCtx.billingRootOrgId);
    } catch (error) {
      captureException(error, { step: "dashboard_layout_resync", orgId: orgCtx.billingRootOrgId });
    }
  }

  const refreshedSubscriptionSummary =
    canViewOrgSubscription && orgCtx.billingRootOrgId
      ? await loadOrgSubscriptionSummary(
          supabase,
          orgCtx.billingRootOrgId,
          planCode,
          canManageOrgBilling,
        )
      : subscriptionSummary;

  const hasFacilitySwitcher =
    profile?.role !== "vendor" &&
    (orgCtx.orgOptions.length > 0 ||
      Boolean(orgCtx.activeOrgId && displayOrgName));

  const facilityOrgOptions =
    orgCtx.orgOptions.length > 0
      ? orgCtx.orgOptions
      : orgCtx.activeOrgId && displayOrgName
        ? [{ id: orgCtx.activeOrgId, name: displayOrgName }]
        : [];

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
      subscriptionSummary={refreshedSubscriptionSummary}
      userRole={profile?.role ?? null}
      allowedViews={allowedViews}
      hasOrg={orgCtx.hasActiveOrg}
      orgSwitcherOptions={hasFacilitySwitcher ? facilityOrgOptions : undefined}
      activeOrgId={hasFacilitySwitcher ? orgCtx.activeOrgId : undefined}
      showOrgSwitcher={hasFacilitySwitcher}
      canCreateFacility={orgCtx.canCreateFacility}
      isFounder={orgCtx.isFounder}
      pilotEnded={
        pilotAccessStatus?.expired
          ? {
              orgName: pilotAccessStatus.orgName,
              endedAt: pilotAccessStatus.pilotAccessUntil,
            }
          : null
      }
      mustChangePassword={mustChangePassword}
    >
      {children}
    </DashboardShell>
  );
}
