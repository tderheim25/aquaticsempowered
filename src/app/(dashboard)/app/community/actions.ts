"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp, type UsersRow } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Some browsers leave `File.type` empty; infer from extension so validation matches upload. */
function effectiveMime(file: File) {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return file.type;
}

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export async function createCommunityPostAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const body = String(formData.get("body") ?? "").trim();
  const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);

  if (!body && files.length === 0) {
    redirect("/community?status=invalid");
  }
  if (files.length > MAX_IMAGES) {
    redirect("/community?status=too_many_images");
  }
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      redirect("/community?status=file_too_large");
    }
    if (!ALLOWED_MIME.has(effectiveMime(f))) {
      redirect("/community?status=invalid_file");
    }
  }

  const supabase = await createClient();
  const { data: post, error: pErr } = await supabase
    .from("community_posts")
    .insert({ org_id: profile.org_id ?? null, author_id: profile.id, body })
    .select("id")
    .single();

  if (pErr || !post) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createCommunityPostAction] community_posts insert failed:", pErr?.message, pErr);
    }
    redirect("/community?status=post_save_failed");
  }

  const postId = post.id as string;
  let sort = 0;
  for (const file of files) {
    const mime = effectiveMime(file);
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = extFromMime(mime);
    const mediaPrefix = profile.org_id ? `${profile.org_id}/${profile.id}` : `global/${profile.id}`;
    const path = `${mediaPrefix}/${postId}/${randomUUID()}.${ext}`;
    const { error: uErr } = await supabase.storage.from("community-media").upload(path, buf, {
      contentType: mime,
      upsert: false,
    });
    if (uErr) {
      if (process.env.NODE_ENV === "development") {
        console.error("[createCommunityPostAction] storage upload failed:", uErr.message, uErr);
      }
      await supabase.from("community_posts").delete().eq("id", postId);
      redirect("/community?status=upload_error");
    }
    const { error: mErr } = await supabase.from("community_post_media").insert({
      post_id: postId,
      storage_path: path,
      sort_order: sort,
    });
    sort += 1;
    if (mErr) {
      if (process.env.NODE_ENV === "development") {
        console.error("[createCommunityPostAction] community_post_media insert failed:", mErr.message, mErr);
      }
      await supabase.storage.from("community-media").remove([path]);
      await supabase.from("community_posts").delete().eq("id", postId);
      redirect("/community?status=media_save_failed");
    }
  }

  revalidatePath("/community");
  redirect("/community?status=created");
}

export async function toggleCommunityLikeAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    redirect("/community?status=invalid");
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

  revalidatePath("/community");
  redirect("/community");
}

export async function followUserAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const followeeId = String(formData.get("followeeId") ?? "");
  if (!followeeId || followeeId === profile.id) {
    redirect("/community?status=invalid");
  }

  const supabase = await createClient();
  const { data: followee } = await supabase.from("users").select("org_id").eq("id", followeeId).maybeSingle();
  const samePartition =
    (Boolean(profile.org_id) && followee?.org_id === profile.org_id) ||
    (!profile.org_id && followee && followee.org_id === null);
  if (!samePartition) {
    redirect("/community?status=invalid");
  }

  const { data: already } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", profile.id)
    .eq("followee_id", followeeId)
    .maybeSingle();
  if (!already) {
    await supabase.from("community_follows").insert({ follower_id: profile.id, followee_id: followeeId });
  }

  if (String(formData.get("alsoNetwork") ?? "") === "1") {
    await tryInsertNetworkRequest(profile, followeeId, supabase);
  }

  revalidatePath("/community");
  revalidatePath(`/app/community/profile/${followeeId}`);
  redirect(`/app/community/profile/${followeeId}`);
}

export async function unfollowUserAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const followeeId = String(formData.get("followeeId") ?? "");
  if (!followeeId) {
    redirect("/community?status=invalid");
  }

  const supabase = await createClient();
  await supabase.from("community_follows").delete().eq("follower_id", profile.id).eq("followee_id", followeeId);

  revalidatePath("/community");
  revalidatePath(`/app/community/profile/${followeeId}`);
  redirect(`/app/community/profile/${followeeId}`);
}

function sameCommunityPartition(profile: { org_id: string | null }, peerOrgId: string | null | undefined) {
  return (
    (Boolean(profile.org_id) && peerOrgId === profile.org_id) ||
    (!profile.org_id && peerOrgId === null)
  );
}

type NetworkInsertResult =
  | { ok: true }
  | { ok: false; status: "network_schema" | "network_rls" | "network_blocked" | "network_error" };

