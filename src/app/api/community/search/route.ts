import { NextResponse } from "next/server";

import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { createClient } from "@/lib/supabase/server";

export type CommunitySearchResult =
  | { type: "user"; id: string; label: string; subtitle: string; href: string }
  | { type: "vendor"; id: string; label: string; subtitle: string; href: string }
  | { type: "organization"; id: string; label: string; subtitle: string; href: string };

function escapeIlike(q: string) {
  return q.replace(/[%_\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!canUsePublicCommunity(user.id, profile)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] as CommunitySearchResult[] });
  }

  const pattern = `%${escapeIlike(q)}%`;
  const supabase = await createClient();
  const results: CommunitySearchResult[] = [];

  const userSelect = "id, full_name, email, first_name, last_name, org_id";
  const userLimit = 8;
  const orgFilter = profile.org_id
    ? { column: "org_id" as const, value: profile.org_id }
    : { column: "org_id" as const, value: null as null };

  const baseUserQuery = () => {
    let q = supabase.from("users").select(userSelect).neq("id", profile.id).limit(userLimit);
    if (orgFilter.value === null) {
      q = q.is("org_id", null);
    } else {
      q = q.eq("org_id", orgFilter.value);
    }
    return q;
  };

  const [byName, byEmail, byFirst, byLast] = await Promise.all([
    baseUserQuery().ilike("full_name", pattern),
    baseUserQuery().ilike("email", pattern),
    baseUserQuery().ilike("first_name", pattern),
    baseUserQuery().ilike("last_name", pattern),
  ]);

  type UserRow = {
    id: string;
    full_name: string | null;
    email: string;
    first_name: string | null;
    last_name: string | null;
    org_id: string | null;
  };

  const userById = new Map<string, UserRow>();
  for (const row of [...(byName.data ?? []), ...(byEmail.data ?? []), ...(byFirst.data ?? []), ...(byLast.data ?? [])]) {
    userById.set(row.id, row as UserRow);
  }
  const userRows = [...userById.values()].slice(0, userLimit);
  for (const u of userRows ?? []) {
    const label =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.full_name?.trim() ||
      u.email.split("@")[0] ||
      "Member";
    results.push({
      type: "user",
      id: u.id,
      label,
      subtitle: u.email,
      href: `/app/community/profile/${u.id}`,
    });
  }

  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("id, name, category, region")
    .eq("listing_visible", true)
    .ilike("name", pattern)
    .order("name", { ascending: true })
    .limit(6);

  for (const v of vendorRows ?? []) {
    const subtitle = [v.category, v.region].filter(Boolean).join(" · ") || "Vendor partner";
    results.push({
      type: "vendor",
      id: v.id,
      label: v.name,
      subtitle,
      href: "/vendors",
    });
  }

  let orgQuery = supabase.from("organizations").select("id, name, tier").ilike("name", pattern).limit(6);
  if (profile.role !== "super_admin") {
    if (!profile.org_id) {
      return NextResponse.json({ results });
    }
    orgQuery = orgQuery.eq("id", profile.org_id);
  }

  const { data: orgRows } = await orgQuery;
  for (const o of orgRows ?? []) {
    results.push({
      type: "organization",
      id: o.id,
      label: o.name,
      subtitle: o.tier ? `Organization · ${o.tier}` : "Organization",
      href: "/app",
    });
  }

  return NextResponse.json({ results });
}
