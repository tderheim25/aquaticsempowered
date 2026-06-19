/** Client-safe org context helpers (no next/headers). */

export const SUPER_ADMIN_ORG_COOKIE = "ae_super_admin_org";
/** Active facility for multi-org owners and super admins. */
export const ACTIVE_ORG_COOKIE = "ae_active_org";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type OrgOption = { id: string; name: string };

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

/** Appends ?org= for super-admin facility links so pages resolve org without relying on cookies alone. */
export function hrefWithOrg(href: string, orgId: string): string {
  const [path, search = ""] = href.split("?");
  const params = new URLSearchParams(search);
  params.set("org", orgId);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
