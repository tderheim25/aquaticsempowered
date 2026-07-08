"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { syncOwnerAppRoleForOrg } from "@/lib/auth/planOwnerRoles";
import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode, TicketStatus } from "@/types/database";

// Vendor actions live in ./vendorActions (keeps sharp/upload code off this bundle).
// Files marked "use server" can only export async functions directly, so consumers
// must import vendor actions from "@/app/private/ae-console/platform/vendorActions".

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function updateSupportTicketAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as TicketStatus;
  const valid: TicketStatus[] = ["open", "pending", "resolved", "closed"];
  if (!id || !valid.includes(status)) {
    redirect(consoleSectionUrl("support", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin.from("support_tickets").update({ status }).eq("id", id);
  if (error) redirect(consoleSectionUrl("support", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("support", { status: "updated" }));
}

export async function upsertTrainingCourseAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? title));
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "General").trim();
  const is_published = formData.get("is_published") === "on";
  if (!title || !slug) redirect(consoleSectionUrl("training", { status: "invalid" }));

  const admin = createAdminClient();
  const payload = {
    title,
    slug,
    description,
    category,
    is_published,
    published_at: is_published ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await admin.from("training_courses").update(payload).eq("id", id);
    if (error) redirect(consoleSectionUrl("training", { status: "error" }));
  } else {
    const { error } = await admin.from("training_courses").insert(payload);
    if (error) redirect(consoleSectionUrl("training", { status: "error" }));
  }
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app/training-cpo");
  redirect(consoleSectionUrl("training", { status: "saved" }));
}

export async function addTrainingVideoAction(formData: FormData) {
  await requireSuperAdminConsole();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim() || null;
  const duration_seconds = parseInt(String(formData.get("duration_seconds") ?? ""), 10) || null;
  if (!courseId || !title) redirect(consoleSectionUrl("training", { status: "invalid" }));

  const admin = createAdminClient();
  const { error } = await admin.from("training_course_videos").insert({
    course_id: courseId,
    title,
    video_url,
    duration_seconds,
  });
  if (error) redirect(consoleSectionUrl("training", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app/training-cpo");
  redirect(consoleSectionUrl("training", { status: "video_added" }));
}

export async function moderateJobPostAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("jobId") ?? "");
  const status = String(formData.get("status") ?? "");
  const is_promoted = formData.get("is_promoted") === "on";
  if (!id || !["active", "blocked", "closed"].includes(status)) {
    redirect(consoleSectionUrl("jobs", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin.from("community_job_posts").update({ status, is_promoted }).eq("id", id);
  if (error) redirect(consoleSectionUrl("jobs", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/community");
  redirect(consoleSectionUrl("jobs", { status: "updated" }));
}

export async function moderateCommunityPostAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();
  const id = String(formData.get("postId") ?? "");
  const moderation_status = String(formData.get("moderation_status") ?? "");
  const moderation_note = String(formData.get("moderation_note") ?? "").trim() || null;
  if (!id || !["visible", "hidden", "blocked"].includes(moderation_status)) {
    redirect(consoleSectionUrl("community", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("community_posts")
    .update({
      moderation_status,
      moderation_note,
      moderated_at: new Date().toISOString(),
      moderated_by: profile.id,
    })
    .eq("id", id);
  if (error) redirect(consoleSectionUrl("community", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/community");
  redirect(consoleSectionUrl("community", { status: "updated" }));
}

export async function moderateCommunityCommentAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();
  const id = String(formData.get("commentId") ?? "");
  const moderation_status = String(formData.get("moderation_status") ?? "");
  if (!id || !["visible", "hidden", "blocked"].includes(moderation_status)) {
    redirect(consoleSectionUrl("community", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("community_post_comments")
    .update({
      moderation_status,
      moderated_at: new Date().toISOString(),
      moderated_by: profile.id,
    })
    .eq("id", id);
  if (error) redirect(consoleSectionUrl("community", { status: "error" }));
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/community");
  redirect(consoleSectionUrl("community", { status: "updated" }));
}

export async function upsertAdPlacementAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("placementId") ?? "").trim();
  const slot_key = String(formData.get("slot_key") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const target_url = String(formData.get("target_url") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";
  const sort_order = parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  if (!slot_key) redirect(consoleSectionUrl("ads", { status: "invalid" }));

  const admin = createAdminClient();
  const payload = { slot_key, title, image_url, target_url, is_active, sort_order };
  if (id) {
    const { error } = await admin.from("ad_placements").update(payload).eq("id", id);
    if (error) redirect(consoleSectionUrl("ads", { status: "error" }));
  } else {
    const { error } = await admin.from("ad_placements").insert(payload);
    if (error) redirect(consoleSectionUrl("ads", { status: "error" }));
  }
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/");
  redirect(consoleSectionUrl("ads", { status: "saved" }));
}

export async function updateOrgPlanAction(formData: FormData) {
  await requireSuperAdminConsole();
  const orgId = String(formData.get("orgId") ?? "");
  const plan_code = String(formData.get("plan_code") ?? "") as PlanCode;
  const valid: PlanCode[] = ["free", "essential", "pro", "enterprise"];
  if (!orgId || !valid.includes(plan_code)) {
    redirect(consoleSectionUrl("billing", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update({ plan_code }).eq("id", orgId);
  if (error) redirect(consoleSectionUrl("billing", { status: "error" }));
  try {
    await syncOwnerAppRoleForOrg(orgId);
  } catch (syncErr) {
    captureException(syncErr, { step: "update_org_plan_sync_roles", orgId });
  }
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("billing", { status: "updated" }));
}
