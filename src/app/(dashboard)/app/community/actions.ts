"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUsersRowWithAdminFallback, requireProfileForApp, type UsersRow } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import {
  canViewCommunityProfile,
  resolveCommunityViewer,
} from "@/lib/community/communityPartition";
import { insertCommunityFollow, isFollowingCommunityUser } from "@/lib/community/communityFollows";
import { communityProfilePath, normalizeCommunityProfilePath } from "@/lib/profile/paths";
import { optimizeUploadImage } from "@/lib/images/optimizeUploadImage";
import { getSuperAdminPortalPath } from "@/lib/auth/superAdminPortalConstants";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Guard against double-clicks / duplicate form submissions.
  const dedupeSince = new Date(Date.now() - 60_000).toISOString();
  const { data: recentDuplicate } = await supabase
    .from("community_posts")
    .select("id")
    .eq("author_id", profile.id)
    .eq("body", body)
    .gte("created_at", dedupeSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentDuplicate?.id) {
    revalidatePath("/community");
    redirect("/community?status=created");
  }

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
    const raw = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeUploadImage(raw, mime);
    const mediaPrefix = profile.org_id ? `${profile.org_id}/${profile.id}` : `global/${profile.id}`;
    const path = `${mediaPrefix}/${postId}/${randomUUID()}.${optimized.ext}`;
    const { error: uErr } = await supabase.storage.from("community-media").upload(path, optimized.buffer, {
      contentType: optimized.mime,
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

const JOB_EMPLOYMENT_TYPES = new Set(["full_time", "part_time", "seasonal", "contract", "internship"]);

export async function createCommunityJobAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();

  const title = String(formData.get("title") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const employmentType = String(formData.get("employment_type") ?? "full_time").trim();
  const description = String(formData.get("description") ?? "").trim();
  const applyUrl = String(formData.get("apply_url") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  if (!title || description.length < 10) {
    redirect("/community?tab=jobs&status=job_invalid");
  }
  if (!JOB_EMPLOYMENT_TYPES.has(employmentType)) {
    redirect("/community?tab=jobs&status=job_invalid");
  }
  if (applyUrl) {
    try {
      const parsed = new URL(applyUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        redirect("/community?tab=jobs&status=job_invalid_url");
      }
    } catch {
      redirect("/community?tab=jobs&status=job_invalid_url");
    }
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    redirect("/community?tab=jobs&status=job_invalid_email");
  }

  const viewer = await resolveCommunityViewer(profile);
  const payload = {
    org_id: viewer.org_id,
    author_id: profile.id,
    title,
    company_name: companyName,
    location,
    employment_type: employmentType,
    description,
    apply_url: applyUrl || null,
    contact_email: contactEmail || null,
  };

  const supabase = await createClient();
  let { error } = await supabase.from("community_job_posts").insert(payload);
  if (error) {
    const admin = createAdminClient();
    ({ error } = await admin.from("community_job_posts").insert(payload));
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createCommunityJobAction] insert failed:", error.message, error);
    }
    redirect("/community?tab=jobs&status=job_save_failed");
  }

  revalidatePath("/community");
  revalidatePath(getSuperAdminPortalPath());
  redirect("/community?tab=jobs&status=job_created");
}

export async function deleteCommunityJobAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) {
    redirect("/community?tab=jobs&status=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_job_posts")
    .delete()
    .eq("id", jobId)
    .eq("author_id", profile.id);

  if (error) {
    redirect("/community?tab=jobs&status=error");
  }

  revalidatePath("/community");
  redirect("/community?tab=jobs&status=job_deleted");
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
  const viewer = await resolveCommunityViewer(profile);
  const followeeUser = await getUsersRowWithAdminFallback(followeeId);
  if (!followeeUser) {
    redirect("/community?status=invalid");
  }
  const mayFollow = await canViewCommunityProfile(supabase, viewer, followeeUser);
  if (!mayFollow) {
    redirect(communityProfilePath(followeeId, "follow_blocked"));
  }

  const already = await isFollowingCommunityUser(supabase, profile.id, followeeId);
  if (!already) {
    const inserted = await insertCommunityFollow(supabase, profile.id, followeeId);
    if (!inserted.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[followUserAction] insert", inserted.code, inserted.message);
      }
      redirect(communityProfilePath(followeeId, "follow_error"));
    }
  }

  if (String(formData.get("alsoNetwork") ?? "") === "1") {
    await tryInsertNetworkRequest(profile, followeeId, supabase);
  }

  revalidatePath("/community");
  revalidatePath(communityProfilePath(followeeId));
  redirect(communityProfilePath(followeeId));
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
  revalidatePath(communityProfilePath(followeeId));
  redirect(communityProfilePath(followeeId));
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

  const peer = await getUsersRowWithAdminFallback(addresseeId);
  if (!peer) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[tryInsertNetworkRequest] peer not found");
    }
    return { ok: false, status: "network_error" };
  }
  const viewer = await resolveCommunityViewer(profile);
  const mayConnect = await canViewCommunityProfile(supabase, viewer, peer);
  if (!mayConnect) {
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
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), communityProfilePath(addresseeId));
  if (!addresseeId || addresseeId === profile.id) {
    redirect(`${redirectTo}?status=network_error`);
  }

  const supabase = await createClient();
  const result = await tryInsertNetworkRequest(profile, addresseeId, supabase);
  if (!result.ok) {
    redirect(`${redirectTo}?status=${result.status}`);
  }

  revalidatePath("/community");
  revalidatePath(communityProfilePath(addresseeId));
  revalidatePath(communityProfilePath(profile.id));
  redirect(`${redirectTo}?status=network_sent`);
}

export async function acceptNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), communityProfilePath(profile.id));
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
  revalidatePath(communityProfilePath(row.requester_id));
  revalidatePath(communityProfilePath(profile.id));
  redirect(`${redirectTo}?status=network_accepted`);
}

export async function declineNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), communityProfilePath(profile.id));
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

  revalidatePath(communityProfilePath(profile.id));
  redirect(`${redirectTo}?status=network_declined`);
}

export async function cancelNetworkRequestAction(formData: FormData) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const requestId = String(formData.get("requestId") ?? "");
  const redirectTo = safeCommunityRedirect(String(formData.get("redirectTo") ?? ""), communityProfilePath(profile.id));
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
  revalidatePath(communityProfilePath(profile.id));
  revalidatePath(communityProfilePath(row.addressee_id));
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
    redirect(communityProfilePath(profile.id, "error"));
  }

  revalidatePath(communityProfilePath(profile.id));
  redirect(communityProfilePath(profile.id, "bio_saved"));
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
  revalidatePath(communityProfilePath(profile.id));
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
  const normalized = normalizeCommunityProfilePath(path);
  if (normalized && normalized.length < 200) return normalized;
  return fallback;
}

function revalidateCommunityProfileFromRedirect(redirectTo: string) {
  revalidatePath("/community");
  const profilePath = normalizeCommunityProfilePath(redirectTo.split("?")[0]);
  if (profilePath) revalidatePath(profilePath);
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

  revalidateCommunityProfileFromRedirect(redirectTo);
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

  revalidateCommunityProfileFromRedirect(redirectTo);
  redirect(redirectTo);
}
