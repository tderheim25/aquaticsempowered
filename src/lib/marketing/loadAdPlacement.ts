import { createClient } from "@/lib/supabase/server";

import type { AdPlacementRow } from "./adPlacementTypes";

export type { AdPlacementRow };

export async function loadActiveAdPlacement(slotKey: string): Promise<AdPlacementRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_placements")
    .select("id, slot_key, title, image_url, target_url")
    .eq("slot_key", slotKey)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
