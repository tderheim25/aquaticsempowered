import { VendorPendingPageContent } from "@/components/vendor/VendorPendingPageContent";
import { VendorPendingPageShell } from "@/components/vendor/VendorPendingPageShell";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Vendor setup | Aquatics Empowered",
};

export default async function VendorPendingPage() {
  const profile = await requireProfileForApp();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("vendor_applications")
    .select("status, company_name, review_note, created_at")
    .ilike("email", profile.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <VendorPendingPageShell>
      <VendorPendingPageContent application={application} />
    </VendorPendingPageShell>
  );
}
