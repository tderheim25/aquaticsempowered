import type { PlanCode } from "@/types/database";

export type PlanOwnerAppRoleSlug =
  | "essential_owner"
  | "professional_owner"
  | "enterprise_owner";

const OWNER_SLUGS: PlanOwnerAppRoleSlug[] = [
  "essential_owner",
  "professional_owner",
  "enterprise_owner",
];

export function isPaidPlan(plan: PlanCode | null | undefined): boolean {
  return plan === "essential" || plan === "pro" || plan === "enterprise";
}

export function ownerAppRoleSlugForPlan(plan: PlanCode | null | undefined): PlanOwnerAppRoleSlug {
  switch (plan) {
    case "enterprise":
      return "enterprise_owner";
    case "pro":
      return "professional_owner";
    case "essential":
    case "free":
    default:
      return "essential_owner";
  }
}

export function isPlanOwnerAppRoleSlug(slug: string): slug is PlanOwnerAppRoleSlug {
  return (OWNER_SLUGS as string[]).includes(slug);
}
