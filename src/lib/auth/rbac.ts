import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, org_id, role, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return profile;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/app");
  }
  return user;
}

export async function requireRole(allowed: UserRole | UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?next=/app");
  }
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(profile.role)) {
    redirect("/app");
  }
  return profile;
}

export async function requireOrg() {
  const profile = await getCurrentProfile();
  if (!profile?.org_id) {
    redirect("/app");
  }
  return profile;
}
