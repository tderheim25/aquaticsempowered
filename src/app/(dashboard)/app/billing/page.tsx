import { redirect } from "next/navigation";

import { SubscriptionPageContent } from "@/components/billing/SubscriptionPageContent";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback, requireAuth } from "@/lib/auth/rbac";
import { loadOrgSubscriptionDetails } from "@/lib/billing/loadOrgSubscriptionDetails";
import { getSelfServeBillingAvailability } from "@/lib/billing/stripeBillingAvailability";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Subscription | Aquatics Empowered",
};

export default async function BillingPage() {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getUsersRowWithAdminFallback(user!.id);
  if (!profile || (profile.role !== "org_admin" && profile.role !== "super_admin")) {
    redirect("/app");
  }

  const orgCtx = await loadActiveOrgContext(profile);
  if (!orgCtx.activeOrgId) {
    redirect("/app");
  }

  const [details, billingAvailability] = await Promise.all([
    loadOrgSubscriptionDetails(
      supabase,
      orgCtx.activeOrgId,
      orgCtx.planCode as PlanCode,
      orgCtx.activeOrgName,
      true,
    ),
    Promise.resolve(getSelfServeBillingAvailability()),
  ]);

  return <SubscriptionPageContent details={details} billingAvailability={billingAvailability} />;
}