async function tryInsertNetworkRequest(
  profile: UsersRow,
  addresseeId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<NetworkInsertResult> {
  if (addresseeId === profile.id) return { ok: false, status: "network_blocked" };

  const { data: peer, error: peerErr } = await supabase.from("users").select("org_id").eq("id", addresseeId).maybeSingle();
  if (peerErr || !peer) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[tryInsertNetworkRequest] peer load failed", peerErr?.message);
    }
    return { ok: false, status: "network_error" };
  }
  if (!sameCommunityPartition(profile, peer.org_id ?? null)) {
    return { ok: false, status: "network_blocked" };
  }

  const lower = profile.id < addresseeId ? profile.id : addresseeId;
  const upper = profile.id < addresseeId ? addresseeId : profile.id;

  const { data: edge, error: edgeErr } = await supabase
    .from("community_network_edges")
    .select("user_a")
    .eq("user_a", lower)
    .eq("user_b", upper)
    .maybeSingle();

  if (edgeErr?.code === "PGRST205" || /schema cache|not find the table/i.test(edgeErr?.message ?? "")) {
    return { ok: false, status: "network_schema" };
  }
  if (edgeErr && process.env.NODE_ENV === "development") {
    console.warn("[tryInsertNetworkRequest] edges select", edgeErr.message);
  }
  if (edge) return { ok: false, status: "network_blocked" };

  const { data: pending, error: pendingErr } = await supabase
    .from("community_network_requests")
    .select("id")
    .eq("requester_id", profile.id)
    .eq("addressee_id", addresseeId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingErr?.code === "PGRST205" || /schema cache|not find the table/i.test(pendingErr?.message ?? "")) {
    return { ok: false, status: "network_schema" };
  }
  if (pendingErr && process.env.NODE_ENV === "development") {
    console.warn("[tryInsertNetworkRequest] requests select", pendingErr.message);
  }
  if (pending) return { ok: false, status: "network_blocked" };

  const { error: insertErr } = await supabase.from("community_network_requests").insert({
    requester_id: profile.id,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (insertErr) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[tryInsertNetworkRequest] insert", insertErr.code, insertErr.message);
    }
    if (insertErr.code === "PGRST205" || /schema cache|not find the table/i.test(insertErr.message ?? "")) {
      return { ok: false, status: "network_schema" };
    }
    if (insertErr.code === "23505") {
      return { ok: false, status: "network_blocked" };
    }
    if (insertErr.code === "42501" || /rls|row-level security|permission denied/i.test(insertErr.message ?? "")) {
      return { ok: false, status: "network_rls" };
    }
    return { ok: false, status: "network_error" };
  }

  return { ok: true };
}

export async function sendNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const addresseeId = String(formData.get("addresseeId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), `/app/community/profile/${addresseeId}`);
  if (!addresseeId || addresseeId === profile.id) {
    redirect(`${redirectTo}?status=network_error`);
  }

  const supabase = await createClient();
  const result = await tryInsertNetworkRequest(profile, addresseeId, supabase);
  if (!result.ok) {
    redirect(`${redirectTo}?status=${result.status}`);
  }

  revalidatePath("/community");
  revalidatePath(`/app/community/profile/${addresseeId}`);
  revalidatePath(`/app/community/profile/${profile.id}`);
  redirect(`${redirectTo}?status=network_sent`);
}

export async function acceptNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), `/app/community/profile/${profile.id}`);
  if (!requestId) {
    redirect(`${redirectTo}?status=network_error`);
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("community_network_requests")
    .select("id, requester_id, addressee_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!row || row.addressee_id !== profile.id || row.status !== "pending") {
    redirect(`${redirectTo}?status=network_error`);
  }

  const { error } = await supabase.from("community_network_requests").update({ status: "accepted" }).eq("id", requestId);
  if (error) {
    redirect(`${redirectTo}?status=network_error`);
  }

  revalidatePath("/community");
  revalidatePath(`/app/community/profile/${row.requester_id}`);
  revalidatePath(`/app/community/profile/${profile.id}`);
  redirect(`${redirectTo}?status=network_accepted`);
}

export async function declineNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), `/app/community/profile/${profile.id}`);
  if (!requestId) {
    redirect(`${redirectTo}?status=network_error`);
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("community_network_requests")
    .select("id, addressee_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!row || row.addressee_id !== profile.id || row.status !== "pending") {
    redirect(`${redirectTo}?status=network_error`);
  }

  await supabase.from("community_network_requests").update({ status: "declined" }).eq("id", requestId);

  revalidatePath(`/app/community/profile/${profile.id}`);
  redirect(`${redirectTo}?status=network_declined`);
}

