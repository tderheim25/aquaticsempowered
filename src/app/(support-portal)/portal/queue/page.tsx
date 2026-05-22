import { Alert } from "@mui/material";

import { SupportQueueView } from "@/components/support-portal/SupportQueueView";
import { requireSupportTechnicianRole } from "@/lib/auth/supportTechnician";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata = {
  title: "Open queue | Support Portal",
};

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

export default async function SupportQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireSupportTechnicianRole();
  const canAccept = !!profile.support_provider_id;
  const sp = await searchParams;
  const stateRaw = sp.state;
  const state = (Array.isArray(stateRaw) ? stateRaw[0] : stateRaw)?.trim() || "";

  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("*")
    .eq("status", "open")
    .is("assigned_support_provider_id", null)
    .order("created_at", { ascending: false });

  if (state) {
    query = query.eq("state_code", state);
  }

  const { data, error } = await query;

  if (error) {
    return <Alert severity="error">Could not load queue. ({error.message})</Alert>;
  }

  return (
    <SupportQueueView
      tickets={(data ?? []) as Ticket[]}
      initialState={state}
      canAccept={canAccept}
    />
  );
}
