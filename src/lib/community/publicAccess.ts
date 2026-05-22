import type { UsersRow } from "@/lib/auth/rbac";

/** Public `/community` is free for any signed-in member with a `users` row. */
export function canUsePublicCommunity(
  userId: string | null | undefined,
  profile: UsersRow | null
): boolean {
  return Boolean(userId && profile);
}
