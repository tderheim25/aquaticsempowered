import { NextResponse } from "next/server";

import { getUsersRowForAuthUser, getSessionUser } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowForAuthUser(user.id);
  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const allowed = await getAllowedViewsForProfile({ role: profile.role, app_role_id: profile.app_role_id });
  if (!allowed.includes("community")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
