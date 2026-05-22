import type { SupabaseClient } from "@supabase/supabase-js";

import {
  loadVendorMarketplace,
  type MarketplaceVendorGroup,
} from "@/lib/vendors/loadVendorMarketplace";

export type LoadedCommunityMarketplace = {
  marketplaceError: boolean;
  vendors: MarketplaceVendorGroup[];
  productCount: number;
  vendorCount: number;
};

export async function loadCommunityMarketplaceData(
  supabase: SupabaseClient
): Promise<LoadedCommunityMarketplace> {
  try {
    const { products, vendorGroups } = await loadVendorMarketplace(supabase);
    return {
      marketplaceError: false,
      vendors: vendorGroups,
      productCount: products.length,
      vendorCount: vendorGroups.length,
    };
  } catch {
    return {
      marketplaceError: true,
      vendors: [],
      productCount: 0,
      vendorCount: 0,
    };
  }
}
