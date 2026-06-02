"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { accountSettingsPath, communityProfilePath, normalizeCommunityProfilePath } from "@/lib/profile/paths";
import { createClient } from "@/lib/supabase/server";

function revalidateAccount(userId: string) {
  revalidatePath(accountSettingsPath());
  revalidatePath("/app");
  revalidatePath(communityProfilePath(userId));
}

function redirectAfterAccountAction(userId: string, redirectTo: string | null | undefined, status: string) {
  const normalized = normalizeCommunityProfilePath(String(redirectTo ?? "").split("?")[0]);
  if (normalized) {
    redirect(`${normalized}?status=${encodeURIComponent(status)}`);
  }
  redirect(accountSettingsPath(status));
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
  const redirectTo = String(formData.get("redirectTo") ?? "");
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
    redirectAfterAccountAction(profile.id, redirectTo, "error");
  }

  await supabase.auth.updateUser({
    data: {
      full_name: fullName || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    },
  });

  revalidateAccount(profile.id);
  redirectAfterAccountAction(profile.id, redirectTo, "saved");
}

export async function changePasswordAction(formData: FormData) {
  const profile = await requireProfileForApp();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(accountSettingsPath("password_too_short"));
  }
  if (newPassword !== confirmPassword) {
    redirect(accountSettingsPath("password_mismatch"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[changePasswordAction]", error.message);
    }
    redirect(accountSettingsPath("password_error"));
  }

  revalidateAccount(profile.id);
  redirect(accountSettingsPath("password_saved"));
}

export async function uploadUserAvatarAction(formData: FormData) {
  const profile = await requireProfileForApp();
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    redirectAfterAccountAction(profile.id, redirectTo, "invalid_file");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    redirectAfterAccountAction(profile.id, redirectTo, "file_too_large");
  }
  const mime = effectiveMime(file);
  if (!ALLOWED_MIME.has(mime)) {
    redirectAfterAccountAction(profile.id, redirectTo, "invalid_file");
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
    redirectAfterAccountAction(profile.id, redirectTo, "upload_error");
  }

  const { error: dbErr } = await supabase.from("users").update({ avatar_path: path }).eq("id", profile.id);
  if (dbErr) {
    await supabase.storage.from("avatars").remove([path]);
    redirectAfterAccountAction(profile.id, redirectTo, "error");
  }

  if (oldPath && oldPath !== path) {
    await supabase.storage.from("avatars").remove([oldPath]);
  }

  revalidateAccount(profile.id);
  redirectAfterAccountAction(profile.id, redirectTo, "avatar_saved");
}

export async function removeUserAvatarAction(formData: FormData) {
  const profile = await requireProfileForApp();
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const supabase = await createClient();
  const { data: row } = await supabase.from("users").select("avatar_path").eq("id", profile.id).maybeSingle();
  if (row?.avatar_path) {
    await supabase.storage.from("avatars").remove([row.avatar_path]);
  }
  await supabase.from("users").update({ avatar_path: null }).eq("id", profile.id);
  revalidateAccount(profile.id);
  redirectAfterAccountAction(profile.id, redirectTo, "avatar_removed");
}
