import type { SupabaseClient } from "@supabase/supabase-js";

/** Signed GET URL for a private avatar in the `avatars` bucket. */
export async function signAvatarPath(client: SupabaseClient, path: string | null | undefined, expiresSec = 43_200) {
  if (!path?.trim()) return null;
  const { data, error } = await client.storage.from("avatars").createSignedUrl(path, expiresSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function buildDisplayName(user: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email: string;
}) {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return user.full_name?.trim() || user.email.split("@")[0] || "Member";
}
