import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { createClient } from "@/lib/supabase/server";

const MAX_COMMENT_CHARS = 2000;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(`community-comment:${user.id}`, {
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { postId?: string; comment?: string };
  try {
    body = (await req.json()) as { postId?: string; comment?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const postId = String(body.postId ?? "").trim();
  const text = String(body.comment ?? "").trim().slice(0, MAX_COMMENT_CHARS);
  if (!postId || !text) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("community_post_comments")
    .insert({ post_id: postId, author_id: profile.id, body: text })
    .select("id, post_id, author_id, body, created_at")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({
    comment: {
      id: inserted.id,
      author_id: inserted.author_id,
      body: inserted.body,
      created_at: inserted.created_at,
      author_display: profile.full_name?.trim() ?? "",
      author_email: profile.email,
    },
  });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const commentId = new URL(req.url).searchParams.get("id")?.trim();
  if (!commentId) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("community_post_comments")
    .select("id, post_id")
    .eq("id", commentId)
    .eq("author_id", profile.id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await supabase.from("community_post_comments").delete().eq("id", commentId).eq("author_id", profile.id);
  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, postId: row.post_id, commentId });
}
