import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = (await req.json()) as { postId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const postId = String(body.postId ?? "").trim();
  if (!postId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("community_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", profile.id);
  } else {
    await supabase.from("community_likes").insert({ post_id: postId, user_id: profile.id });
  }

  const { count } = await supabase
    .from("community_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  const liked = !existing;

  return NextResponse.json({ liked, count: count ?? 0 });
}
