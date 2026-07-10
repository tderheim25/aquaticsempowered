"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadVendorLogo, uploadVendorProductImage } from "@/lib/vendors/uploadVendorMedia";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function reviewVendorApplicationAction(formData: FormData) {
  const profile = await requireSuperAdminConsole();
  const id = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (!id || !["approved", "rejected"].includes(decision)) {
    redirect(consoleSectionUrl("vendors", { status: "invalid" }));
  }
  const admin = createAdminClient();
  const { data: app } = await admin.from("vendor_applications").select("*").eq("id", id).maybeSingle();
  if (!app) redirect(consoleSectionUrl("vendors", { status: "invalid" }));

  let vendorId = app.vendor_id;
  if (decision === "approved" && !vendorId) {
    const slug = slugify(app.company_name) || `vendor-${id.slice(0, 8)}`;
    const { data: vendor, error: vErr } = await admin
      .from("vendors")
      .insert({
        name: app.company_name,
        slug,
        category: app.category,
        contact: { email: app.email, phone: app.phone, name: app.contact_name },
        listing_visible: true,
        website_url: app.website_url ?? null,
      })
      .select("id")
      .single();
    if (vErr || !vendor) redirect(consoleSectionUrl("vendors", { status: "error" }));
    vendorId = vendor.id;
  }

  await admin
    .from("vendor_applications")
    .update({
      status: decision,
      review_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
      vendor_id: vendorId,
    })
    .eq("id", id);

  if (decision === "approved" && vendorId) {
    const email = (app.email ?? "").trim().toLowerCase();
    if (email) {
      const { data: userRow } = await admin.from("users").select("id").ilike("email", email).maybeSingle();
      if (userRow?.id) {
        await admin
          .from("users")
          .update({
            role: "vendor",
            vendor_id: vendorId,
            org_id: null,
          })
          .eq("id", userRow.id);
      }
    }
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  redirect(consoleSectionUrl("vendors", { tab: "requests", status: decision }));
}

export async function updateVendorLogoAction(formData: FormData) {
  await requireSuperAdminConsole();
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const logoFile = formData.get("logo");
  if (!vendorId || !(logoFile instanceof File) || logoFile.size === 0) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "invalid" }));
  }

  const uploaded = await uploadVendorLogo(vendorId, logoFile);
  if ("error" in uploaded) redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));

  const admin = createAdminClient();
  const { error } = await admin.from("vendors").update({ logo_url: uploaded.url }).eq("id", vendorId);
  if (error) redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  redirect(consoleSectionUrl("vendors", { tab: "directory", status: "logo_updated" }));
}

export async function upsertVendorAction(formData: FormData) {
  await requireSuperAdminConsole();
  const id = String(formData.get("vendorId") ?? "").trim();
  const name = String(formData.get("company_name") ?? formData.get("name") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const category = String(formData.get("category") ?? "").trim() || null;
  const website_url = String(formData.get("website_url") ?? "").trim() || null;
  const tagline = String(formData.get("tagline") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const description = String(formData.get("message") ?? formData.get("description") ?? "").trim();
  const listing_visible = formData.get("listing_visible") === "on";
  const is_partner = formData.get("is_partner") === "on";
  const contact = { name: contact_name, email, phone };
  if (!name || !slug || !contact_name || !email) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "invalid" }));
  }

  const logoFile = formData.get("logo");
  const admin = createAdminClient();
  const payload = {
    name,
    slug,
    category,
    website_url,
    tagline,
    region,
    description,
    listing_visible,
    is_partner,
    contact,
  };

  if (id) {
    if (logoFile instanceof File && logoFile.size > 0) {
      const uploaded = await uploadVendorLogo(id, logoFile);
      if ("error" in uploaded) redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));
      const { error } = await admin.from("vendors").update({ ...payload, logo_url: uploaded.url }).eq("id", id);
      if (error) redirect(consoleSectionUrl("vendors", { status: "error" }));
    } else {
      const { error } = await admin.from("vendors").update(payload).eq("id", id);
      if (error) redirect(consoleSectionUrl("vendors", { status: "error" }));
    }
  } else {
    const { data: vendor, error } = await admin.from("vendors").insert(payload).select("id").single();
    if (error || !vendor) redirect(consoleSectionUrl("vendors", { status: "error" }));
    if (logoFile instanceof File && logoFile.size > 0) {
      const uploaded = await uploadVendorLogo(vendor.id, logoFile);
      if ("error" in uploaded) redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));
      const { error: logoErr } = await admin.from("vendors").update({ logo_url: uploaded.url }).eq("id", vendor.id);
      if (logoErr) redirect(consoleSectionUrl("vendors", { status: "error" }));
    }
  }
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  redirect(consoleSectionUrl("vendors", { tab: "directory", status: "saved" }));
}

export async function upsertVendorProductAction(formData: FormData) {
  await requireSuperAdminConsole();
  const vendorId = String(formData.get("vendorId") ?? "");
  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const product_url = String(formData.get("product_url") ?? "").trim() || null;
  let image_url = String(formData.get("image_url") ?? "").trim() || null;
  const is_visible = formData.get("is_visible") === "on";
  if (!vendorId || !name) redirect(consoleSectionUrl("vendors", { tab: "products", status: "invalid" }));

  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await uploadVendorProductImage(vendorId, imageFile);
    if ("error" in uploaded) redirect(consoleSectionUrl("vendors", { tab: "products", status: "error" }));
    image_url = uploaded.url;
  }

  const admin = createAdminClient();
  const payload = { vendor_id: vendorId, name, description, product_url, image_url, is_visible };
  if (productId) {
    const { error } = await admin.from("vendor_products").update(payload).eq("id", productId);
    if (error) redirect(consoleSectionUrl("vendors", { tab: "products", status: "error" }));
  } else {
    const { error } = await admin.from("vendor_products").insert(payload);
    if (error) redirect(consoleSectionUrl("vendors", { tab: "products", status: "error" }));
  }
  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  redirect(consoleSectionUrl("vendors", { tab: "products", status: "product_saved" }));
}

export async function deleteVendorProductAction(formData: FormData) {
  await requireSuperAdminConsole();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) redirect(consoleSectionUrl("vendors", { tab: "products", status: "invalid" }));

  const admin = createAdminClient();
  const { error } = await admin.from("vendor_products").delete().eq("id", productId);
  if (error) redirect(consoleSectionUrl("vendors", { tab: "products", status: "error" }));

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  redirect(consoleSectionUrl("vendors", { tab: "products", status: "product_deleted" }));
}

export async function deleteVendorAction(formData: FormData) {
  await requireSuperAdminConsole();
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  if (!vendorId) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: vendor } = await admin.from("vendors").select("id, name").eq("id", vendorId).maybeSingle();
  if (!vendor) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "invalid" }));
  }

  const { data: staffRole } = await admin.from("app_roles").select("id").eq("slug", "staff").maybeSingle();
  const { error: userErr } = await admin
    .from("users")
    .update({
      vendor_id: null,
      role: "staff",
      ...(staffRole?.id ? { app_role_id: staffRole.id } : {}),
    })
    .eq("vendor_id", vendorId);

  if (userErr) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));
  }

  const { error } = await admin.from("vendors").delete().eq("id", vendorId);
  if (error) {
    redirect(consoleSectionUrl("vendors", { tab: "directory", status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/vendors");
  revalidatePath("/app/vendor");
  redirect(consoleSectionUrl("vendors", { tab: "directory", status: "vendor_deleted" }));
}
