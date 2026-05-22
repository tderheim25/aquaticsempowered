import { readSuperAdminOrgCookie } from "@/lib/auth/activeOrg";
import { isUuid } from "@/lib/auth/activeOrgShared";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveTargetOrgId(
  profile: { org_id: string | null; role: string },
  formOrgId?: string | null
): Promise<string | null> {
  if (profile.org_id) return profile.org_id;
  if (profile.role !== "super_admin") return null;

  const requested = formOrgId?.trim() || (await readSuperAdminOrgCookie());
  if (!isUuid(requested)) return null;

  const admin = createAdminClient();
  const { data } = await admin.from("organizations").select("id").eq("id", requested).maybeSingle();
  return data?.id ?? null;
}
