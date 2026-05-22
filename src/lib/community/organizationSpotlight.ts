import type { PlanCode, OrgTier } from "@/types/database";

export type CommunityOrganizationSpotlight = {
  id: string;
  name: string;
  description: string;
  tier: OrgTier | null;
  plan_code: PlanCode | null;
  website_url: string | null;
  phone: string | null;
  founder: boolean;
  /** Primary CTA from the modal (external URL or in-app path). */
  visitHref: string;
  visitExternal: boolean;
  isDemo?: boolean;
};

export const DEMO_ORGANIZATION_SPOTLIGHTS: CommunityOrganizationSpotlight[] = [
  {
    id: "demo-org-1",
    name: "Regional operators circle",
    description:
      "Swap inspection notes and seasonal opening checklists with nearby facilities. Connect with operators in your region who run similar programs.",
    tier: null,
    plan_code: null,
    website_url: null,
    phone: null,
    founder: false,
    visitHref: "/community",
    visitExternal: false,
    isDemo: true,
  },
  {
    id: "demo-org-2",
    name: "CPO study lab",
    description:
      "Short prompts, code references, and continuing-education prep with peers and trainers. A focused space for certification study groups.",
    tier: null,
    plan_code: null,
    website_url: null,
    phone: null,
    founder: false,
    visitHref: "/community",
    visitExternal: false,
    isDemo: true,
  },
  {
    id: "demo-org-3",
    name: "Procurement roundtable",
    description:
      "Compare bids, vendor SLAs, and bulk buys without leaving the app. Built for aquatics leaders coordinating seasonal purchasing.",
    tier: null,
    plan_code: null,
    website_url: null,
    phone: null,
    founder: false,
    visitHref: "/founders",
    visitExternal: false,
    isDemo: true,
  },
];

export function normalizeOrganizationUrl(url: string) {
  const t = url.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function organizationDescriptionFromRow(row: {
  tier: OrgTier | null;
  plan_code: PlanCode;
  founder: boolean;
}) {
  const parts: string[] = [];
  if (row.tier) parts.push(`${row.tier.replace(/_/g, " ")} facility`);
  if (row.founder) parts.push("Founder program member");
  parts.push(`${row.plan_code.replace(/_/g, " ")} plan`);
  return `Aquatics organization on Aquatics Empowered · ${parts.join(" · ")}`;
}

export function visitTargetForOrganization(
  org: { id: string; website_url: string | null },
  viewerOrgId: string | null
): { visitHref: string; visitExternal: boolean } {
  const external = normalizeOrganizationUrl(org.website_url ?? "");
  if (external) {
    return { visitHref: external, visitExternal: true };
  }
  if (viewerOrgId && viewerOrgId === org.id) {
    return { visitHref: "/app", visitExternal: false };
  }
  return { visitHref: "/community", visitExternal: false };
}

export function mapOrganizationRowToSpotlight(
  row: {
    id: string;
    name: string;
    tier: OrgTier | null;
    plan_code: PlanCode;
    website_url: string | null;
    phone: string | null;
    founder: boolean;
  },
  viewerOrgId: string | null
): CommunityOrganizationSpotlight {
  const { visitHref, visitExternal } = visitTargetForOrganization(row, viewerOrgId);
  return {
    id: row.id,
    name: row.name,
    description: organizationDescriptionFromRow(row),
    tier: row.tier,
    plan_code: row.plan_code,
    website_url: row.website_url,
    phone: row.phone,
    founder: row.founder,
    visitHref,
    visitExternal,
  };
}
