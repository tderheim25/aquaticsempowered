import { Alert, Container } from "@mui/material";

import { requireOrg } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { ProcurementView } from "@/components/procurement/ProcurementView";
import { createClient } from "@/lib/supabase/server";
import { PROCUREMENT_CATEGORIES, PROCUREMENT_STATUSES } from "@/lib/validations/procurement";
import type {
  Database,
  PlanCode,
  ProcurementRequestCategory,
  ProcurementRequestStatus,
} from "@/types/database";

export const metadata = {
  title: "Procurement | Aquatics Empowered",
};

type ProcurementRequestRow = Database["public"]["Tables"]["procurement_requests"]["Row"];

type OrgMember = {
  id: string;
  full_name: string | null;
  email: string;
};

function parseOptionalEnum<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireViewAccess("procurement");
  const profile = await requireOrg();
  const orgId = profile.org_id!;
  const userId = profile.id;

  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", orgId).maybeSingle();
  const planCode = (org?.plan_code as PlanCode) ?? "free";
  const procurementEnabled = hasFeature(planCode, "procurement");

  const sp = await searchParams;
  const raw = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = raw("q")?.trim() || undefined;
  const status = parseOptionalEnum(raw("status"), PROCUREMENT_STATUSES);
  const category = parseOptionalEnum(raw("category"), PROCUREMENT_CATEGORIES);
  const mine = raw("mine") === "1" || raw("mine") === "true";

  let requests: ProcurementRequestRow[] = [];
  let orgMembers: OrgMember[] = [];
  let vendors: { id: string; name: string }[] = [];

  if (procurementEnabled) {
    let reqQuery = supabase.from("procurement_requests").select("*").eq("org_id", orgId);

    if (q) {
      reqQuery = reqQuery.ilike("title", `%${q}%`);
    }
    if (status) {
      reqQuery = reqQuery.eq("status", status);
    }
    if (category) {
      reqQuery = reqQuery.eq("category", category);
    }
    if (mine) {
      reqQuery = reqQuery.eq("created_by", userId);
    }

    const [reqRes, usersRes, vendorsRes] = await Promise.all([
      reqQuery.order("created_at", { ascending: false }),
      supabase.from("users").select("id, full_name, email").eq("org_id", orgId).order("full_name", { ascending: true }),
      supabase
        .from("vendors")
        .select("id, name")
        .eq("listing_visible", true)
        .order("name", { ascending: true })
        .limit(300),
    ]);

    if (reqRes.error) {
      return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Alert severity="error">
            Could not load procurement requests ({reqRes.error.message}). If this is a fresh project, run migration{" "}
            <code>0005_procurement_requests.sql</code> in the Supabase SQL editor, then reload.
          </Alert>
        </Container>
      );
    }

    requests = (reqRes.data ?? []) as ProcurementRequestRow[];
    orgMembers = (usersRes.data ?? []) as OrgMember[];
    vendors = (vendorsRes.data ?? []) as { id: string; name: string }[];
  }

  return (
    <ProcurementView
      requests={requests}
      orgMembers={orgMembers}
      vendors={vendors}
      procurementEnabled={procurementEnabled}
      initialFilters={{
        q: q ?? "",
        status: (status ?? "") as ProcurementRequestStatus | "",
        category: (category ?? "") as ProcurementRequestCategory | "",
        mine,
      }}
    />
  );
}
