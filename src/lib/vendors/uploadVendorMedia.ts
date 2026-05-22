import { randomUUID } from "crypto";

import {
  optimizeUploadImage,
  VENDOR_LOGO_OPTIMIZE,
  VENDOR_PRODUCT_OPTIMIZE,
} from "@/lib/images/optimizeUploadImage";
import { createAdminClient } from "@/lib/supabase/admin";
import { vendorMediaPublicUrl } from "@/lib/vendors/publicMediaUrl";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function effectiveMime(file: File) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (file.type && ALLOWED.has(file.type)) return file.type;
  return file.type || "image/jpeg";
}

async function uploadOptimizedVendorImage(
  folder: "logos" | "products",
  vendorId: string,
  file: File,
) {
  if (file.size === 0 || file.size > MAX_BYTES) {
    return { error: "invalid_file" as const };
  }
  const mime = effectiveMime(file);
  if (!ALLOWED.has(mime)) {
    return { error: "invalid_file" as const };
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const optimizeOpts = folder === "logos" ? VENDOR_LOGO_OPTIMIZE : VENDOR_PRODUCT_OPTIMIZE;
  const optimized = await optimizeUploadImage(raw, mime, optimizeOpts);

  const admin = createAdminClient();
  const path = `${folder}/${vendorId}/${randomUUID()}.${optimized.ext}`;

  const { error } = await admin.storage.from("vendor-media").upload(path, optimized.buffer, {
    contentType: optimized.mime,
    upsert: false,
  });

  if (error) return { error: "upload_failed" as const };

  return { url: vendorMediaPublicUrl(path), storagePath: path };
}

/** Upload a vendor logo; returns public HTTPS URL stored in `vendors.logo_url`. */
export async function uploadVendorLogo(vendorId: string, file: File) {
  return uploadOptimizedVendorImage("logos", vendorId, file);
}

/** Upload a product image; returns public HTTPS URL stored in `vendor_products.image_url`. */
export async function uploadVendorProductImage(vendorId: string, file: File) {
  return uploadOptimizedVendorImage("products", vendorId, file);
}
