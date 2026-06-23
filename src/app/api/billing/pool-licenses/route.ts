import { NextResponse } from "next/server";

import { requireBillingApiContext } from "@/lib/auth/billingApi";
import { getPoolLicenseSnapshot } from "@/lib/billing/poolLicenses";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export async function GET() {
  const auth = await requireBillingApiContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit(`pool-licenses-read:${auth.ctx.userId}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  const snapshot = await getPoolLicenseSnapshot(auth.ctx.orgId);
  return NextResponse.json(snapshot);
}
