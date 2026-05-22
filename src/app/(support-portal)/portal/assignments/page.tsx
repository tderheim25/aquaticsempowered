import { Alert, Container } from "@mui/material";

import { SupportAssignmentsView } from "@/components/support-portal/SupportAssignmentsView";
import { requireSupportTechnicianRole } from "@/lib/auth/supportTechnician";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Assignments | Support Portal",
};

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

export default async function SupportAssignmentsPage() {
  const profile = await requireSupportTechnicianRole();

  if (!profile.support_provider_id) {
    return (
      <Container disableGutters>
        <Alert severity="info">
          Your account is not linked to a support provider yet. Ask your administrator to assign you in AE Console.
        </Alert>
      </Container>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("assigned_support_provider_id", profile.support_provider_id)
    .order("accepted_at", { ascending: false, nullsFirst: false });

  if (error) {
    return <Alert severity="error">Could not load assignments. ({error.message})</Alert>;
  }

  return <SupportAssignmentsView tickets={(data ?? []) as Ticket[]} />;
}
