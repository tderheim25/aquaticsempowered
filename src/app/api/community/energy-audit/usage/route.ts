import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/rbac";
import {
  buildCommunityEnergyAuditUsage,
  countCommunityEnergyAuditsToday,
} from "@/lib/energy-audit/communityAuditLimits";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      buildCommunityEnergyAuditUsage(0, false),
    );
  }

  try {
    const admin = createAdminClient();
    const used = await countCommunityEnergyAuditsToday(admin, user.id);
    return NextResponse.json(buildCommunityEnergyAuditUsage(used, true));
  } catch (e) {
    console.error("[community/energy-audit/usage]", e);
    return NextResponse.json({ error: "Could not load usage." }, { status: 500 });
  }
}
