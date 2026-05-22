import { SupportPortalShell } from "@/components/support-portal/SupportPortalShell";
import { requireSupportTechnicianRole } from "@/lib/auth/supportTechnician";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDisplayName } from "@/lib/profile/avatar";

export const dynamic = "force-dynamic";

export default async function SupportPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireSupportTechnicianRole();

  const admin = createAdminClient();
  let providerName = "Support provider";
  if (profile.support_provider_id) {
    const { data: provider } = await admin
      .from("support_providers")
      .select("name")
      .eq("id", profile.support_provider_id)
      .maybeSingle();
    if (provider?.name) providerName = provider.name;
  }

  const userLabel = buildDisplayName({
    full_name: profile.full_name,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
  });

  return (
    <SupportPortalShell providerName={providerName} userLabel={userLabel}>
      {children}
    </SupportPortalShell>
  );
}
