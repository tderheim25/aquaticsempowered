import type { SupabaseClient } from "@supabase/supabase-js";

/** Signed GET URLs for private `community-media` objects (img tags do not send Supabase cookies). */
export async function signCommunityMediaPaths(client: SupabaseClient, paths: string[], expiresSec = 43_200) {
  const map = new Map<string, string>();
  for (const p of [...new Set(paths)]) {
    const { data, error } = await client.storage.from("community-media").createSignedUrl(p, expiresSec);
    if (!error && data?.signedUrl) {
      map.set(p, data.signedUrl);
    }
  }
  return map;
}
