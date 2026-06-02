import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

function canUseAdminClient() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** Session read first; service role if RLS hides the row (after authorized follow). */
export async function isFollowingCommunityUser(
  supabase: SupabaseClient,
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (data) return true;

  if (!canUseAdminClient()) return false;

  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("community_follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("followee_id", followeeId)
      .maybeSingle();
    return Boolean(row);
  } catch {
    return false;
  }
}

/** Insert follow; service role only when session insert is blocked by RLS (caller must authorize first). */
export async function insertCommunityFollow(
  supabase: SupabaseClient,
  followerId: string,
  followeeId: string
): Promise<{ ok: true } | { ok: false; code?: string; message?: string }> {
  const { error } = await supabase
    .from("community_follows")
    .insert({ follower_id: followerId, followee_id: followeeId });

  if (!error) return { ok: true };

  const rlsBlocked = error.code === "42501" || /row-level security/i.test(error.message ?? "");
  if (!rlsBlocked || !canUseAdminClient()) {
    return { ok: false, code: error.code, message: error.message };
  }

  try {
    const admin = createAdminClient();
    const { error: adminErr } = await admin
      .from("community_follows")
      .insert({ follower_id: followerId, followee_id: followeeId });
    if (adminErr) {
      return { ok: false, code: adminErr.code, message: adminErr.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "admin insert failed" };
  }
}
