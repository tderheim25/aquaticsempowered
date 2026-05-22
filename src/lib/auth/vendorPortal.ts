import { redirect } from "next/navigation";

import { getUsersRowWithAdminFallback, requireProfileForApp } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type VendorRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  listing_visible: boolean;
};

export async function getVendorForUser(userId: string): Promise<VendorRow | null> {
  const supabase = await createClient();
  const { data: userRow } = await supabase.from("users").select("vendor_id, role").eq("id", userId).maybeSingle();
  if (!userRow?.vendor_id) return null;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, slug, category, tagline, description, website_url, logo_url, listing_visible")
    .eq("id", userRow.vendor_id)
    .maybeSingle();

  return vendor as VendorRow | null;
}

/** Requires vendor role + linked approved vendor record. */
export async function requireVendorForApp() {
  const profile = await requireProfileForApp();
  if (profile.role !== "vendor") {
    redirect("/app/forbidden");
  }

  const vendorId = profile.vendor_id ?? null;
  if (!vendorId) {
    redirect("/app/vendor/pending");
  }

  const vendor = await getVendorForUser(profile.id);
  if (!vendor) {
    redirect("/app/vendor/pending");
  }

  return { profile, vendor, vendorId };
}

/** For API routes — returns null when unauthorized (no redirect). */
export async function getVendorSessionForApi() {
  const { getSessionUser } = await import("@/lib/auth/rbac");
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!profile || profile.role !== "vendor") return null;

  const vendorId = profile.vendor_id ?? null;
  if (!vendorId) return null;

  const vendor = await getVendorForUser(profile.id);
  if (!vendor) return null;

  return { profile, vendor, vendorId };
}
