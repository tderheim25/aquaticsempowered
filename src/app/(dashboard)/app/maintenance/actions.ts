"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrg } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { taskIdSchema, taskSchema, taskStatusOnlySchema } from "@/lib/validations/maintenance";

function optionalText(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

export async function createTaskAction(formData: FormData) {
  await requireViewAccess("maintenance");
  const profile = await requireOrg();

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: optionalText(formData.get("description")),
    status: String(formData.get("status") ?? "open"),
    priority: String(formData.get("priority") ?? "medium"),
    category: String(formData.get("category") ?? "other"),
    pool_label: optionalText(formData.get("pool_label")),
    assigned_to: optionalText(formData.get("assigned_to")) ?? null,
    due_date: optionalText(formData.get("due_date")) ?? null,
  };

  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/maintenance?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_tasks").insert({
    org_id: profile.org_id!,
    title: parsed.data.title,
    description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    category: parsed.data.category,
    pool_label: parsed.data.pool_label?.trim() ? parsed.data.pool_label.trim() : null,
    assigned_to: parsed.data.assigned_to,
    due_date: parsed.data.due_date,
    created_by: profile.id,
  });

  if (error) {
    redirect("/app/maintenance?status=error");
  }

  revalidatePath("/app/maintenance");
  redirect("/app/maintenance?status=created");
}

export async function updateTaskAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idRaw = String(formData.get("taskId") ?? "");
  const idParsed = taskIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/maintenance?status=error");
  }

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: optionalText(formData.get("description")),
    status: String(formData.get("status") ?? "open"),
    priority: String(formData.get("priority") ?? "medium"),
    category: String(formData.get("category") ?? "other"),
    pool_label: optionalText(formData.get("pool_label")),
    assigned_to: optionalText(formData.get("assigned_to")) ?? null,
    due_date: optionalText(formData.get("due_date")) ?? null,
  };

  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/app/maintenance?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("maintenance_tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      category: parsed.data.category,
      pool_label: parsed.data.pool_label?.trim() ? parsed.data.pool_label.trim() : null,
      assigned_to: parsed.data.assigned_to,
      due_date: parsed.data.due_date,
    })
    .eq("id", idParsed.data.id);

  if (error) {
    redirect("/app/maintenance?status=error");
  }

  revalidatePath("/app/maintenance");
  redirect("/app/maintenance?status=updated");
}

export async function updateTaskStatusAction(formData: FormData): Promise<{ ok: true } | { ok: false }> {
  await requireViewAccess("maintenance");
  await requireOrg();

  const raw = {
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  };
  const parsed = taskStatusOnlySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_tasks").update({ status: parsed.data.status }).eq("id", parsed.data.id);

  if (error) {
    return { ok: false };
  }

  revalidatePath("/app/maintenance");
  return { ok: true };
}

export async function deleteTaskAction(formData: FormData) {
  await requireViewAccess("maintenance");
  await requireOrg();

  const idRaw = String(formData.get("id") ?? "");
  const idParsed = taskIdSchema.safeParse({ id: idRaw });
  if (!idParsed.success) {
    redirect("/app/maintenance?status=error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_tasks").delete().eq("id", idParsed.data.id);

  if (error) {
    redirect("/app/maintenance?status=error");
  }

  revalidatePath("/app/maintenance");
  redirect("/app/maintenance?status=deleted");
}
