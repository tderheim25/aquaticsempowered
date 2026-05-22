import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: existing } = await supabase.from("community_profiles").select("bio").eq("user_id", profile.id).maybeSingle();

  const { error } = await supabase.from("community_profiles").upsert(
    {
      user_id: profile.id,
      bio: existing?.bio ?? "",
      updated_at: now,
      last_connections_activity_seen_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
