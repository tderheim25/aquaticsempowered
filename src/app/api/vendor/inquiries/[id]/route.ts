import { NextResponse } from "next/server";

import { getVendorSessionForApi } from "@/lib/auth/vendorPortal";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getVendorSessionForApi();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { vendorId } = session;
  const { id } = await params;

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = String(body.status ?? "").trim();
  if (!["open", "read", "resolved"].includes(status)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_product_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, inquiry: data });
}
