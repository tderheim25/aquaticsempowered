import { NextResponse } from "next/server";

import { getSessionUser, getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE = 4000;

export async function POST(req: Request) {
  let body: {
    productId?: string;
    message?: string;
    fromName?: string;
    fromEmail?: string;
    fromOrgName?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const productId = String(body.productId ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, MAX_MESSAGE);
  if (!productId || message.length < 3) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("vendor_products")
    .select("id, vendor_id, name, is_visible, vendors!inner ( id, listing_visible )")
    .eq("id", productId)
    .maybeSingle();

  if (!product || !product.is_visible) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  const vendorJoin = product.vendors as { id: string; listing_visible: boolean } | { id: string; listing_visible: boolean }[];
  const vendorMeta = Array.isArray(vendorJoin) ? vendorJoin[0] : vendorJoin;
  if (!vendorMeta?.listing_visible) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  const sessionUser = await getSessionUser();
  const profile = sessionUser ? await getUsersRowWithAdminFallback(sessionUser.id) : null;

  let fromName = String(body.fromName ?? "").trim();
  let fromEmail = String(body.fromEmail ?? "").trim().toLowerCase();
  let fromUserId: string | null = sessionUser?.id ?? null;
  let fromOrgName = String(body.fromOrgName ?? "").trim() || null;

  if (profile) {
    fromName =
      profile.full_name?.trim() ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email.split("@")[0] ||
      "Member";
    fromEmail = profile.email;
    if (profile.org_id) {
      const { data: org } = await admin.from("organizations").select("name").eq("id", profile.org_id).maybeSingle();
      fromOrgName = org?.name ?? fromOrgName;
    }
  } else {
    if (!fromName || !fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
      return NextResponse.json({ error: "contact_required" }, { status: 400 });
    }
  }

  const supabase = sessionUser ? await createClient() : admin;
  const { data: inserted, error } = await supabase
    .from("vendor_product_inquiries")
    .insert({
      vendor_id: product.vendor_id,
      product_id: productId,
      from_user_id: fromUserId,
      from_name: fromName,
      from_email: fromEmail,
      from_org_name: fromOrgName,
      message,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
