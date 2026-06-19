import { Alert, Button, Container } from "@mui/material";
import Link from "next/link";

import { SelectOrgSidebarHint } from "@/components/dashboard/SelectOrgSidebarHint";
import { EmptyStateIllustration } from "@/components/pool-ops/EmptyStateIllustration";
import { PoolOpsPageShell } from "@/components/pool-ops/PoolOpsPageShell";
import { AddPoolModal } from "@/components/pools/AddPoolModal";
import { PoolsList, type PoolListItem } from "@/components/pools/PoolsList";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { countActivePoolsForBillingRoot } from "@/lib/billing/billingRoot";
import { getMonthlyTotal } from "@/lib/billing/poolBilling";
import { getPoolLicenseSnapshot } from "@/lib/billing/poolLicenses";
import { canManagePools, poolBillingMessage } from "@/lib/billing/poolLimits";
import { fetchLastReadingByPool, fetchPoolsForOrg } from "@/lib/pools/fetchPool";
import { POOL_ADDON_MONTHLY_USD } from "@/lib/marketing/publicPricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pools | Aquatics Empowered" };

export default async function PoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; org?: string; add?: string }>;
}) {
  await requireViewAccess("pools");
  const profile = await requireProfileForApp();
  const { status, org, add } = await searchParams;

  const orgCtx = await loadActiveOrgContext(profile, org);
  const activeOrgId = orgCtx.activeOrgId;

  if (!activeOrgId) {
    return (
      <Container maxWidth="xl">
        <PoolOpsPageShell title="Pools" subtitle="Register pools and spas for your facility.">
          <SelectOrgSidebarHint superAdmin={profile.role === "super_admin"} />
        </PoolOpsPageShell>
      </Container>
    );
  }

  const supabase = await createClient();
  const planCode = orgCtx.planCode;
  const billingRootId = orgCtx.billingRootOrgId ?? activeOrgId;
  const { data: rootOrg } = await supabase
    .from("organizations")
    .select("founder")
    .eq("id", billingRootId)
    .maybeSingle();
  const founder = rootOrg?.founder ?? false;

  const pools = await fetchPoolsForOrg(activeOrgId, profile);
  const facilityActivePoolCount = pools.filter((p) => p.status === "active").length;
  const accountActivePoolCount = await countActivePoolsForBillingRoot(billingRootId);
  const canAddMore = canManagePools(planCode) || profile.role === "super_admin";
  const billingEstimate =
    planCode !== "free"
      ? getMonthlyTotal({ planCode, founder, activePoolCount: accountActivePoolCount })
      : null;
  const nextPoolWouldBill =
    billingEstimate && accountActivePoolCount >= 1
      ? POOL_ADDON_MONTHLY_USD
      : 0;

  const poolLicenseSnapshot =
    planCode !== "free"
      ? await getPoolLicenseSnapshot(billingRootId).catch(() => null)
      : null;
  const needsPoolLicense =
    Boolean(poolLicenseSnapshot) &&
    accountActivePoolCount >= 1 &&
    (poolLicenseSnapshot?.available ?? 0) < 1;

  const poolIds = pools.map((p) => p.id);
  const lastByPool = await fetchLastReadingByPool(activeOrgId, poolIds, profile);

  const list: PoolListItem[] = pools.map((p) => ({
    ...p,
    lastReadingAt: lastByPool.get(p.id) ?? null,
  }));

  const reopenModal =
    add === "1" || status === "invalid" || status === "error" || status === "license_required";

  return (
    <Container maxWidth="xl">
      <PoolOpsPageShell
        title="Pools"
        subtitle="Register pools and spas for your facility."
        actions={
          <AddPoolModal
            orgId={activeOrgId}
            status={status}
            defaultOpen={reopenModal}
            canAddMore={canAddMore}
            additionalPoolFeeUsd={nextPoolWouldBill}
            needsPoolLicense={needsPoolLicense}
            poolLicensesAvailable={poolLicenseSnapshot?.available ?? 0}
          />
        }
      >
        {status === "created" && <Alert severity="success">Pool created.</Alert>}
        {status === "deleted" && <Alert severity="success">Pool deleted.</Alert>}
        {status === "license_required" && (
          <Alert severity="warning">
            An available pool add-on is required before adding another active pool. Purchase an add-on in
            the add-pool dialog or from Billing.
          </Alert>
        )}
        {status === "no_plan" && (
          <Alert severity="warning" action={
            <Button component={Link} href="/app/billing" color="inherit" size="small">
              Subscribe
            </Button>
          }>
            Subscribe to a paid plan to add pools.
          </Alert>
        )}
        {planCode !== "free" && facilityActivePoolCount > 0 ? (
          <Alert severity="info">
            {poolBillingMessage()} Pool fees apply across all facilities on your account.
            {billingEstimate && billingEstimate.addonQuantity > 0
              ? ` Current pool add-ons: ${billingEstimate.addonQuantity} × $${POOL_ADDON_MONTHLY_USD}/mo.`
              : ""}
          </Alert>
        ) : null}
        {list.length === 0 ? (
          <EmptyStateIllustration
            title="No pools yet"
            description="Add your first pool to link chemical logs, maintenance, and monitoring."
            action={
              <AddPoolModal
                orgId={activeOrgId}
                status={status}
                canAddMore={canAddMore}
                additionalPoolFeeUsd={0}
              />
            }
          />
        ) : (
          <PoolsList pools={list} />
        )}
      </PoolOpsPageShell>
    </Container>
  );
}
