/** Fixed path — type manually; no in-app navigation links. */
export const SUPER_ADMIN_PORTAL_PATH = "/private/ae-console";

export function getSuperAdminPortalPath() {
  return SUPER_ADMIN_PORTAL_PATH;
}

export function consoleSectionUrl(section: string, params?: Record<string, string>) {
  const q = new URLSearchParams({ section, ...params });
  return `${SUPER_ADMIN_PORTAL_PATH}?${q.toString()}`;
}
