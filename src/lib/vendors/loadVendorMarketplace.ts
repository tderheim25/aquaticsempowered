import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";
import { createClient } from "@/lib/supabase/server";

export type MarketplaceProduct = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  product_url: string | null;
  vendor: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    category: string | null;
    tagline: string | null;
    website_url: string | null;
    description: string;
  };
};

export type MarketplaceVendor = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
};

/** Vendor directory entry with nested products (community marketplace list). */
export type MarketplaceVendorGroup = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  category: string | null;
  tagline: string | null;
  website_url: string | null;
  description: string;
  products: MarketplaceProduct[];
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  vendors: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    category: string | null;
    tagline: string | null;
    website_url: string | null;
    description: string | null;
    listing_visible: boolean;
  };
};

export function groupMarketplaceByVendor(
  products: MarketplaceProduct[],
  directoryVendors?: Array<{
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    category: string | null;
    tagline: string | null;
    website_url: string | null;
    description: string | null;
  }>
): MarketplaceVendorGroup[] {
  const map = new Map<string, MarketplaceVendorGroup>();

  for (const v of directoryVendors ?? []) {
    map.set(v.id, {
      id: v.id,
      name: v.name,
      slug: v.slug,
      logo_url: resolveVendorImageUrl(v.logo_url),
      category: v.category,
      tagline: v.tagline,
      website_url: v.website_url,
      description: v.description ?? "",
      products: [],
    });
  }

  for (const product of products) {
    let group = map.get(product.vendor.id);
    if (!group) {
      group = {
        id: product.vendor.id,
        name: product.vendor.name,
        slug: product.vendor.slug,
        logo_url: product.vendor.logo_url,
        category: product.vendor.category,
        tagline: product.vendor.tagline,
        website_url: product.vendor.website_url,
        description: product.vendor.description,
        products: [],
      };
      map.set(product.vendor.id, group);
    }
    group.products.push(product);
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadVendorMarketplace(supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());

  const [{ data: vendors }, { data: productRows }] = await Promise.all([
    client
      .from("vendors")
      .select("id, name, slug, logo_url, category, tagline, website_url, description")
      .eq("listing_visible", true)
      .order("name"),
    client
      .from("vendor_products")
      .select(
        `id, name, description, image_url, product_url,
         vendors!inner ( id, name, slug, logo_url, category, tagline, website_url, description, listing_visible )`,
      )
      .eq("is_visible", true)
      .eq("vendors.listing_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const rows = (productRows ?? []) as Array<Omit<ProductRow, "vendors"> & { vendors: ProductRow["vendors"] | ProductRow["vendors"][] }>;

  const products: MarketplaceProduct[] = rows
    .map((row) => {
      const vendor = Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
      return vendor ? { ...row, vendors: vendor } : null;
    })
    .filter((row): row is ProductRow => row !== null && row.vendors.listing_visible)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      image_url: resolveVendorImageUrl(row.image_url),
      product_url: row.product_url,
      vendor: {
        id: row.vendors.id,
        name: row.vendors.name,
        slug: row.vendors.slug,
        logo_url: resolveVendorImageUrl(row.vendors.logo_url),
        category: row.vendors.category,
        tagline: row.vendors.tagline,
        website_url: row.vendors.website_url,
        description: row.vendors.description ?? "",
      },
    }));

  const loopVendors: MarketplaceVendor[] = (vendors ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    logo_url: resolveVendorImageUrl(v.logo_url),
  }));

  const vendorGroups = groupMarketplaceByVendor(products, vendors ?? []);

  return { products, loopVendors, vendorGroups };
}
