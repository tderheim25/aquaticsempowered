import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { loadCommunityActivitySummary } from "@/lib/community/loadCommunityActivity";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const summary = await loadCommunityActivitySummary(supabase, profile.id);
  return NextResponse.json(summary);
}
