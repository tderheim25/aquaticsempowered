import type { PlanCode } from "@/types/database";

export type FeatureKey =
  | "dashboard"
  | "chemical_logs"
  | "maintenance"
  | "support"
  | "vendor_directory"
  | "community"
  | "procurement"
  | "training"
  | "monitoring"
  | "admin";

/** Plan → feature flags (MVP: permissive; tighten per-feature PRs). */
export const PLAN_FEATURES: Record<PlanCode, Record<FeatureKey, boolean>> = {
  free: {
    dashboard: true,
    chemical_logs: false,
    maintenance: false,
    support: false,
    vendor_directory: true,
    community: true,
    procurement: false,
    training: false,
    monitoring: false,
    admin: false,
  },
  essential: {
    dashboard: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: false,
    procurement: false,
    training: false,
    monitoring: false,
    admin: false,
  },
  pro: {
    dashboard: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: false,
    procurement: true,
    training: true,
    monitoring: false,
    admin: false,
  },
  enterprise: {
    dashboard: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: true,
    procurement: true,
    training: true,
    monitoring: true,
    admin: false,
  },
};

export function hasFeature(plan: PlanCode | null | undefined, feature: FeatureKey): boolean {
  const p = plan ?? "free";
  return PLAN_FEATURES[p]?.[feature] ?? false;
}
