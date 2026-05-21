import { NextResponse } from "next/server";

import { getUsersRowForAuthUser, getSessionUser } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { loadCommunityActivitySummary } from "@/lib/community/loadCommunityActivity";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
  const summary = await loadCommunityActivitySummary(supabase, profile.id);
  return NextResponse.json(summary);
}
