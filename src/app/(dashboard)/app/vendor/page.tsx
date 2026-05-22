import { VendorDashboardPageShell } from "@/components/vendor/VendorDashboardPageShell";
import { VendorDashboardTabs } from "@/components/vendor/VendorDashboardTabs";
import { VendorInquiriesInbox } from "@/components/vendor/VendorInquiriesInbox";
import { VendorProductsManager, type VendorProductItem } from "@/components/vendor/VendorProductsManager";
import { requireVendorForApp } from "@/lib/auth/vendorPortal";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import { vendorPublicProfilePath } from "@/lib/vendors/paths";

export const metadata = {
  title: "Vendor dashboard | Aquatics Empowered",
};

export default async function VendorDashboardPage() {
  await requireViewAccess("vendor_portal");
  const { vendor, vendorId } = await requireVendorForApp();
  const supabase = await createClient();

  const { data: productRows } = await supabase
    .from("vendor_products")
    .select("id, name, description, image_url, product_url, is_visible, sort_order, created_at")
    .eq("vendor_id", vendorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const products = (productRows ?? []) as VendorProductItem[];

  return (
    <VendorDashboardPageShell
      vendorName={vendor.name}
      tagline={vendor.tagline}
      category={vendor.category}
      listingVisible={vendor.listing_visible}
      publicProfileHref={vendor.slug ? vendorPublicProfilePath(vendor.slug) : null}
      websiteUrl={vendor.website_url}
    >
      <VendorDashboardTabs
        inquiries={<VendorInquiriesInbox vendorId={vendorId} />}
        products={<VendorProductsManager products={products} />}
      />
    </VendorDashboardPageShell>
  );
}
