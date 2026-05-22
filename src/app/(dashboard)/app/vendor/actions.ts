"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireVendorForApp } from "@/lib/auth/vendorPortal";
import { createClient } from "@/lib/supabase/server";
import { uploadVendorProductImage } from "@/lib/vendors/uploadVendorMedia";

function revalidateVendorPaths() {
  revalidatePath("/app/vendor");
  revalidatePath("/vendors");
  revalidatePath("/community");
}

export async function saveVendorProductAction(formData: FormData) {
  const { vendorId } = await requireVendorForApp();

  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const product_url = String(formData.get("product_url") ?? "").trim() || null;
  let image_url = String(formData.get("image_url") ?? "").trim() || null;
  const is_visible = formData.get("is_visible") === "on" || formData.get("is_visible") === "true";

  if (!name) {
    redirect("/app/vendor?tab=products&status=invalid");
  }

  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await uploadVendorProductImage(vendorId, imageFile);
    if ("error" in uploaded) {
      redirect("/app/vendor?tab=products&status=upload_error");
    }
    image_url = uploaded.url;
  }

  const supabase = await createClient();

  if (productId) {
    const { data: existing } = await supabase
      .from("vendor_products")
      .select("id, vendor_id, image_url")
      .eq("id", productId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (!existing) {
      redirect("/app/vendor?tab=products&status=not_found");
    }

    const { error } = await supabase
      .from("vendor_products")
      .update({
        name,
        description,
        product_url,
        image_url: image_url ?? existing.image_url,
        is_visible,
      })
      .eq("id", productId)
      .eq("vendor_id", vendorId);

    if (error) {
      redirect("/app/vendor?tab=products&status=error");
    }
  } else {
    const { error } = await supabase.from("vendor_products").insert({
      vendor_id: vendorId,
      name,
      description,
      product_url,
      image_url,
      is_visible,
    });

    if (error) {
      redirect("/app/vendor?tab=products&status=error");
    }
  }

  revalidateVendorPaths();
  redirect("/app/vendor?tab=products&status=saved");
}

export async function deleteVendorProductAction(formData: FormData) {
  const { vendorId } = await requireVendorForApp();
  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    redirect("/app/vendor?tab=products&status=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vendor_products").delete().eq("id", productId).eq("vendor_id", vendorId);

  if (error) {
    redirect("/app/vendor?tab=products&status=error");
  }

  revalidateVendorPaths();
  redirect("/app/vendor?tab=products&status=deleted");
}