export async function cancelNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), `/app/community/profile/${profile.id}`);
  if (!requestId) {
    redirect(`${redirectTo}?status=network_error`);
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("community_network_requests")
    .select("id, requester_id, addressee_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!row || row.requester_id !== profile.id || row.status !== "pending") {
    redirect(`${redirectTo}?status=network_error`);
  }

  const { error: updateErr } = await supabase
    .from("community_network_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (updateErr) {
    redirect(`${redirectTo}?status=network_error`);
  }

  revalidatePath("/community");
  revalidatePath(`/app/community/profile/${profile.id}`);
  revalidatePath(`/app/community/profile/${row.addressee_id}`);
  redirect(`${redirectTo}?status=network_cancelled`);
}

export async function updateCommunityBioAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 2000);

  const supabase = await createClient();
  const { data: existingProf } = await supabase
    .from("community_profiles")
    .select("bio, last_connections_activity_seen_at")
    .eq("user_id", profile.id)
    .maybeSingle();
  const { error } = await supabase.from("community_profiles").upsert(
    {
      user_id: profile.id,
      bio,
      updated_at: new Date().toISOString(),
      last_connections_activity_seen_at: existingProf?.last_connections_activity_seen_at ?? null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    redirect("/app/community/profile/" + profile.id + "?status=error");
  }

  revalidatePath(`/app/community/profile/${profile.id}`);
  redirect("/app/community/profile/" + profile.id + "?status=bio_saved");
}

/** Call when the profile owner opens the Connections tab so follower / request badges clear. */
export async function markCommunityConnectionsSeenAction() {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
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
  if (error && process.env.NODE_ENV === "development") {
    console.error("[markCommunityConnectionsSeenAction]", error.message, error);
  }
  revalidatePath(`/app/community/profile/${profile.id}`);
}

export async function deleteCommunityPostAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    redirect("/community?status=invalid");
  }

  const supabase = await createClient();
  const { data: media } = await supabase.from("community_post_media").select("storage_path").eq("post_id", postId);
  const paths = (media ?? []).map((m) => m.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from("community-media").remove(paths);
  }

  const { error } = await supabase.from("community_posts").delete().eq("id", postId).eq("author_id", profile.id);
  if (error) {
    redirect("/community?status=error");
  }

  revalidatePath("/community");
  redirect("/community?status=deleted");
}

const MAX_COMMENT_CHARS = 2000;

function safeCommunityRedirect(raw: string | null | undefined, fallback: string) {
  const path = String(raw ?? "")
    .trim()
    .split("?")[0]
    .split("#")[0];
  if (path === "/community" || path === "/app/community") return "/community";
  if (/^\/app\/community\/profile\/[^/]+$/.test(path) && path.length < 200) return path;
  return fallback;
}

export async function createCommunityCommentAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const postId = String(formData.get("postId") ?? "").trim();
  const body = String(formData.get("comment") ?? "").trim().slice(0, MAX_COMMENT_CHARS);
  const redirectTo = safeCommunityRedirect(
    String(formData.get("redirectTo") ?? ""),
    "/community"
  );

  if (!postId || !body) {
    redirect(`${redirectTo}?status=comment_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("community_post_comments").insert({
    post_id: postId,
    author_id: profile.id,
    body,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createCommunityCommentAction] insert failed:", error.message, error);
    }
    redirect(`${redirectTo}?status=comment_error`);
  }

  revalidatePath("/community");
  if (redirectTo.startsWith("/app/community/profile/")) {
    const seg = redirectTo.replace("/app/community/profile/", "").split("/")[0];
    if (seg) revalidatePath(`/app/community/profile/${seg}`);
  }
  redirect(redirectTo);
}

export async function deleteCommunityCommentAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const commentId = String(formData.get("commentId") ?? "").trim();
  const redirectTo = safeCommunityRedirect(
    String(formData.get("redirectTo") ?? ""),
    "/community"
  );

  if (!commentId) {
    redirect(`${redirectTo}?status=comment_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", profile.id);

  if (error) {
    redirect(`${redirectTo}?status=comment_error`);
  }

  revalidatePath("/community");
  if (redirectTo.startsWith("/app/community/profile/")) {
    const seg = redirectTo.replace("/app/community/profile/", "").split("/")[0];
    if (seg) revalidatePath(`/app/community/profile/${seg}`);
  }
  redirect(redirectTo);
}
