import type { PlanCode, UserRole } from "@/types/database";

/** Super admins can use these regardless of subscription tier (support / AE Console). */
const ROLE_UNLOCKED_FEATURES: FeatureKey[] = [
  "pools",
  "monitoring",
  "sensors",
  "chemistry_calculator",
  "chemistry_reports",
];

export type FeatureKey =
  | "dashboard"
  | "pools"
  | "chemical_logs"
  | "maintenance"
  | "support"
  | "vendor_directory"
  | "community"
  | "procurement"
  | "training"
  | "monitoring"
  | "chemistry_calculator"
  | "chemistry_reports"
  | "sensors"
  | "energy_audits"
  | "admin";

/** Plan → feature flags (MVP: permissive; tighten per-feature PRs). */
export const PLAN_FEATURES: Record<PlanCode, Record<FeatureKey, boolean>> = {
  free: {
    dashboard: true,
    pools: false,
    chemical_logs: false,
    maintenance: false,
    support: false,
    vendor_directory: true,
    community: true,
    procurement: false,
    training: false,
    monitoring: false,
    chemistry_calculator: false,
    chemistry_reports: false,
    sensors: false,
    energy_audits: false,
    admin: false,
  },
  essential: {
    dashboard: true,
    pools: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: false,
    procurement: false,
    training: true,
    monitoring: false,
    chemistry_calculator: false,
    chemistry_reports: false,
    sensors: false,
    energy_audits: false,
    admin: false,
  },
  pro: {
    dashboard: true,
    pools: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: false,
    procurement: true,
    training: true,
    monitoring: false,
    chemistry_calculator: true,
    chemistry_reports: true,
    sensors: false,
    energy_audits: true,
    admin: false,
  },
  enterprise: {
    dashboard: true,
    pools: true,
    chemical_logs: true,
    maintenance: true,
    support: true,
    vendor_directory: true,
    community: true,
    procurement: true,
    training: true,
    monitoring: true,
    chemistry_calculator: true,
    chemistry_reports: true,
    sensors: true,
    energy_audits: true,
    admin: false,
  },
};

export function hasFeature(
  plan: PlanCode | null | undefined,
  feature: FeatureKey,
  role?: UserRole | null
): boolean {
  if (role === "super_admin") {
    if (ROLE_UNLOCKED_FEATURES.includes(feature)) return true;
  }
  const p = plan ?? "free";
  return PLAN_FEATURES[p]?.[feature] ?? false;
}
