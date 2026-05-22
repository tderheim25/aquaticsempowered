"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export async function submitVendorApplicationAction(formData: FormData) {
  const company_name = String(formData.get("company_name") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const website_url = String(formData.get("website_url") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!company_name || !contact_name || !email || !message) {
    redirect("/vendors?apply=invalid#vendor-apply");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("vendor_applications").insert({
    company_name,
    contact_name,
    email,
    phone,
    website_url,
    category,
    message,
    status: "pending",
  });

  if (error) {
    redirect("/vendors?apply=error#vendor-apply");
  }

  redirect("/vendors?apply=submitted#vendor-apply");
}
