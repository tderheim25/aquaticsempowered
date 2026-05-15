/** Canonical profile URL (account + community). */
export function communityProfilePath(userId: string, status?: string) {
  const base = `/app/community/profile/${userId}`;
  return status ? `${base}?status=${encodeURIComponent(status)}` : base;
}
