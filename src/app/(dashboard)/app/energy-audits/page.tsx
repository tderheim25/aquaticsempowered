import { Alert, Container } from "@mui/material";

import { EnergyAuditView } from "@/components/energy-audit/EnergyAuditView";
import { canUseEnergyAudits } from "@/lib/auth/energyAuditAccess";
import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Energy Audits | Aquatics Empowered",
};

export default async function EnergyAuditsPage() {
  await requireViewAccess("energy_audits");
  const profile = await requireOrg();
  const orgId = profile.org_id!;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", orgId).maybeSingle();
  const planCode = (org?.plan_code as PlanCode) ?? "free";
  const enabled = canUseEnergyAudits(planCode);

  const [auditsRes, poolsRes] = enabled
    ? await Promise.all([
        supabase
          .from("energy_audits")
          .select("*")
          .eq("org_id", orgId)
          .order("updated_at", { ascending: false }),
        supabase.from("pools").select("id, name").eq("org_id", orgId).order("name", { ascending: true }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (auditsRes.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="error">
          Could not load energy audits ({auditsRes.error.message}). Apply migration{" "}
          <code>0035_energy_audits.sql</code> in Supabase, then reload.
        </Alert>
      </Container>
    );
  }

  const pools = poolsRes.data ?? [];
  const poolNameById = Object.fromEntries(pools.map((p) => [p.id, p.name]));

  return (
    <EnergyAuditView
      audits={auditsRes.data ?? []}
      pools={pools}
      enabled={enabled}
      poolNameById={poolNameById}
    />
  );
}
