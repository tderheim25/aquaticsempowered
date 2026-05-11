import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { getUsersRowForAuthUser, requireAuth } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

function planLabel(code: PlanCode) {
  switch (code) {
    case "free":
      return "Free";
    case "essential":
      return "Essential";
    case "pro":
      return "Professional";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = await getUsersRowForAuthUser(user!.id);

  let orgName: string | null = null;
  let planCode: PlanCode = "free";

  if (profile?.org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, plan_code")
      .eq("id", profile.org_id)
      .maybeSingle();
    orgName = org?.name ?? null;
    planCode = (org?.plan_code as PlanCode) ?? "free";
  }

  const displayName = profile?.full_name?.trim() || user?.email || "Operator";
  const allowedViews = await getAllowedViewsForProfile(
    profile ? { role: profile.role, app_role_id: profile.app_role_id } : null
  );

  return (
    <DashboardShell
      displayName={displayName}
      orgName={orgName}
      planLabel={planLabel(planCode)}
      userRole={profile?.role ?? null}
      allowedViews={allowedViews}
      hasOrg={Boolean(profile?.org_id)}
    >
      {children}
    </DashboardShell>
  );
}
