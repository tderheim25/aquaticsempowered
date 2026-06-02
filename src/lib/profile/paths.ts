/** Portal account settings (name, password, avatar). */
export function accountSettingsPath(status?: string) {
  const base = "/app/account";
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}

/** Canonical community member profile URL (marketing shell, same as `/community` feed). */
export function communityProfilePath(userId: string, status?: string) {
  const base = `/community/profile/${userId}`;
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}

const COMMUNITY_PROFILE_PATH_RE = /^\/(?:app\/)?community\/profile\/([^/?#]+)$/;

/** Normalize legacy `/app/community/profile/:id` to `/community/profile/:id`. */
export function normalizeCommunityProfilePath(path: string): string | null {
  const m = path.match(COMMUNITY_PROFILE_PATH_RE);
  return m ? `/community/profile/${m[1]}` : null;
}
