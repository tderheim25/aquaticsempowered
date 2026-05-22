import type { SupabaseClient } from "@supabase/supabase-js";

import { homePathForRole } from "@/lib/auth/homePath";
import type { UserRole } from "@/types/database";

export async function getUserRoleForMiddleware(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
  return (data?.role as UserRole | undefined) ?? null;
}

export async function homePathForUserId(supabase: SupabaseClient, userId: string): Promise<string> {
  const role = await getUserRoleForMiddleware(supabase, userId);
  return homePathForRole(role);
}
