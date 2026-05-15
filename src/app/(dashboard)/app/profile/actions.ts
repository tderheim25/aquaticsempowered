"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { communityProfilePath } from "@/lib/profile/paths";
import { createClient } from "@/lib/supabase/server";

function revalidateSelfProfile(userId: string) {
  revalidatePath(communityProfilePath(userId));
  revalidatePath("/app");
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

function effectiveMime(file: File) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  return file.type;
}

export async function updateUserProfileAction(formData: FormData) {
  const profile = await requireProfileForApp();
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 80);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 80);
  const fullName = `${firstName} ${lastName}`.trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
    })
    .eq("id", profile.id);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateUserProfileAction]", error.message, error);
    }
    redirect(communityProfilePath(profile.id, "error"));
  }

  await supabase.auth.updateUser({
    data: {
      full_name: fullName || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    },
  });

  revalidateSelfProfile(profile.id);
  redirect(communityProfilePath(profile.id, "saved"));
}

export async function uploadUserAvatarAction(formData: FormData) {
  const profile = await requireProfileForApp();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    redirect(communityProfilePath(profile.id, "invalid_file"));
  }
  if (file.size > MAX_AVATAR_BYTES) {
    redirect(communityProfilePath(profile.id, "file_too_large"));
  }
  const mime = effectiveMime(file);
  if (!ALLOWED_MIME.has(mime)) {
    redirect(communityProfilePath(profile.id, "invalid_file"));
  }

  const supabase = await createClient();
  const ext = extFromMime(mime);
  const path = `${profile.id}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { data: existing } = await supabase.from("users").select("avatar_path").eq("id", profile.id).maybeSingle();
  const oldPath = existing?.avatar_path;

  const { error: uErr } = await supabase.storage.from("avatars").upload(path, buf, {
    contentType: mime,
    upsert: false,
  });
  if (uErr) {
    if (process.env.NODE_ENV === "development") {
      console.error("[uploadUserAvatarAction] upload", uErr.message, uErr);
    }
    redirect(communityProfilePath(profile.id, "upload_error"));
  }

  const { error: dbErr } = await supabase.from("users").update({ avatar_path: path }).eq("id", profile.id);
  if (dbErr) {
    await supabase.storage.from("avatars").remove([path]);
    redirect(communityProfilePath(profile.id, "error"));
  }

  if (oldPath && oldPath !== path) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  revalidateSelfProfile(profile.id);
  redirect(communityProfilePath(profile.id, "avatar_saved"));
}

export async function removeUserAvatarAction() {
  const profile = await requireProfileForApp();
  const supabase = await createClient();
  const { data: row } = await supabase.from("users").select("avatar_path").eq("id", profile.id).maybeSingle();
  if (row?.avatar_path) {
    await supabase.storage.from("avatars").remove([row.avatar_path]);
  }
  await supabase.from("users").update({ avatar_path: null }).eq("id", profile.id);
  revalidateSelfProfile(profile.id);
  redirect(communityProfilePath(profile.id, "avatar_removed"));
}
