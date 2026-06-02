import type { PlanCode } from "@/types/database";

export type OrgSubscriptionSummary = {
  planCode: PlanCode;
  planLabel: string;
  status: string;
  statusLabel: string;
  statusColor: "success" | "warning" | "error" | "default";
  /** Human-readable renewal / access line; null when not applicable. */
  periodLine: string | null;
  canManageBilling: boolean;
};

export function planLabelFromCode(code: PlanCode): string {
  switch (code) {
    case "free":
      return "Free";
    case "essential":
      return "Essential";
    case "pro":
      return "Professional";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

function formatPeriodDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** Maps legacy/custom DB statuses to Stripe-aligned values for display. */
export function normalizeSubscriptionStatus(status: string): string {
  if (status === "founder_pending") return "incomplete";
  return status;
}

export function statusPresentation(status: string): {
  label: string;
  color: OrgSubscriptionSummary["statusColor"];
} {
  const normalized = normalizeSubscriptionStatus(status);
  switch (normalized) {
    case "active":
      return { label: "Active", color: "success" };
    case "trialing":
      return { label: "Trial", color: "success" };
    case "past_due":
      return { label: "Past due", color: "warning" };
    case "canceled":
      return { label: "Canceled", color: "default" };
    case "unpaid":
      return { label: "Unpaid", color: "error" };
    case "incomplete":
    case "incomplete_expired":
      return { label: "Awaiting payment", color: "warning" };
    case "demo_pending":
      return { label: "Demo requested", color: "default" };
    case "paused":
      return { label: "Paused", color: "warning" };
    default:
      return {
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        color: "default",
      };
  }
}

export function buildPeriodLine(status: string, periodEnd: string | null): string | null {
  const normalized = normalizeSubscriptionStatus(status);
  if (normalized === "incomplete" || normalized === "incomplete_expired") {
    return "Complete secure checkout to activate your plan.";
  }
  if (normalized === "demo_pending") {
    return "Our team will reach out within two business days.";
  }
  if (!periodEnd) return null;
  const end = formatPeriodDate(periodEnd);
  if (normalized === "active" || normalized === "trialing") {
    return normalized === "trialing" ? `Trial ends ${end}` : `Renews ${end}`;
  }
  if (normalized === "past_due") {
    return `Payment overdue · period ends ${end}`;
  }
  if (normalized === "canceled") {
    return `Access until ${end}`;
  }
  return `Period ends ${end}`;
}

export function buildOrgSubscriptionSummary(input: {
  orgPlanCode: PlanCode;
  subscription: {
    plan_code: PlanCode;
    status: string;
    current_period_end: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null;
  canManageBilling: boolean;
  /** Latest founder wizard lead for this org, if any. */
  founderLeadRequestType?: "founder_account" | "demo" | null;
}): OrgSubscriptionSummary {
  const sub = input.subscription;
  const planCode = sub?.plan_code ?? input.orgPlanCode;
  let status = normalizeSubscriptionStatus(sub?.status ?? (planCode === "free" ? "free" : "inactive"));

  const activeStripeStatuses = new Set(["active", "trialing"]);
  if (
    input.founderLeadRequestType === "demo" &&
    !sub?.stripe_subscription_id &&
    !activeStripeStatuses.has(status)
  ) {
    status = "demo_pending";
  }
  const { label: statusLabel, color: statusColor } =
    status === "free"
      ? { label: "Free", color: "default" as const }
      : status === "inactive"
        ? { label: "Inactive", color: "default" as const }
        : statusPresentation(status);

  let periodLine = sub ? buildPeriodLine(status, sub.current_period_end) : null;
  if (!sub && planCode !== "free") {
    periodLine = "No Stripe billing record for this organization yet.";
  }
  if (planCode === "free" && !sub?.stripe_customer_id) {
    periodLine = "Upgrade anytime from Pricing.";
  }

  return {
    planCode,
    planLabel: planLabelFromCode(planCode),
    status,
    statusLabel,
    statusColor,
    periodLine,
    canManageBilling: input.canManageBilling && Boolean(sub?.stripe_customer_id),
  };
}
