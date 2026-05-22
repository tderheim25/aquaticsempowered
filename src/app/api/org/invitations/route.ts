import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/rbac";
import { loadPendingInvitationsForEmail } from "@/lib/orgInvitations";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ items: [] });
  }
  const items = await loadPendingInvitationsForEmail(user.email);
  return NextResponse.json({ items, total: items.length });
}
