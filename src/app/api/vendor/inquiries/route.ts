import { NextResponse } from "next/server";

import { getVendorSessionForApi } from "@/lib/auth/vendorPortal";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getVendorSessionForApi();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { vendorId } = session;
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("vendor_product_inquiries")
    .select(
      `id, vendor_id, product_id, from_user_id, from_name, from_email, from_org_name, message, status, created_at, updated_at,
       vendor_products ( id, name, image_url )`
    )
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }

  return NextResponse.json({ inquiries: rows ?? [] });
}
