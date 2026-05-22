import type { UserRole } from "@/types/database";

/** Default post-login path by platform role. */
export function homePathForRole(role: UserRole | null | undefined): string {
  if (role === "support_technician") return "/portal/queue";
  if (role === "vendor") return "/app/vendor";
  return "/app";
}

/** Whether this path is allowed for vendor accounts without redirect. */
export function isVendorAllowedAppPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/app/vendor" || p.startsWith("/app/vendor/")) return true;
  if (p === "/app/support" || p.startsWith("/app/support/")) return true;
  if (p === "/app/needs-profile" || p.startsWith("/app/needs-profile/")) return true;
  if (p === "/app/forbidden") return true;
  if (p.startsWith("/app/invitations")) return true;
  return false;
}

/** Whether this path is allowed for support technicians without redirect. */
export function isSupportTechnicianAllowedAppPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p.startsWith("/portal")) return true;
  if (p === "/app/support") return true;
  if (p === "/app/needs-profile") return true;
  if (p === "/app/forbidden") return true;
  if (p.startsWith("/app/invitations")) return true;
  return false;
}
