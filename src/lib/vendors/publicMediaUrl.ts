/** Public URL for objects in the `vendor-media` bucket. */
export function vendorMediaPublicUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return storagePath;
  const normalized = storagePath.replace(/^\//, "");
  return `${base}/storage/v1/object/public/vendor-media/${normalized}`;
}

export function isVendorMediaStoragePath(url: string | null | undefined) {
  if (!url) return false;
  return !url.startsWith("http://") && !url.startsWith("https://");
}

export function resolveVendorImageUrl(url: string | null | undefined) {
  if (!url) return null;
  if (isVendorMediaStoragePath(url)) return vendorMediaPublicUrl(url);
  return url;
}
